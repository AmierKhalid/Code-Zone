import { NextResponse } from "next/server";
import Pusher from "pusher";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

    const u = await db.user.findUnique({
      where: { accountId: clerkId },
      select: { id: true, name: true, image: true },
    });
    
    if (!u) return new NextResponse("Unauthorized", { status: 401 });

    const data = await request.text();
    const params = new URLSearchParams(data);
    const socketId = params.get("socket_id")!;
    const channelName = params.get("channel_name")!;

    const presenceData = {
      user_id: u.id,
      user_info: { id: u.id, name: u.name || "Collaborator", image: u.image || null },
    };

    const authResponse = pusher.authorizeChannel(
      socketId,
      channelName,
      presenceData
    );

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
