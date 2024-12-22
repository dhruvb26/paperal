type LibraryDocument = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    fileUrl?: string;
    authors?: string[];
    year?: string;
    citations?: {
      "in-text"?: string;
      "after-text"?: string;
    };
  };
};
