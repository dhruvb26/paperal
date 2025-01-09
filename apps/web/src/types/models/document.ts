export interface Document {
  id: string;
  title: string;
  prompt: string;
  content: any | "";
  userId: string;
  createdAt: Date;
  updatedAt: Date | null;
}
