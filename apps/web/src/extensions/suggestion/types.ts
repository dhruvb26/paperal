type LibraryDocument = {
  id: string;
  title: string;
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
