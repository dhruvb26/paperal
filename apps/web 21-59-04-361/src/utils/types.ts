export interface SearchResult {
  name: string;
  content: string;
  cosine_similarity: number;
}

export interface SearchResultGroup {
  name: string;
  results: SearchResult[];
  similarity: {
    from: number;
    to: number;
  };
}
