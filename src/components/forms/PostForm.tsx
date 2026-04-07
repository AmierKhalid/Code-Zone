import * as z from "zod";
import { Models } from "appwrite";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Button,
  Input,
  Textarea,
} from "@/components/ui";
import { PostValidation } from "@/lib/Validation/validation";
import { useToast } from "@/components/ui/use-toast";
import { useUserContext } from "@/context/AuthContext";
import FileUploader from "@/components/shared/FileUploader";
import Loader from "@/components/shared/Loader";
import {
  useCreatePost,
  useUpdatePost,
} from "@/lib/react-query/queries&mutations";

type PostFormProps = {
  post?: Models.Document;
  action: "Create" | "Update";
};

const PostForm = ({ post, action }: PostFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUserContext();

  const form = useForm<z.infer<typeof PostValidation>>({
    resolver: zodResolver(PostValidation),
    defaultValues: {
      caption: post?.caption || "",
      file: [],
      location: post?.location || "",
      tags: post?.tags?.join(", ") || "",
    },
  });

  const { mutateAsync: createPost, isPending: isCreating } = useCreatePost();
  const { mutateAsync: updatePost, isPending: isUpdating } = useUpdatePost();

  const handleSubmit = async (value: z.infer<typeof PostValidation>) => {
    try {
      const tagsArray = value.tags
        ? value.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [];

      if (post && action === "Update") {
        const updatedPost = await updatePost({
          ...value,
          postId: post.$id,
          imageId: post.imageId,
          imageUrl: post.imageUrl,
          tags: tagsArray,
        });

        if (!updatedPost) {
          toast({ title: `${action} post failed. Please try again.` });
        } else {
          navigate(`/posts/${post.$id}`);
        }
        return;
      }

      // Validate that image is provided for new posts
      if (!value.file || value.file.length === 0) {
        toast({ 
          title: "Image is required", 
          description: "Please upload an image to create a post.",
          variant: "destructive"
        });
        return;
      }

      // Debug: Log what we're sending
      console.log("PostForm sending:", {
        hasFile: !!value.file,
        fileLength: value.file?.length,
        fileType: value.file?.[0]?.type,
        fileName: value.file?.[0]?.name,
        userId: user.id,
        caption: value.caption,
        tags: tagsArray.join(", ")
      });

      const newPost = await createPost({
        userId: user.id,
        caption: value.caption,
        image: value.file, // Map 'file' from form to 'image' for API
        location: value.location,
        tags: tagsArray, // Pass as array - Appwrite expects tags as an array
      });

      if (!newPost) {
        toast({ title: `${action} post failed. Please try again.` });
      } else {
        toast({ title: "Post created successfully!" });
        navigate("/");
      }
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      toast({ 
        title: "Something went wrong.", 
        description: errorMessage.includes("Image is required") 
          ? "Please upload an image to create a post."
          : errorMessage,
        variant: "destructive"
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-9 w-full max-w-5xl"
      >
        {/* Caption */}
        <FormField
          control={form.control}
          name="caption"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Caption</FormLabel>
              <FormControl>
                <Textarea className="shad-textarea custom-scrollbar" {...field} />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        {/* Image Upload */}
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Add Photos</FormLabel>
              <FormControl>
                <FileUploader
                  fieldChange={field.onChange}
                  mediaUrl={post?.imageUrl}
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        {/* Location */}
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Add Location</FormLabel>
              <FormControl>
                <Input type="text" className="shad-input" {...field} />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        {/* Tags */}
        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">
                Add Tags (separated by commas)
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Art, Expression, Learn"
                  type="text"
                  className="shad-input"
                  {...field}
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-4 items-center justify-end">
          <Button
            type="button"
            className="shad-button_dark_4"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="shad-button_primary whitespace-nowrap"
            disabled={isCreating || isUpdating}
          >
            {(isCreating || isUpdating) && <Loader />}
            {action} Post
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PostForm;
