import { task } from "@trigger.dev/sdk/v3";
import axios from "axios";
import { env } from "@/env";

interface CreateEmbeddingsPayload {
  prompt: string;
}

export const createEmbeddings = task({
  id: "create-embeddings",
  maxDuration: 300,
  run: async (payload: CreateEmbeddingsPayload, { ctx }) => {
    const { prompt } = payload;

    const searchResponse = await axios.post(`${env.API_URL}/search`, null, {
      params: { query: prompt },
    });
    const papers = searchResponse.data.results;

    await axios.post(`${env.API_URL}/store`, {
      research_urls: papers,
    });

    return {
      message: "Embeddings created successfully.",
      status: 200,
    };
  },
});
