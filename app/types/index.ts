

export type IUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  imageUrl: string;
  bio: string;
};

export type INewUser = {
  name: string;
  email: string;
  username: string;
  password: string;
  type: "standard" | "google" | "github";
};

export type verificationProps={
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onComplete: (code:string) => Promise<void>;
  onResend?:()=>Promise<void>;
  resendColldown?:number;
}

export type AccountType = "standard" | "google" | "github";

export type ClerkProfile = {
  clerkUserId: string;
  email: string;
  name: string | null;
  username: string | null;
  accountType: AccountType;
  imageUrl: string | null;
};

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

export type SaveUserResult =
  | { success: true }
  | { success: false; error: string };

export type CurrentUserResult =
  | { success: true; user: CurrentUser }
  | { success: false; error: string };

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

