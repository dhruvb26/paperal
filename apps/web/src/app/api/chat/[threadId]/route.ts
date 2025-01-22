import { getChats } from "@/app/actions/chat";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threadId = req.nextUrl.pathname.split("/").pop();

  console.log(userId + threadId);

  const chats = await getChats(userId + threadId);

  return NextResponse.json(chats);
}
