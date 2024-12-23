import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const text = "Hello, world!";

      // Stream the text character by character
      for (const char of text) {
        controller.enqueue(encoder.encode(char));
        await new Promise((resolve) => setTimeout(resolve, 100)); // Add delay between characters
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
