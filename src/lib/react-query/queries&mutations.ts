// import { useMutation, type UseMutationResult } from "@tanstack/react-query";
// import {
//   accountCreation,
//   signInAccount,
//   signOutAccount,
// } from "../Appwrite/api";
// import { INewUser, INewPost, IUpdatePost } from "@/types";
// import { databases, appwriteConfig } from "@/lib/Appwrite/Configuration";
// import { ID } from "appwrite";

// export const useAccountCreation = () => {
//   return useMutation({
//     mutationFn: (user: INewUser) => accountCreation(user),
//   });
// };

// export const useSignInAccount = () => {
//   return useMutation({
//     mutationFn: (user: { email: string; password: string }) =>
//       signInAccount(user),
//   });
// };
// export const useSignOutAccount = () => {
//   return useMutation({
//     mutationFn: signOutAccount,
//   });
// };

// // Posts: create and update
// async function createPostApi(post: INewPost) {
//   // Create a document in the posts collection
//   const newDoc = await databases.createDocument(
//     appwriteConfig.databaseId,
//     appwriteConfig.postsCollectionId,
//     ID.unique(),
//     {
//       userId: post.userId,
//       caption: post.caption,
//       file: post.file || [],
//       location: post.location || null,
//       tags: post.tags || null,
//     }
//   );

//   return newDoc;
// }

// async function updatePostApi(payload: IUpdatePost) {
//   // Update an existing post
//   const updated = await databases.updateDocument(
//     appwriteConfig.databaseId,
//     appwriteConfig.postsCollectionId,
//     payload.postId,
//     {
//       caption: payload.caption,
//       imageId: payload.imageId,
//       imageUrl: payload.imageUrl,
//       file: payload.file || [],
//       location: payload.location || null,
//       tags: payload.tags || null,
//     }
//   );

//   return updated;
// }

// export const useCreatePost = (): UseMutationResult<
//   unknown,
//   unknown,
//   INewPost,
//   unknown
// > => {
//   return useMutation<unknown, unknown, INewPost>({
//     mutationFn: (post: INewPost) => createPostApi(post),
//   });
// };

// export const useUpdatePost = (): UseMutationResult<
//   unknown,
//   unknown,
//   IUpdatePost,
//   unknown
// > => {
//   return useMutation<unknown, unknown, IUpdatePost>({
//     mutationFn: (post: IUpdatePost) => updatePostApi(post),
//   });
// };
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ID } from "appwrite";

import {
  accountCreation,
  signInAccount,
  signOutAccount,
} from "../Appwrite/api";
import { databases, storage, appwriteConfig } from "@/lib/Appwrite/Configuration";
import { INewUser, INewPost, IUpdatePost } from "@/types";
import { QUERY_KEYS } from "./queryKeys";

// ----------------------
// ACCOUNT MUTATIONS
// ----------------------

export const useAccountCreation = () =>
  useMutation({
    mutationFn: (user: INewUser) => accountCreation(user),
  });

export const useSignInAccount = () =>
  useMutation({
    mutationFn: (user: { email: string; password: string }) =>
      signInAccount(user),
  });

export const useSignOutAccount = () =>
  useMutation({
    mutationFn: signOutAccount,
  });

// ----------------------
// POST MUTATIONS
// ----------------------

export async function createPostApi(post: INewPost) {
  try {
    // Debug: Log what we received
    console.log("createPostApi received:", {
      hasImage: !!post.image,
      imageLength: post.image?.length,
      userId: post.userId,
      caption: post.caption,
      tags: post.tags
    });

    // Validate that image is provided since image-id is required
    if (!post.image || post.image.length === 0) {
      throw new Error("Image is required to create a post");
    }

    let imageUrl = "";
    let imageId = "";

    // 1️⃣ Upload image file
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      post.image[0]
    );

    imageId = uploadedFile.$id;
    imageUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.storageId}/files/${imageId}/view?project=${appwriteConfig.projectId}`;

    // Convert tags to array format - Appwrite expects tags as an array
    let tagsArray: string[] = [];
    if (post.tags) {
      if (Array.isArray(post.tags)) {
        // If it's already an array, filter out empty values
        tagsArray = post.tags.filter(Boolean);
      } else if (typeof post.tags === "string") {
        // If it's a string, split by comma and clean up
        tagsArray = post.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
      }
    }

    // 2️⃣ Create the new post document
    // Field name is "tags" and it must be an array
    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postsCollectionId,
      ID.unique(),
      {
        creator: post.userId,       // relationship field - Users collection document ID
        caption: post.caption || "",
        "image-url": imageUrl || "",
        "image-id": imageId,         // required field - must not be empty
        tags: tagsArray,             // Must be an array, not a string
        // Note: location field removed as it's not in the schema
      }
    );

    return newPost;
  } catch (error) {
    console.error("❌ Error creating post:", error);
    throw error;
  }
}

async function updatePostApi(payload: IUpdatePost) {
  const updated = await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.postsCollectionId,
    payload.postId,
    {
      caption: payload.caption,
      imageId: payload.imageId,
      imageUrl: payload.imageUrl,
      file: payload.file || [],
      location: payload.location || null,
      tags: payload.tags || null,
    }
  );
  return updated;
}

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post: INewPost) => createPostApi(post),
    onSuccess: () => {
      // Invalidate queries to refetch posts after creation
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_INFINITE_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POSTS],
      });
    },
  });
};

export const useUpdatePost = () =>
  useMutation({
    mutationFn: (post: IUpdatePost) => updatePostApi(post),
  });
