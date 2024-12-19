import { NextResponse } from "next/server";

export async function GET() {
  // For testing, return a simple static suggestion

  // sleep for 10 seconds
  await new Promise((resolve) => setTimeout(resolve, 10000));
  const number = Math.random();
  return NextResponse.json(`${number} is awesome!`);
}
