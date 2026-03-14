export type IUser = {
  id: string;
  accountId: string;
  name: string | null;
  username: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  accountType: string;
  totalPoints: number | null;
  isVerified: boolean | null;
};

export type IUpdateProfile = {
  name?: string;
  username?: string;
  bio?: string;
  image?: string;
};

export type INewUser = {
  name: string;
  email: string;
  username: string;
  password: string;
  type: "standard" | "google" | "github";
};

export type verificationProps = {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onComplete: (code: string) => Promise<void>;
  onResend?: () => Promise<void>;
  resendColldown?: number;
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
