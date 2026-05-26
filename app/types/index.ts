

import { Categories, difficulties, tilteType } from "@/lib/enums";

export type IUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  imageUrl: string;
  bio: string;
};

export type SaveUserResult =
  | { success: true }
  | { success: false; error: string };

export type CurrentUserResult =
  | { success: true; user: CurrentUser }
  | { success: false; error: string };

export type CurrentUser = {
  id: string;
  accountId: string;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  accountType: string;
};

export type verificationProps={
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onComplete: (code:string) => Promise<void>;
  onResend?:()=>Promise<void>;
  resendColldown?:number;
}

export type Post = {
  id: string;
  authorId: string;
  content: string | null;
  location?: string | null;
  tags: string[];
  mediaUrl: string | null;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  likes: {
    id: string;
    userId: string;
  }[];
  saves: {
    id: string;
    userId: string;
  }[];
};

// export type IUpdateUser = {
//   userId: string;
//   name: string;
//   bio: string;
//   username: string;
//   email: string;
//   imageId: string;
//   imageUrl: string;
//   file: File[];
// };

export type INavLink = {
  imgURL: string;
  route: string;
  label: string;
};

export interface ErrorReport {
  id: string;
  title: string;
  description: string | null;
  code: string | null;
  points: number;
  category: Categories | null;
  difficulty: difficulties | null;
  isSolved: boolean;
  createdAt: Date;
  author: {
    id: string;
    username: string | null;
    name: string | null;
    image: string | null;
    title: tilteType | null;
    totalPoints: number | null;
  };
  solutions: Array<{
    id: string;
    author: {
      id: string;
      username: string | null;
      name: string | null;
      image: string | null;
      title: tilteType | null;
    };
  }>;
  _count: {
    solutions: number;
  };
}

export interface ErrorDetail {
  id: string;
  title: string;
  description: string | null;
  code: string | null;
  points: number;
  category: Categories | null;
  difficulty: difficulties | null;
  isSolved: boolean;
  createdAt: Date;
  author: {
    id: string;
    username: string | null;
    name: string | null;
    image: string | null;
    title: tilteType | null;
    totalPoints: number | null;
    createdAt: Date;
  };
  solutions: Array<{
    id: string;
    content: string;
    isApproved: boolean;
    rate: number;
    earnedPoints: number;
    createdAt: Date;
    author: {
      id: string;
      username: string | null;
      name: string | null;
      image: string | null;
      title: tilteType | null;
      totalPoints: number | null;
    };
  }>;
  _count: {
    solutions: number;
  };
}


