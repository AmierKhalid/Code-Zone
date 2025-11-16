import { useState } from "react";
import { Button } from "@/components/ui";
import { useUserContext } from "@/context/AuthContext";
import { createSamplePosts } from "@/scripts/createSamplePosts";
import { useToast } from "@/components/ui/use-toast";
import Loader from "@/components/shared/Loader";

const CreateSamplePosts = () => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);

  const handleCreatePosts = async () => {
    if (!user.id) {
      toast({
        title: "Error",
        description: "Please log in to create posts",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const posts = await createSamplePosts(user.id);
      setCreatedCount(posts.length);
      toast({
        title: "Success!",
        description: `Created ${posts.length} sample posts successfully!`,
      });
    } catch (error: any) {
      console.error("Error creating posts:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create posts",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-1">
      <div className="common-container">
        <div className="flex-start gap-3 justify-start w-full max-w-5xl">
          <h2 className="h3-bold md:h2-bold text-left w-full">
            Create Sample Posts
          </h2>
        </div>

        <div className="flex flex-col gap-4 mt-8 max-w-md">
          <p className="text-light-2">
            Click the button below to create 10 random sample posts with
            placeholder images.
          </p>

          <Button
            onClick={handleCreatePosts}
            disabled={isCreating || !user.id}
            className="shad-button_primary">
            {isCreating ? (
              <>
                <Loader />
                Creating posts...
              </>
            ) : (
              "Create 10 Sample Posts"
            )}
          </Button>

          {createdCount > 0 && (
            <p className="text-green-500 mt-4">
              ✅ Successfully created {createdCount} posts! Check the Explore page
              to see them.
            </p>
          )}

          {!user.id && (
            <p className="text-light-4 mt-2">
              Please log in to create posts.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateSamplePosts;

