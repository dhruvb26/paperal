import { NextResponse } from "next/server";
import { env } from "@/env";
import axios from "axios";

export async function POST(request: Request) {
  // const response = await axios.post(
  //   `${env.API_URL}/search?query=AI in sustainability.`
  // );
  // const results = response.data.results;

  // const storeResponse = await axios.post(`${env.API_URL}/store`, {
  //   research_urls: results,
  // });

  // return NextResponse.json(storeResponse.data);

  // timeout for 10 seconds
  // await new Promise((resolve) => setTimeout(resolve, 10000));

  const body = (await request.json()) as { previousText: string };

  console.log(body.previousText);

  const suggestion = await axios.post(
    `https://e4cf-153-33-229-22.ngrok-free.app/generate`,
    {
      previous_text: body.previousText,
      heading: "Membership Inference in Black Box Language Models",
    }
  );

  console.log(suggestion.data.ai_sentence);

  return NextResponse.json(suggestion.data.ai_sentence);
}
