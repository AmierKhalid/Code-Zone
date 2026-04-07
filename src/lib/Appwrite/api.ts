// // import { INewUser } from "@/types";
// // import { ID, Query } from "appwrite";
// // import { account, appwriteConfig, avatars, databases } from "./Configuration";

// // // Create a new user account
// // export async function accountCreation(user: INewUser) {
// //     try {
// //         const newAccount = await account.create(
// //             ID.unique(),
// //             user.email,
// //             user.password,
// //             user.name
// //         );

// //         if (!newAccount) throw new Error("Account creation failed.");

// //         const avatarUrl = avatars.getInitials(user.name);

// //         const newUser = await saveUserToDB({
// //             accountId: newAccount.$id,
// //             email: newAccount.email,
// //             name: newAccount.name,
// //             imageUrl: avatarUrl,
// //             username: user.username
// //         });

// //         return newUser;
// //     } catch (error) {
// //         console.error("Error in createAccount:", error);
// //         throw error;
// //     }
// // }

// // // Save user details to the database
// // export async function saveUserToDB(user: {
// //     accountId: string;
// //     email: string;
// //     name: string;
// //     imageUrl: URL;
// //     username?: string;
// // }) {
// //     try {
// //         const newUser = await databases.createDocument(
// //             appwriteConfig.databaseId,
// //             appwriteConfig.usersCollectionId,
// //             ID.unique(),
// //             {
// //                 "account-id": user.accountId,
// //                 email: user.email,
// //                 name: user.name,
// //                 "image-url": user.imageUrl.toString(),
// //                 username: user.username || null  // Use null if username is not provided
// //             }
// //         );

// //         return newUser;
// //     } catch (error) {
// //         console.error("Error in saveUserToDB:", error);
// //         throw error;
// //     }
// // }

// // // ... rest of the code remains unchanged

// // // Sign in a user
// // export async function signInAccount(user: { email: string; password: string }) {
// //     try {
// //         const session = await account.createEmailPasswordSession(user.email, user.password);
// //         return session;
// //     } catch (error) {
// //         console.error("Error in signIn:", error);
// //         throw error;
// //     }
// // }

// // // Get the current authenticated user
// // export async function getCurrentUser() {
// //     try {
// //         const currentAccount = await account.get();
// //         if (!currentAccount) return null;

// //         const currentUser = await databases.listDocuments(
// //             appwriteConfig.databaseId,
// //             appwriteConfig.usersCollectionId,
// //             [Query.equal("accountId", currentAccount.$id)]
// //         );

// //         if (!currentUser || currentUser.documents.length === 0) return null;

// //         return currentUser.documents[0];
// //     } catch (error) {
// //         console.error("Error in getCurrentUser:", error);
// //         return null;
// //     }
// // }

// // // Sign out the current user
// // export async function signOut() {
// //     try {
// //         await account.deleteSession('current');
// //     } catch (error) {
// //         console.error("Error in signOut:", error);
// //         throw error;
// //     }
// // }

// // // Check if there's an active session
// // export async function checkSession() {
// //     try {
// //         const session = await account.getSession('current');
// //         return !!session;
// //     } catch {
// //         return false;
// //     }
// // }







// import { INewUser } from "@/types";
// import { ID, Query } from "appwrite";
// import { account, appwriteConfig, avatars, databases } from "./Configuration";

// // Create a new user account
// export async function accountCreation(user: INewUser) {
//     try {
//         const newAccount = await account.create(
//             ID.unique(),
//             user.email,
//             user.password,
//             user.name
//         );

//         if (!newAccount) throw new Error("Account creation failed.");

//         const avatarUrl = avatars.getInitials(user.name);

//         const newUser = await saveUserToDB({
//             accountId: newAccount.$id,
//             email: newAccount.email,
//             name: newAccount.name,
//             imageUrl: avatarUrl,
//             username: user.username
//         });

//         return newUser;
//     } catch (error) {
//         console.error("Error in accountCreation:", error);
//         throw error;
//     }
// }

// // Save user details to the database
// export async function saveUserToDB(user: {
//     accountId: string;
//     email: string;
//     name: string;
//     imageUrl: URL;
//     username?: string;
// }) {
//     try {
//         const newUser = await databases.createDocument(
//             appwriteConfig.databaseId,
//             appwriteConfig.usersCollectionId,
//             ID.unique(),
//             {
//                 "account-id": user.accountId,
//                 email: user.email,
//                 name: user.name,
//                 "image-url": user.imageUrl.toString(),
//                 username: user.username || null  // Use null if username is not provided
//             }
//         );

//         return newUser;
//     } catch (error) {
//         console.error("Error in saveUserToDB:", error);
//         throw error;
//     }
// }

// // Sign in a user
// export async function signInAccount(user: { email: string; password: string }) {
//     try {
//         const session = await account.createEmailPasswordSession(user.email, user.password);
//         return session;
//     } catch (error) {
//         console.error("Error in signInAccount:", error);
//         throw error;
//     }
// }

// // Get the current authenticated user
// export async function getCurrentUser() {
//     try {
//         const currentAccount = await account.get();
//         if (!currentAccount) return null;

//         const currentUser = await databases.listDocuments(
//             appwriteConfig.databaseId,
//             appwriteConfig.usersCollectionId,
//             [Query.equal("account-id", currentAccount.$id)] // Ensure the field name matches exactly
//         );

//         if (!currentUser || currentUser.documents.length === 0) return null;

//         return currentUser.documents[0];
//     } catch (error) {
//         console.error("Error in getCurrentUser:", error);
//         return null;
//     }
// }

// // Sign out the current user
// export async function signOutAccount() {
//     try {
//         const session =await account.deleteSession('current');
//         return session;
//     } catch (error) {
//         console.error("Error in signOut:", error);
//         throw error;
//     }
// }

// // Check if there's an active session
// export async function checkSession() {
//     try {
//         const session = await account.getSession('current');
//         return !!session;
//     } catch {
//         return false;
//     }
// }
import { ID, Query } from "appwrite";
import { account, appwriteConfig, avatars, databases, storage } from "./Configuration";
import { INewUser, INewPost, IUpdatePost, IUpdateUser } from "@/types";

// ============================================================
// AUTH
// ============================================================

export async function accountCreation(user: INewUser) {
  try {
    const newAccount = await account.create(ID.unique(), user.email, user.password, user.name);
    if (!newAccount) throw new Error("Account creation failed.");

    const avatarUrl = avatars.getInitials(user.name);

    const newUser = await saveUserToDB({
      accountId: newAccount.$id,
      email: newAccount.email,
      name: newAccount.name,
      imageUrl: avatarUrl,
      username: user.username,
    });

    return newUser;
  } catch (error) {
    console.error("Error in accountCreation:", error);
    throw error;
  }
}

export async function saveUserToDB(user: {
  accountId: string;
  email: string;
  name: string;
  imageUrl: URL;
  username?: string;
}) {
  try {
    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      ID.unique(),
      {
        "account-id": user.accountId,
        email: user.email,
        name: user.name,
        "image-url": user.imageUrl.toString(),
        username: user.username || null,
      }
    );

    return newUser;
  } catch (error) {
    console.error("Error in saveUserToDB:", error);
    throw error;
  }
}

export async function signInAccount(user: { email: string; password: string }) {
  try {
    // First, try to remove any active session (if the user is already logged in)
    try {
      await account.deleteSession("current");
    } catch {
      // ignore if no session exists
    }

    // Then create a fresh session
    const session = await account.createEmailPasswordSession(
      user.email,
      user.password
    );

    return session;
  } catch (error) {
    console.error("Error in signInAccount:", error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const currentAccount = await account.get();
    if (!currentAccount) return null;

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.equal("account-id", currentAccount.$id)]
    );

    if (!currentUser || currentUser.documents.length === 0) return null;
    const doc: any = currentUser.documents[0];
    
    // Fetch saved posts for this user
    let saves: any[] = [];
    try {
      const savedRecords = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.savesCollectionId,
        [Query.equal("users", doc.$id)]
      );
      saves = savedRecords.documents;
    } catch (error) {
      console.error("Error fetching saves for current user:", error);
    }
    
    return {
      ...doc,
      imageUrl: doc["image-url"] ?? doc.imageUrl ?? "",
      imageId: doc["image-id"] ?? doc.imageId ?? "",
      save: saves, // Add saves array to user object
    };
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}

export async function signOutAccount() {
  try {
    return await account.deleteSession("current");
  } catch (error) {
    console.error("Error in signOutAccount:", error);
    throw error;
  }
}

// ============================================================
// POSTS
// ============================================================

export async function createPost(post: INewPost) {
  try {
    // Validate that image is provided since image-id is required
    if (!post.image || post.image.length === 0) {
      throw new Error("Image is required to create a post");
    }

    let imageUrl = "";
    let imageId = "";

    // Upload image file
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

    // Create the document in Appwrite
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


export async function getPostById(postId?: string) {
  if (!postId) return null;
  try {
    return await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postsCollectionId,
      postId
    );
  } catch (error) {
    console.error("Error in getPostById:", error);
    throw error;
  }
}

export async function getUserPosts(userId?: string) {
  if (!userId) return [];
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postsCollectionId,
      [Query.equal("creator", userId)]
    );
    return posts.documents;
  } catch (error) {
    console.error("Error in getUserPosts:", error);
    throw error;
  }
}

export async function updatePost(post: IUpdatePost) {
  try {
    const updated = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postsCollectionId,
      post.postId,
      {
        caption: post.caption,
        location: post.location,
        tags: post.tags,
      }
    );
    return updated;
  } catch (error) {
    console.error("Error in updatePost:", error);
    throw error;
  }
}

export async function deletePost(postId?: string, imageId?: string) {
  try {
    if (imageId) {
      await storage.deleteFile(appwriteConfig.storageId, imageId);
    }
    if (postId) {
      await databases.deleteDocument(appwriteConfig.databaseId, appwriteConfig.postsCollectionId, postId);
    }
  } catch (error) {
    console.error("Error in deletePost:", error);
    throw error;
  }
}

export async function likePost(postId: string, likesArray: string[]) {
  try {
    const updated = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postsCollectionId,
      postId,
      { likes: likesArray }
    );
    return updated;
  } catch (error) {
    console.error("Error in likePost:", error);
    throw error;
  }
}

export async function getRecentPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postsCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(10)]
    );
    return posts.documents;
  } catch (error) {
    console.error("Error in getRecentPosts:", error);
    throw error;
  }
}

export async function getInfinitePosts({ 
  pageParam, 
  filter = "all" 
}: { 
  pageParam?: string;
  filter?: "all" | "newest" | "oldest" | "top";
}) {
  try {
    const queries: any[] = [Query.limit(10)];
    
    // Apply ordering based on filter
    if (filter === "oldest") {
      queries.push(Query.orderAsc("$createdAt"));
    } else if (filter === "all" || filter === "newest") {
      // Default to newest (most recent) for "all" and "newest"
      queries.push(Query.orderDesc("$createdAt"));
    } else {
      // For "top", we'll sort by date first, then client-side by likes
      queries.push(Query.orderDesc("$createdAt"));
    }
    
    if (pageParam) queries.push(Query.cursorAfter(pageParam));

    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postsCollectionId,
      queries
    );
    
    // For "top" filter, sort by likes count (client-side since Appwrite doesn't support array length sorting)
    if (filter === "top") {
      posts.documents.sort((a: any, b: any) => {
        const aLikes = Array.isArray(a.likes) ? a.likes.length : 0;
        const bLikes = Array.isArray(b.likes) ? b.likes.length : 0;
        return bLikes - aLikes; // Descending order (most likes first)
      });
    }
    
    return posts;
  } catch (error) {
    console.error("Error in getInfinitePosts:", error);
    throw error;
  }
}

export async function searchPosts(searchTerm: string) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postsCollectionId,
      [Query.search("caption", searchTerm)]
    );
    return posts.documents;
  } catch (error) {
    console.error("Error in searchPosts:", error);
    throw error;
  }
}

export async function savePost(userId: string, postId: string) {
  try {
    const saved = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      ID.unique(),
      { users: userId, post: postId }
    );
    return saved;
  } catch (error) {
    console.error("Error in savePost:", error);
    throw error;
  }
}

export async function deleteSavedPost(savedRecordId: string) {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      savedRecordId
    );
  } catch (error) {
    console.error("Error in deleteSavedPost:", error);
    throw error;
  }
}

export async function getSavedPosts(userId: string) {
  try {
    const savedPosts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      [Query.equal("users", userId)]
    );
    
    // Extract the actual post documents from the saved records
    // Filter out any null/undefined posts
    const posts = savedPosts.documents
      .map((savedRecord: any) => savedRecord.post)
      .filter((post: any) => post != null);
    
    return posts;
  } catch (error) {
    console.error("Error in getSavedPosts:", error);
    throw error;
  }
}

export async function getSavedPostRecord(userId: string, postId: string) {
  try {
    const savedRecords = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      [Query.equal("users", userId), Query.equal("post", postId)]
    );
    
    return savedRecords.documents.length > 0 ? savedRecords.documents[0] : null;
  } catch (error) {
    console.error("Error in getSavedPostRecord:", error);
    return null;
  }
}

export async function getLikedPosts(userId: string) {
  try {
    // Get all posts and filter client-side for those containing the user ID in likes array
    // Note: Appwrite's Query.contains works for arrays, but let's also handle it client-side as fallback
    const allPosts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postsCollectionId,
      [Query.limit(1000)] // Get a large batch, then filter
    );
    
    // Filter posts where likes array contains the userId
    const likedPosts = allPosts.documents.filter((post: any) => {
      if (!post.likes || !Array.isArray(post.likes)) return false;
      
      // Handle both cases: likes as array of IDs or array of objects
      return post.likes.some((like: any) => {
        if (typeof like === 'string') {
          return like === userId;
        } else if (like && typeof like === 'object' && like.$id) {
          return like.$id === userId;
        }
        return false;
      });
    });
    
    return likedPosts;
  } catch (error) {
    console.error("Error in getLikedPosts:", error);
    throw error;
  }
}

// ============================================================
// USERS
// ============================================================

export async function getUsers(limit = 10) {
  try {
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.limit(limit)]
    );
    // Map image fields to ensure consistent format
    return users.documents.map((doc: any) => ({
      ...doc,
      imageUrl: doc["image-url"] ?? doc.imageUrl ?? "",
      imageId: doc["image-id"] ?? doc.imageId ?? "",
    }));
  } catch (error) {
    console.error("Error in getUsers:", error);
    throw error;
  }
}

export async function getUserById(userId: string) {
  try {
    const user = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      userId
    );
    const doc: any = user;
    return {
      ...doc,
      imageUrl: doc["image-url"] ?? doc.imageUrl ?? "",
      imageId: doc["image-id"] ?? doc.imageId ?? "",
    };
  } catch (error) {
    console.error("Error in getUserById:", error);
    throw error;
  }
}

export async function updateUser(user: IUpdateUser) {
  try {
    let imageUrl = user.imageUrl;
    let imageId = user.imageId;

    // If a new file is provided, upload and replace
    if (user.file && user.file.length > 0) {
      // Upload new avatar
      const uploadedFile = await storage.createFile(
        appwriteConfig.storageId,
        ID.unique(),
        user.file[0]
      );
      imageId = uploadedFile.$id;
      imageUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.storageId}/files/${imageId}/view?project=${appwriteConfig.projectId}`;

      // Best-effort: delete previous avatar if present
      try {
        if (user.imageId) {
          await storage.deleteFile(appwriteConfig.storageId, user.imageId);
        }
      } catch {}
    }

    // Build update payload - only include image fields if they have valid values
    const updateData: any = {
      name: user.name,
      bio: user.bio || "",
      email: user.email,
      username: user.username,
    };

    // Only include image-url and image-id if they are valid
    if (imageUrl && imageUrl.trim() !== "" && isValidUrl(imageUrl)) {
      updateData["image-url"] = imageUrl;
    }
    if (imageId && imageId.trim() !== "") {
      updateData["image-id"] = imageId;
    }

    const updated = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      user.userId,
      updateData
    );
    return updated;
  } catch (error) {
    console.error("Error in updateUser:", error);
    throw error;
  }
}

// Helper function to validate URLs
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
