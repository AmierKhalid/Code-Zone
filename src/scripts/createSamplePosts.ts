// Script to create 10 random sample posts
// This can be run from the browser console or imported as a utility

import { ID } from "appwrite";
import { databases, storage, appwriteConfig } from "@/lib/Appwrite/Configuration";

const sampleCaptions = [
  "Beautiful sunset at the beach 🌅",
  "Just finished a coding marathon! 💻",
  "Amazing architecture in the city",
  "Coffee and code, the perfect combination ☕",
  "Exploring new places and ideas",
  "Working on exciting new projects",
  "Nature is truly inspiring",
  "Tech stack for the future",
  "Learning something new every day",
  "Creative minds think alike 🎨",
];

const sampleTags = [
  ["coding", "tech", "developer"],
  ["nature", "photography", "beautiful"],
  ["travel", "adventure", "explore"],
  ["coffee", "lifestyle", "morning"],
  ["architecture", "design", "urban"],
  ["learning", "education", "growth"],
  ["technology", "innovation", "future"],
  ["creative", "art", "inspiration"],
  ["work", "productivity", "success"],
  ["life", "moments", "memories"],
];

// Create a placeholder image file from URL
const createPlaceholderImage = async (index: number): Promise<File> => {
  // Use placeholder.com or picsum for random images
  const width = 800;
  const height = 600;
  const imageUrl = `https://picsum.photos/seed/post${index}/${width}/${height}`;
  
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new File([blob], `placeholder-${index}.jpg`, { type: "image/jpeg" });
  } catch (error) {
    // Fallback: create a simple colored canvas image
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#95A5A6"];
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "48px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`Post ${index + 1}`, width / 2, height / 2);
    }
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], `placeholder-${index}.png`, { type: "image/png" }));
        } else {
          // Last resort: empty file
          resolve(new File([], `placeholder-${index}.png`));
        }
      }, "image/png");
    });
  }
};

export async function createSamplePosts(userId: string) {
  if (!userId) {
    throw new Error("User ID is required to create posts");
  }

  const createdPosts = [];

  for (let i = 0; i < 10; i++) {
    try {
      // Create placeholder image
      const imageFile = await createPlaceholderImage(i);

      // Upload image to storage
      const uploadedFile = await storage.createFile(
        appwriteConfig.storageId,
        ID.unique(),
        imageFile
      );

      const imageId = uploadedFile.$id;
      const imageUrl = `${appwriteConfig.endpoint}/storage/buckets/${appwriteConfig.storageId}/files/${imageId}/view?project=${appwriteConfig.projectId}`;

      // Create post document
      const newPost = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.postsCollectionId,
        ID.unique(),
        {
          creator: userId,
          caption: sampleCaptions[i],
          "image-url": imageUrl,
          "image-id": imageId,
          tags: sampleTags[i],
        }
      );

      createdPosts.push(newPost);
      console.log(`✅ Created post ${i + 1}/10: ${newPost.$id}`);
    } catch (error) {
      console.error(`❌ Error creating post ${i + 1}:`, error);
    }
  }

  console.log(`\n🎉 Successfully created ${createdPosts.length} sample posts!`);
  return createdPosts;
}

// Browser console helper
if (typeof window !== "undefined") {
  (window as any).createSamplePosts = async () => {
    // Get current user ID from context
    const { useUserContext } = await import("@/context/AuthContext");
    // Note: This won't work directly in console, need to call from component
    console.log("To use this function, import it in a component with user context");
  };
}

