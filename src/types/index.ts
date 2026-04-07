import { Models } from "appwrite";

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
};

export type IUpdateUser = {
  userId: string;
  name: string;
  bio: string;
  username: string;
  email: string;
  imageId: string;
  imageUrl: string;
  file: File[];
};

export type INavLink = {
  imgURL: string;
  route: string;
  label: string;
};

export type IContextType = {
  user: IUser;
  isLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<IUser>>;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  checkAuthUser: () => Promise<boolean>;
};

export interface INewPost {
  userId: string;     
  caption: string;
  image?: File[];     
  location?: string;
  tags?: string;      
  imageUrl?: string;
  imageId?: string;
}

export interface IUpdatePost {
  postId: string;
  caption: string;
  imageId: string;
  imageUrl: string;
  file: File[];
  location?: string;
  tags?: string;
}
