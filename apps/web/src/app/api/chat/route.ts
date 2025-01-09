import { Annotation, StateGraph } from "@langchain/langgraph";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import {
  RemoveMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { MessagesAnnotation } from "@langchain/langgraph";
import { isAIMessage } from "@langchain/core/messages";
import { prettyPrint } from "@/utils/graph";
import { env } from "@/env";
import { StreamTextResult } from "ai";
import { LangChainAdapter } from "ai";
import { streamText } from "ai";
import type { Message } from "ai";
import {
  AIMessage,
  BaseMessage,
  ChatMessage,
  HumanMessage,
} from "@langchain/core/messages";

/**
 * Converts a Vercel message to a LangChain message.
 * @param message - The message to convert.
 * @returns The converted LangChain message.
 */
const convertVercelMessageToLangChainMessage = (
  message: Message
): BaseMessage => {
  switch (message.role) {
    case "user":
      return new HumanMessage({ content: message.content });
    case "assistant":
      return new AIMessage({ content: message.content });
    default:
      return new ChatMessage({ content: message.content, role: message.role });
  }
};
/**
 * Converts a LangChain message to a Vercel message.
 * @param message - The message to convert.
 * @returns The converted Vercel message.
 */
const convertLangChainMessageToVercelMessage = (message: BaseMessage) => {
  switch (message.getType()) {
    case "human":
      return { content: message.content, role: "user" };
    case "ai":
      return {
        content: message.content,
        role: "assistant",
        tool_calls: (message as AIMessage).tool_calls,
      };
    default:
      return { content: message.content, role: message._getType() };
  }
};

const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  summary: Annotation<string>({
    reducer: (_, action) => action,
    default: () => "",
  }),
});
const retrieveSchema = z.object({ query: z.string() });

export async function POST(req: Request) {
  const { messages } = (await req.json()) as any;

  // Define the pre-requisites
  const supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  const embeddings = new OpenAIEmbeddings();
  const checkpointerFromConnString = PostgresSaver.fromConnString(
    env.DATABASE_URL
  );
  // ** checkpointerFromConnString.setup(); -> Uncomment this when running the first time
  const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabaseClient,
    tableName: "documents",
    queryName: "match_documents",
  });

  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0,
  });

  const config = {
    configurable: { thread_id: "d8b3c1a2-f5e7-4f9d-b6c8-a9e2d4f3b5c8" }, // should be the same for a particular conversation
  };

  // ** Define nodes for the graph

  // agent node
  async function queryOrRespond(
    state: typeof GraphAnnotation.State
  ): Promise<Partial<typeof GraphAnnotation.State>> {
    console.log("---CALLING FROM QUERY OR RESPOND---");
    const { summary } = state;
    let { messages } = state;

    if (summary) {
      const systemMessage = new SystemMessage({
        id: uuidv4(),
        content: `Summary of the conversation earlier: ${summary}`,
      });
      messages = [systemMessage, ...messages];
    }

    const modelWithTools = model.bindTools([retrieve]);
    const response = await modelWithTools.invoke(messages);

    return { messages: [response] };
  }

  // summarize conversation node
  async function summarizeConversation(state: typeof GraphAnnotation.State) {
    console.log("---CALLING FROM SUMMARIZE CONVERSATION---");
    const { summary, messages } = state;

    let summaryMessage: string;

    if (summary) {
      console.log("---SUMMARY EXISTS---");
      summaryMessage =
        `This is the summary of the conversation to date: ${summary}\n\n` +
        "Extend the summary by taking into accocunt the new messages above:";
    } else {
      console.log("---SUMMARY DOES NOT EXIST---");
      summaryMessage = "Create a summary of the conversation above:";
    }

    console.log("---SUMMARY MESSAGE---", summaryMessage);

    const allMessages = [
      ...messages,
      new HumanMessage({
        id: uuidv4(),
        content: summaryMessage,
      }),
    ];

    const response = await model.invoke(allMessages);

    if (typeof response.content !== "string") {
      throw new Error("Expected a string response from the model");
    }

    return { summary: response.content };
  }

  // generate node
  async function generate(state: typeof GraphAnnotation.State) {
    console.log("---CALLING FROM GENERATE---");
    // Get recent tool messages
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

    const docsContent = toolMessages.map((doc) => doc.content).join("\n");

    // Include summary in system message if it exists
    const summaryContext = state.summary
      ? `Previous conversation summary: ${state.summary}\n\n`
      : "";

    console.log("---SUMMARY CONTEXT FROM GENERATE---", summaryContext);

    const systemMessageContent =
      "You are an assistant for question-answering tasks. " +
      "Use the following pieces of retrieved context and conversation summary to answer " +
      "the question. If the context is not relevant, say that you " +
      "don't know. Use three sentences maximum and keep the " +
      "answer concise." +
      "\n\n" +
      summaryContext +
      `Retrieved context: ${docsContent}`;

    // Rest of the function remains the same
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

    const response = await model.invoke(prompt);
    return { messages: [response] };
  }

  // conditional edge node
  async function shouldContinue(
    state: typeof GraphAnnotation.State
  ): Promise<"summarize_conversation" | "tools" | "__end__"> {
    console.log("---CALLING FROM SHOULD CONTINUE---");
    const lastMessage = state.messages[state.messages.length - 1];
    if (isAIMessage(lastMessage) && (lastMessage.tool_calls?.length ?? 0) > 0) {
      console.log("---USING TOOLS---");
      return "tools";
    }
    console.log("---NOT USING TOOLS---");
    return state.messages.length > 6 ? "summarize_conversation" : "__end__";
  }

  // ** Define tools
  const retrieve = tool(
    async ({ query }) => {
      const retrievedDocs = await vectorStore.similaritySearch(query);
      const serialized = retrievedDocs
        .map(
          (doc) => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`
        )
        .join("\n");
      console.log("---RETRIEVED DOCS---");
      return [serialized, retrievedDocs];
    },
    {
      name: "retrieve",
      description: "Retrieve information related to a query.",
      schema: retrieveSchema,
      responseFormat: "content_and_artifact",
    }
  );
  const tools = new ToolNode([retrieve]);

  const graphBuilder = new StateGraph(GraphAnnotation)
    .addNode("queryOrRespond", queryOrRespond)
    .addNode("summarize_conversation", summarizeConversation)
    .addNode("tools", tools)
    .addNode("generate", generate)
    .addEdge("__start__", "queryOrRespond")
    .addConditionalEdges("queryOrRespond", shouldContinue, {
      tools: "tools",
      summarize_conversation: "summarize_conversation",
      __end__: "__end__",
    })
    .addEdge("summarize_conversation", "__end__")
    .addEdge("tools", "generate")
    .addEdge("generate", "__end__");

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
      let lastContent = ""; // Track the last content to avoid duplicates

      for await (const step of await graph.stream(
        { messages: [...history, new HumanMessage(userInput)] },
        {
          streamMode: "values",
          configurable: config.configurable,
        }
      )) {
        const lastMessage = step.messages[step.messages.length - 1];
        if (isAIMessage(lastMessage)) {
          // Only send if content is different from last message
          if (lastMessage.content !== lastContent) {
            const vercelMessage =
              convertLangChainMessageToVercelMessage(lastMessage);
            controller.enqueue(vercelMessage);
            lastContent = lastMessage.content as string;
          }
        }
      }
      controller.close();
    },
  });

  return LangChainAdapter.toDataStreamResponse(transformStream);
}
