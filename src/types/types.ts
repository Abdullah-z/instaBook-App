export interface UserType {
  _id: string;
  username: string;
  avatar: string;
}

export interface CommentType {
  _id: string;
  content: string;
  createdAt: string;
  user: UserType;
  likes: string[];
  reply?: string;
}
