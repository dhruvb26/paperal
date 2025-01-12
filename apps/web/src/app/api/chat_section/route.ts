import { NextResponse } from "next/server";
import { ContextChatEngine, Document, LlamaParseReader, VectorStoreIndex } from 'llamaindex';
import { auth } from "@clerk/nextjs/server";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import fs from 'fs';
export async function POST(req: Request) {
    const { userSentence } = (await req.json()) as any;
    // const { userId } = await auth()
    
    // if (!userId) {
    //     return new NextResponse("Unauthorized", { status: 401 });
    // }

    try {
        // Load PDF using Langchain's PDFLoader
        const path = process.cwd() + "/public/attention.pdf";
        // check if the file exists
        const fileExists = fs.existsSync(path);
        if (!fileExists) {
            console.log("File not found at:", path);
            return NextResponse.json({ 
                success: false, 
                error: `File not found at: ${path}` 
            });
        }

        // set up the llamaparse reader
        const reader = new LlamaParseReader({ resultType: "markdown" });
      
        // parse the document
        const documents = await reader.loadData(path);
    
        // Normalize userSentence once
        const index = await VectorStoreIndex.fromDocuments(documents);

        // Query the index
        const queryEngine = index.asQueryEngine();
        const { response, sourceNodes } = await queryEngine.query({
            query: "What are the different training methods mentioned in the document?",
        });

  // Output response with sources
        console.log(response);
    
        for (const doc of documents) {
            // Normalize content for the current page
    
            if (doc.text.includes(userSentence)) {
                return NextResponse.json({ 
                    pageNumber: documents.indexOf(doc)+1, // Use metadata directly
                    success: true 
                });
            }
        }
    
        // No match found
        return NextResponse.json({ 
            pageNumber: -1,
            success: false 
        });
    } catch (error: any) {
        console.error('Error processing PDF:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Unknown error occurred',
            stack: process.env.NODE_ENV === 'development' ? error : undefined
        });
    }
    

        // Convert Langchain documents to LlamaIndex documents
        // const llamaDocuments = docs.map((doc: any) => new Document({
        //     text: doc.pageContent,
        //     metadata: { page_number: doc.metadata.page }
        // }));
        
        // // Create a vector store index from the documents
        // const index = await VectorStoreIndex.fromDocuments(llamaDocuments);
        
        // // Create a chat engine
        // const chatEngine = new ContextChatEngine({ retriever: index.asRetriever() });

        // // Create a query that asks about the page number of the specific text
        // const query = `What page contains the text "${userSentence}"?`;
        
        // // Get response from the chat engine
        // const response = await chatEngine.chat({ message: query });
        
        // // Extract page number from the response
        // // Note: The AI might include the page number in its response
        // const pageInfo = llamaDocuments.find((doc: any) => 
        //     doc.text.toLowerCase().includes(userSentence.toLowerCase())
        // );

        // return NextResponse.json({ 
        //     pageNumber: pageInfo?.metadata?.page_number || -1,
        //     aiResponse: response.response,
        //     success: true 
        // });
    

}