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

  // const body = (await request.json()) as { previousText: string };

  // const suggestion = await axios.post(`${env.API_URL}/generate`, {
  //   previous_text: body.previousText,
  //   heading: "AI in healthcare",
  //   subheading: "",
  // });

  // console.log(suggestion);

  // return NextResponse.json(suggestion.data);

  return NextResponse.json("Hello world!");
}
