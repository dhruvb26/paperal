import { OpenAIEmbeddings } from "@langchain/openai";
import { tavily } from "@tavily/core";
import { NextResponse } from "next/server";
import { Annotation } from "@langchain/langgraph";
import { DocumentInterface } from "@langchain/core/documents";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { Document } from "@langchain/core/documents";
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { pull } from "langchain/hub";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { formatDocumentsAsString } from "langchain/util/document";
import { END, START, StateGraph } from "@langchain/langgraph";

export async function POST(req: Request) {
  const model = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.3,
    apiKey: process.env.OPENAI_API_KEY,
  });

  const urls = [
    "https://arxiv.org/pdf/1610.05820",
    "https://arxiv.org/pdf/2409.19798",
    "https://www.sciencedirect.com/science/article/pii/S2949715924000064",
  ];

  const docs = await Promise.all(
    urls.map(async (url, docIndex) => {
      const loadedDocs = await new CheerioWebBaseLoader(url).load();
      return loadedDocs.map((doc) => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          doc_id: `doc_${docIndex}`,
          source_url: url,
        },
      }));
    })
  );
  const docsList = docs.flat();

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 200,
  });
  const docSplits = await textSplitter.splitDocuments(docsList);

  const docSplitsWithIds = docSplits.map((doc, chunkIndex) => {
    return new Document({
      pageContent: doc.pageContent,
      metadata: {
        ...doc.metadata,
        chunk_id: `chunk_${doc.metadata.doc_id}_${chunkIndex}`,
      },
    });
  });

  // Add to vectorDB
  const vectorStore = await MemoryVectorStore.fromDocuments(
    docSplitsWithIds,
    new OpenAIEmbeddings()
  );

  const retriever = vectorStore.asRetriever({});

  const GraphState = Annotation.Root({
    documents: Annotation<DocumentInterface[]>({
      reducer: (x, y) => y ?? x ?? [],
    }),
    // pass the question to the retrieve node
    question: Annotation<string>({
      reducer: (x, y) => y ?? x ?? "",
    }),
    generation: Annotation<string>({
      reducer: (x, y) => y ?? x,
    }),
  });

  /**
   * Retrieve documents
   *
   * @param {typeof GraphState.State} state The current state of the graph.
   * @param {RunnableConfig | undefined} config The configuration object for tracing.
   * @returns {Promise<Partial<typeof GraphState.State>>} The new state object.
   */
  async function retrieve(
    state: typeof GraphState.State
  ): Promise<Partial<typeof GraphState.State>> {
    console.log("---RETRIEVE---");

    const documents = await retriever
      .withConfig({ runName: "FetchRelevantDocuments" })
      .invoke(state.question);

    return {
      documents,
    };
  }

  /**
   * Generate completion
   *
   * @param {typeof GraphState.State} state The current state of the graph.
   * @param {RunnableConfig | undefined} config The configuration object for tracing.
   * @returns {Promise<Partial<typeof GraphState.State>>} The new state object.
   */
  async function generate(
    state: typeof GraphState.State
  ): Promise<Partial<typeof GraphState.State>> {
    console.log("---GENERATE---");

    console.log("---DOCUMENTS USED FOR GENERATION---");
    state.documents.forEach((doc) => {
      console.log(
        `\nDocument (${doc.metadata.doc_id}) - Chunk (${doc.metadata.chunk_id}):`
      );
      console.log("Source URL:", doc.metadata.source_url);
    });

    const prompt = await pull<ChatPromptTemplate>("khoj_ai_gen");
    // Construct the RAG chain by piping the prompt, model, and output parser
    const ragChain = prompt.pipe(model).pipe(new StringOutputParser());

    const generation = await ragChain.invoke({
      context: formatDocumentsAsString(state.documents),
      question: state.question,
    });

    return {
      generation,
    };
  }

  /**
   * Determines whether the retrieved documents are relevant to the question.
   *
   * @param {typeof GraphState.State} state The current state of the graph.
   * @param {RunnableConfig | undefined} config The configuration object for tracing.
   * @returns {Promise<Partial<typeof GraphState.State>>} The new state object.
   */
  async function gradeDocuments(
    state: typeof GraphState.State
  ): Promise<Partial<typeof GraphState.State>> {
    console.log("---CHECK RELEVANCE---");

    // pass the name & schema to `withStructuredOutput` which will force the model to call this tool.
    const llmWithTool = model.withStructuredOutput(
      z
        .object({
          binaryScore: z
            .enum(["yes", "no"])
            .describe("Relevance score 'yes' or 'no'"),
        })
        .describe(
          "Grade the relevance of the retrieved documents to the question. Either 'yes' or 'no'."
        ),
      {
        name: "grade",
      }
    );

    const prompt = ChatPromptTemplate.fromTemplate(
      `You are a grader assessing relevance of a retrieved document to a user's research question.
        Here is the retrieved document:
    
        {context}
    
        Here is the user's research question: {question}
    
        If the document contains keyword(s) or semantic meaning related to the user's research question, grade it as relevant.
        Give a binary score 'yes' or 'no' score to indicate whether the document is relevant to the question.`
    );

    // Chain
    const chain = prompt.pipe(llmWithTool);

    const filteredDocs: Array<DocumentInterface> = [];
    for await (const doc of state.documents) {
      const grade = await chain.invoke({
        context: doc.pageContent,
        question: state.question,
      });
      if (grade.binaryScore === "yes") {
        console.log("---GRADE: DOCUMENT RELEVANT---");
        filteredDocs.push(doc);
      } else {
        console.log("---GRADE: DOCUMENT NOT RELEVANT---");
      }
    }

    return {
      documents: filteredDocs,
    };
  }

  const workflow = new StateGraph(GraphState)
    // Define the nodes
    .addNode("retrieve", retrieve)
    .addNode("gradeDocuments", gradeDocuments)
    .addNode("generate", generate);

  // Build graph
  workflow.addEdge(START, "retrieve");
  workflow.addEdge("retrieve", "gradeDocuments");
  workflow.addEdge("gradeDocuments", "generate");
  workflow.addEdge("generate", END);

  // Compile
  const app = workflow.compile();

  const inputs = {
    question:
      "Membership Inference Techniques in Language Models. Membership inference attacks have become a critical area of study, as they aim to determine whether a specific data point was part of the training dataset of a machine learning model, raising significant privacy concerns. These attacks exploit the vulnerabilities in model training processes, highlighting the need for robust privacy-preserving methods in the deployment of language models. On the other hand Dataset Inference refers to ",
  };

  const config = { recursionLimit: 50 };
  let finalGeneration;
  for await (const output of await app.stream(inputs, config)) {
    for (const [key, value] of Object.entries(output)) {
      console.log(`Node: '${key}'`);
      // Optional: log full state at each node
      // console.log(JSON.stringify(value, null, 2));
      finalGeneration = value;
    }
    console.log("\n---\n");
  }

  // Log the final generation.
  console.log(JSON.stringify(finalGeneration, null, 2));

  return NextResponse.json(finalGeneration);
}
