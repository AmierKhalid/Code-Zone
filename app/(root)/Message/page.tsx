import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  findOrCreateDmConversation,
  getConversationListForUser,
} from "@/lib/messageData";
import MessagePageShell from "@/components/shared/messages/MessagePageShell";

export default async function MessagePage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const me = await db.user.findUnique({
    where: { accountId: userId },
    select: { id: true },
  });
  if (!me) redirect("/sign-in");

  const sp = await searchParams;
  let initialSelectedConversationId: string | null = null;

  if (sp.with && sp.with !== me.id) {
    const conv = await findOrCreateDmConversation(me.id, sp.with);
    if (conv) initialSelectedConversationId = conv.id;
  }

  const initialConversations = await getConversationListForUser(me.id);

  return (
    <MessagePageShell
      currentUserId={me.id}
      initialConversations={initialConversations}
      initialSelectedConversationId={initialSelectedConversationId}
    />
  );
}
