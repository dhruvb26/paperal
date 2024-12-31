import { task } from "@trigger.dev/sdk/v3";
import { env } from "@/env";

interface CreateEmbeddingsPayload {
  prompt: string;
}

export const createEmbeddings = task({
  id: "create-embeddings",
  maxDuration: 300,
  run: async (payload: CreateEmbeddingsPayload, { ctx }) => {
    const { prompt } = payload;

    try {
      const searchResponse = await fetch(
        `${env.API_URL}/search/?query=${prompt}`,
        {
          method: "POST",
        }
      );
      const searchData = (await searchResponse.json()) as {
        results: string[];
      };
      const papers = searchData.results;

      await fetch(`${env.API_URL}/store`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          research_urls: papers,
        }),
      });

      return {
        message: "Embeddings created successfully.",
        status: 200,
      };
    } catch (error) {
      console.error("Error creating embeddings:", error);
      throw error;
    }
  },
});
