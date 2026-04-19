"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deletePostById } from "@/app/actions/postActions";

type PostDetailsActionsProps = {
  postId: string;
  canEdit: boolean;
};

export default function PostDetailsActions({
  postId,
  canEdit,
}: PostDetailsActionsProps) {
  const router = useRouter();

  const handleDelete = async () => {
    const result = await deletePostById(postId);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Post deleted");
    router.push("/");
  };

  if (!canEdit) return null;

  return (
    <div className="flex-center gap-4">
      <Link href={`/update-post/${postId}`}>
        <img src="/icons/edit.svg" alt="edit" width={24} height={24} />
      </Link>

      <Button
        onClick={handleDelete}
        variant="ghost"
        className="post_details-delete_btn"
      >
        <img src="/icons/delete.svg" alt="delete" width={24} height={24} />
      </Button>
    </div>
  );
}
