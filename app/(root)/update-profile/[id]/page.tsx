import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

export default async function UpdateProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  const me = userId
    ? await db.user.findUnique({
        where: { accountId: userId },
        select: { id: true },
      })
    : null;

  if (!me || me.id !== id) {
    notFound();
  }

  return (
    <div className="flex flex-col items-center gap-6 py-14 px-5 max-w-lg mx-auto text-center">
      <h1 className="h3-bold md:h2-bold text-light-1">Edit profile</h1>
      <p className="text-light-3 small-medium">
        Profile editing UI can be added here (name, bio, avatar).
      </p>
      <Button asChild className="shad-button_primary">
        <Link href={`/profile/${id}`}>Back to profile</Link>
      </Button>
    </div>
  );
}
