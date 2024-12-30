import { ChatOpenAI } from "@langchain/openai";
import { Message } from "ai";
import { BytesOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { NextResponse } from "next/server";
import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from "@langchain/langgraph";

export const maxDuration = 30;
import { v4 as uuidv4 } from "uuid";
import { v5 as uuidv5 } from "uuid";

export async function POST(req: Request) {
  const config = { configurable: { thread_id: "123" } };

  const llm = new ChatOpenAI({
    modelName: "gpt-4-turbo-preview",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Get the messages from the request body
  const messages = [{ role: "user", content: "My name is Dhruv." }];

  const messages2 = [{ role: "user", content: "What's my name?" }];

  const callModel = async (state: typeof MessagesAnnotation.State) => {
    const response = await llm.invoke(state.messages);
    return { messages: response };
  };

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("model", callModel)
    .addEdge(START, "model")
    .addEdge("model", END);

  // Add memory
  const memory = new MemorySaver();
  const app = workflow.compile({ checkpointer: memory });

  // Pass the messages in the correct format
  const output1 = await app.invoke({ messages: messages }, config);
  const output2 = await app.invoke({ messages: messages2 }, config);
  console.log(output1.messages[output1.messages.length - 1]);
  console.log(output2.messages[output2.messages.length - 1]);
  return NextResponse.json(output2.messages[output2.messages.length - 1]);
}
