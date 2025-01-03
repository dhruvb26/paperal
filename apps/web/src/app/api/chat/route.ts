import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { Document } from "@langchain/core/documents";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { concat } from "@langchain/core/utils/stream";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { MessagesAnnotation } from "@langchain/langgraph";
import { BaseMessage, isAIMessage } from "@langchain/core/messages";

const InputStateAnnotation = Annotation.Root({
  question: Annotation<string>,
});

const StateAnnotation = Annotation.Root({
  question: Annotation<string>,
  context: Annotation<Document[]>,
  answer: Annotation<string>,
  scores: Annotation<number[]>,
});

export async function POST(req: Request) {
  const retrieveSchema = z.object({ query: z.string() });
  const prettyPrint = (message: BaseMessage) => {
    let txt = `[${message._getType()}]: ${message.content}`;
    if ((isAIMessage(message) && message.tool_calls?.length) || 0 > 0) {
      const tool_calls = (message as AIMessage)?.tool_calls
        ?.map((tc) => `- ${tc.name}(${JSON.stringify(tc.args)})`)
        .join("\n");
      txt += ` \nTools: \n${tool_calls}`;
    }
    console.log(txt);
  };
  // const { question } = (await req.json()) as { question: string };

  const supabaseClient = createClient(
    "https://qzjcxiocsvcdftgnwmxx.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6amN4aW9jc3ZjZGZ0Z253bXh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3OTQ0NzEsImV4cCI6MjA0OTM3MDQ3MX0.0hlNSki8B4OAAV2-uKoDnnjvmPwmJI8AW4kGuPGa-5A"
  );

  const embeddings = new OpenAIEmbeddings();

  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
  });

  const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabaseClient,
    tableName: "documents",
    queryName: "match_documents",
  });

  const promptTemplate = await pull<ChatPromptTemplate>("rlm/rag-prompt");

  const retrieve = tool(
    async ({ query }) => {
      const retrievedDocs = await vectorStore.similaritySearch(query);
      const serialized = retrievedDocs
        .map(
          (doc) => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`
        )
        .join("\n");
      return [serialized, retrievedDocs];
    },
    {
      name: "retrieve",
      description: "Retrieve information related to a query.",
      schema: retrieveSchema,
      responseFormat: "content_and_artifact",
    }
  );

  // Step 1: Generate an AIMessage that may include a tool-call to be sent.
  async function queryOrRespond(state: typeof MessagesAnnotation.State) {
    const llmWithTools = llm.bindTools([retrieve]);
    const response = await llmWithTools.invoke(state.messages);
    // MessagesState appends messages to state instead of overwriting
    return { messages: [response] };
  }

  // Step 2: Execute the retrieval.
  const tools = new ToolNode([retrieve]);

  async function generate(state: typeof MessagesAnnotation.State) {
    // Get generated ToolMessages
    let recentToolMessages = [];
    for (let i = state["messages"].length - 1; i >= 0; i--) {
      let message = state["messages"][i];
      if (message instanceof ToolMessage) {
        recentToolMessages.push(message);
      } else {
        break;
      }
    }
    let toolMessages = recentToolMessages.reverse();

    // Format into prompt
    const docsContent = toolMessages.map((doc) => doc.content).join("\n");
    const systemMessageContent =
      "You are an assistant for question-answering tasks. " +
      "Use the following pieces of retrieved context to answer " +
      "the question. If the context is not relevant, say that you " +
      "don't know. Use three sentences maximum and keep the " +
      "answer concise." +
      "\n\n" +
      `${docsContent}`;

    const conversationMessages = state.messages.filter(
      (message) =>
        message instanceof HumanMessage ||
        message instanceof SystemMessage ||
        (message instanceof AIMessage && message.tool_calls?.length === 0)
    );
    const prompt = [
      new SystemMessage(systemMessageContent),
      ...conversationMessages,
    ];

    // Run
    const response = await llm.invoke(prompt);
    return { messages: [response] };
  }
  const graphBuilder = new StateGraph(MessagesAnnotation)
    .addNode("queryOrRespond", queryOrRespond)
    .addNode("tools", tools)
    .addNode("generate", generate)
    .addEdge("__start__", "queryOrRespond")
    .addConditionalEdges("queryOrRespond", toolsCondition, {
      __end__: "__end__",
      tools: "tools",
    })
    .addEdge("tools", "generate")
    .addEdge("generate", "__end__");

  const graph = graphBuilder.compile();

  let inputs = {
    messages: [
      new HumanMessage("What's the experimental setup of dataset inference?"),
    ],
  };
  for await (const step of await graph.stream(inputs, {
    streamMode: "values",
  })) {
    const lastMessage = step.messages[step.messages.length - 1];
    prettyPrint(lastMessage);
    console.log("-----\n");
  }

  return NextResponse.json({ status: 200 });
}
