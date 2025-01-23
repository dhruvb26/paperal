import { Annotation, END, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { MessagesAnnotation } from "@langchain/langgraph";
import { isAIMessage, SystemMessage } from "@langchain/core/messages";
import { env } from "@/env";
import { LangChainAdapter } from "ai";
import type { Message } from "ai";
import { HumanMessage } from "@langchain/core/messages";
import { NextResponse } from "next/server";
import { citationsTable, documentsTable, embeddingsTable } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import {
  convertVercelMessageToLangChainMessage,
  convertLangChainMessageToVercelMessage,
  convertToMarkdown,
} from "@/utils/lang";
import * as hub from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import fs from "fs";

const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
});

export async function POST(req: Request) {
  const { messages, userSentence, documentId, userId } =
    (await req.json()) as any;

  const documentContent = await db.query.documentsTable.findFirst({
    where: eq(documentsTable.id, documentId),
  });

  const markdownDocumentContent = await convertToMarkdown(
    documentContent?.content
  );

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

  // checkpointerFromConnString.setup();

  // const vectorStore = new SupabaseVectorStore(embeddings, {
  //   client: supabaseClient,
  //   tableName: "embeddings",
  //   queryName: "hybrid_search",
  // });

  // ** Define tools

  const retrievePdf = tool(
    async ({ embedding }: { embedding: string }) => {
      try {
        console.log("---RETRIEVE PDF---");
        const embeddingRow = await db.query.embeddingsTable.findFirst({
          where: eq(embeddingsTable.content, embedding ?? ""),
        });

        if (!embeddingRow) {
          console.log("---NO EMBEDDING FOUND---");
          return "No embedding found";
        }

        const embeddingMetadata = embeddingRow?.metadata as EmbeddingMetadata;

        const response = await fetch(embeddingMetadata.source);
        const blob = await response.blob();
        const pdfLoader = new WebPDFLoader(blob);
        const pdf = await pdfLoader.load();

        const pdfText = pdf.map((page) => page.pageContent).join("\n");

        return pdfText.slice(0, 2000);
      } catch (error) {
        console.error("Error retrieving PDF:", error);
        return "Error retrieving PDF";
      }
    },
    {
      name: "retrievePdf",
      description:
        "Retrieve the pdf of the paper used to extract the embedding above",
      schema: z.object({
        embedding: z.string(),
      }),
      responseFormat: "content",
    }
  );

  const toolsNode = new ToolNode([retrievePdf]);

  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0,
  }).bind(toolsNode);

  // make a configurable object with thread_id as the user_id + document_id
  const config = {
    configurable: { thread_id: userId + documentId }, // should be the same for a particular conversation
  };

  // ** Define nodes for the graph
  // agent node
  async function queryOrRespond(
    state: typeof GraphAnnotation.State
  ): Promise<Partial<typeof GraphAnnotation.State>> {
    const { messages } = state;

    console.log("---QUERY OR RESPOND---");

    let citationSentence;
    let usedEmbedding;

    if (userSentence) {
      citationSentence = await db.query.citationsTable.findFirst({
        where: eq(citationsTable.sentence, userSentence.split("(")[0].trim()),
      });
      usedEmbedding = citationSentence?.context;
    }

    const systemMessageContent = `
      You are a chatbot. You help users answer questions about a document they are writing and citations they have made in the document. 

      You will use the following context to answer any user questions: 

      <document>
      ${markdownDocumentContent}
      </document>

      ${
        userSentence
          ? `
      <citation>
      ${citationSentence?.sentence}
      </citation>

      <embedding>
      ${usedEmbedding}
      </embedding>
      (This is the embedding used to generate the citation above)
      `
          : ""
      }

      Keep in mind the following rules when answering the user's question:
        - The response should be relevant, concise and to the point. 
        - The response should be formatted correctly in markdown. 
        - Use bullet points, numbered lists, and spacing to make the response more readable.
      `;

    const response = await model.invoke([
      new SystemMessage(systemMessageContent),
      ...messages,
    ]);
    console.log("---RESPONSE FROM QUERY OR RESPOND---");
    return { messages: [response] };
  }

  // conditional edge node
  async function shouldContinue(
    state: typeof GraphAnnotation.State
  ): Promise<"tools" | "__end__"> {
    console.log("---SHOULD CONTINUE---");
    const lastMessage = state.messages[state.messages.length - 1];
    if (isAIMessage(lastMessage) && (lastMessage.tool_calls?.length ?? 0) > 0) {
      console.log("---DECISION: RETRIEVE---");
      return "tools";
    }
    console.log("---DECISION: END---");
    return "__end__";
  }

  // Save the image of the graph to a file
  const graphBuilder = new StateGraph(GraphAnnotation)
    .addNode("agent", queryOrRespond)
    .addEdge("__start__", "agent")
    .addNode("tools", toolsNode as any)
    .addEdge("tools", "agent")
    .addConditionalEdges("agent", shouldContinue);

  const graph = graphBuilder.compile({
    checkpointer: checkpointerFromConnString,
  });

  const graphImage = graph.getGraph();
  const image = await graphImage.drawMermaidPng();
  const imageBuffer = await image.arrayBuffer();
  fs.writeFileSync("graph.png", Buffer.from(imageBuffer));

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
