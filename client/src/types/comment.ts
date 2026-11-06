export interface Comment {
  _id: string;
  issue: string;
  user: { _id: string; name: string } | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}
