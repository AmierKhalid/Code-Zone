

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

