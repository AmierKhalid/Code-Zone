

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

