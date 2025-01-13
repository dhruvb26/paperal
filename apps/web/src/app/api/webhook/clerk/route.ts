import { env } from "@/env";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SIGNING_SECRET;

  if (!WEBHOOK_SECRET) {
    return new Response("Missing webhook secret", { status: 400 });
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  // Process the webhook event
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name } = evt.data;

    const fullName = `${first_name} ${last_name}`;

    await db
      .insert(usersTable)
      .values({
        id,
        email: email_addresses[0].email_address,
        name: fullName,
        metadata: {
          clerkId: id,
        },
      })
      .onConflictDoUpdate({
        target: [usersTable.id],
        set: {
          name: fullName,
        },
      });
  }

  if (eventType === "user.updated") {
    const { id, first_name, last_name } = evt.data;

    const fullName = `${first_name} ${last_name}`;

    await db
      .update(usersTable)
      .set({
        name: fullName,
      })
      .where(eq(usersTable.id, id));
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    if (!id) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await db
      .select({
        id: usersTable.id,
      })
      .from(usersTable)
      .where(eq(usersTable.id, id));

    if (user[0]) {
      await db.delete(usersTable).where(eq(usersTable.id, user[0].id));
    }
  }

  return NextResponse.json({ message: "Webhook processed" }, { status: 200 });
}
