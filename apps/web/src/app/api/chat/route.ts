import { Annotation, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { MessagesAnnotation } from "@langchain/langgraph";
import { isAIMessage } from "@langchain/core/messages";
import { env } from "@/env";
import { LangChainAdapter } from "ai";
import type { Message } from "ai";
import { HumanMessage } from "@langchain/core/messages";
import { NextResponse } from "next/server";
import { documentsTable } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import {
  convertVercelMessageToLangChainMessage,
  convertLangChainMessageToVercelMessage,
  convertToMarkdown,
} from "@/utils/lang";
// import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";

const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
});

export async function POST(req: Request) {
  const { messages, userSentence, documentId, userId, title } =
    (await req.json()) as any;

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!documentId) {
    return new NextResponse("Document ID is required", { status: 400 });
  }

  // Define the pre-requisites
  // const supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  // const embeddings = new OpenAIEmbeddings();
  const checkpointerFromConnString = PostgresSaver.fromConnString(
    env.DATABASE_URL
  );
  // ** checkpointerFromConnString.setup(); -> Uncomment this when running the first time
  // const vectorStore = new SupabaseVectorStore(embeddings, {
  //   client: supabaseClient,
  //   tableName: "embeddings",
  //   queryName: "hybrid_search",
  // });

  // query database to get document content from document_id
  const documentContent = await db.query.documentsTable.findFirst({
    where: eq(documentsTable.id, documentId),
  });

  if (!documentContent?.content) {
    return new NextResponse("Document content is required", { status: 400 });
  }

  let result = convertToMarkdown(documentContent.content);

  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0,
  });

  // make a configurable object with thread_id as the user_id + document_id
  const config = {
    configurable: { thread_id: userId + documentId }, // should be the same for a particular conversation
  };

  // ** Define nodes for the graph

  // TODO: Fix the prompt
  // agent node
  async function query_or_respond(
    state: typeof GraphAnnotation.State
  ): Promise<Partial<typeof GraphAnnotation.State>> {
    const { messages } = state;

    const systemMessageContent =
      "You are an AI assistant helping users understand their documents and citations. " +
      "When users ask about citations, explain how they relate to the document content. " +
      "If asked about a specific citation, explain its context and relevance to the main document. " +
      // (result ? `\n\nHere is the main document content:\n\n${result}` : "") +
      // (sentence_embedding && userSentence
      //   ? `\n\nThe user is asking about this citation: "${userSentence}"\n\nHere is the original context that was used to generate this citation:\n\n${sentence_embedding[0].content}`
      //   : "") +
      "\n\nWhen explaining citations:\n" +
      "1. Compare the citation to the original context\n" +
      "2. Explain how it relates to the main document\n" +
      "3. Clarify if the citation accurately represents the source material";

    const response = await model.invoke(messages);
    return { messages: [response] };
  }

  // conditional edge node
  async function shouldContinue(
    state: typeof GraphAnnotation.State
  ): Promise<"tools" | "__end__"> {
    const lastMessage = state.messages[state.messages.length - 1];
    if (isAIMessage(lastMessage) && (lastMessage.tool_calls?.length ?? 0) > 0) {
      return "tools";
    }
    return "__end__";
  }

  // ** Define tools
  // const retrieve = tool(
  //   async ({ query }) => {
  //     const retrievedDocs = await vectorStore.similaritySearch(query);
  //     const serialized = retrievedDocs
  //       .map(
  //         (doc) => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`
  //       )
  //       .join("\n");
  //     console.log("---RETRIEVED DOCS---");
  //     return [serialized, retrievedDocs];
  //   },
  //   {
  //     name: "retrieve",
  //     description: "Retrieve information related to a query.",
  //     schema: retrieveSchema,
  //     responseFormat: "content_and_artifact",
  //   }
  // );
  // const tools = new ToolNode([retrieve]);

  const graphBuilder = new StateGraph(GraphAnnotation)
    .addNode("query_or_respond", query_or_respond)
    .addEdge("__start__", "query_or_respond")
    .addConditionalEdges("query_or_respond", shouldContinue, {
      __end__: "__end__",
    });
  // .addEdge("tools", "generate")
  // .addEdge("generate", "__end__");

  const graph = graphBuilder.compile({
    checkpointer: checkpointerFromConnString,
  });

  // Convert incoming messages to LangChain format
  const history = messages
    .slice(0, -1)
    .filter(
      (message: Message) =>
        message.role === "user" || message.role === "assistant"
    )
    .map(convertVercelMessageToLangChainMessage);

  const userInput = messages[messages.length - 1].content;

  // Create streaming response
  const transformStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const [message, metadata] of await graph.stream(
          { messages: [...history, new HumanMessage(userInput)] },
          {
            streamMode: "messages",
            configurable: config.configurable,
          }
        )) {
          if (
            isAIMessage(message) &&
            metadata?.langgraph_node !== "summarize_conversation"
          ) {
            const vercelMessage =
              convertLangChainMessageToVercelMessage(message);
            controller.enqueue(vercelMessage);
          }
        }
      } catch (error) {
        console.error("Streaming error:", error);
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });
  return LangChainAdapter.toDataStreamResponse(transformStream);
}
