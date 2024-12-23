import { SearchResult, SearchResultGroup } from "@/utils/types";
import ky from "ky";
import { kmeans } from "ml-kmeans";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ZodIssue } from "zod";

function groupResults(
  results: SearchResult[] | undefined,
  numClusters: number = 3
): SearchResultGroup[] | undefined {
  if (!results || !Array.isArray(results) || results.length === 0) {
    return;
  }

  if (results.length < numClusters) {
    numClusters = results.length;
  }

  const data = results.map((result) => [result.cosine_similarity]);
  const kmeansResult = kmeans(data, numClusters, {});

  // Map centroids directly to their sorted order using indexed objects
  const sortedClusterIndices = kmeansResult.centroids
    .map((_, index) => index)
    .sort(
      (a, b) => kmeansResult.centroids[b][0] - kmeansResult.centroids[a][0]
    );

  const groupedResults: SearchResultGroup[] = Array(numClusters)
    .fill(null)
    .map((_, i) => ({
      name: `Group ${i + 1}`,
      results: [],
      similarity: {
        from: -Infinity,
        to: Infinity,
      },
    }));

  // Map cluster indices from original to sorted order
  const clusterMapping = sortedClusterIndices.reduce<{ [key: number]: number }>(
    (acc, clusterIndex, sortedIndex) => {
      acc[clusterIndex] = sortedIndex;
      return acc;
    },
    {}
  );

  // Assign results to sorted clusters and simultaneously compute 'from' and 'to' values
  kmeansResult.clusters.forEach((clusterIndex, resultIndex) => {
    const groupIndex = clusterMapping[clusterIndex];
    const group = groupedResults[groupIndex];
    const similarity = results[resultIndex].cosine_similarity;

    group.results?.push(results[resultIndex]);

    if (
      group.similarity.from === undefined ||
      similarity > group.similarity.from
    ) {
      group.similarity.from = similarity;
    }

    if (group.similarity.to === undefined || similarity < group.similarity.to) {
      group.similarity.to = similarity;
    }
  });

  return groupedResults;
}

export const useSemanticSearch = (
  term: string | undefined
): {
  error: string | undefined;
  validationErrors: ZodIssue[] | undefined;
  isSearching: boolean;
  performSearch: (term: string) => Promise<void>;
  reset: () => void;
  results: SearchResult[] | undefined;
  groups: SearchResultGroup[] | undefined;
} => {
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [validationErrors, setValidationErrors] = useState<
    ZodIssue[] | undefined
  >();
  const [results, setResults] = useState<SearchResult[] | undefined>();
  const groups = useMemo(() => groupResults(results), [results]);

  async function performSearch(term: string) {
    try {
      setIsSearching(true);
      setResults(undefined);
      setError(undefined);
      setValidationErrors(undefined);

      const response = (await ky
        .post("/api/search", {
          json: { content: term },
        })
        .json()) as SearchResult[];

      setResults(response);
    } catch (error: any) {
      console.log(error.response);
      if (error.name === "HTTPError" && error.response.status === 422) {
        try {
          const errorJson = (await error.response.json()) as ZodIssue[];

          setValidationErrors(errorJson);
        } catch (error) {
          console.log(error);
        }
      }

      setError(error?.message);
    } finally {
      setIsSearching(false);
    }
  }

  useEffect(() => {
    if (term) {
      performSearch(term);
    }
  }, [term]);

  const handleReset = useCallback(() => {
    setIsSearching(false);
    setResults(undefined);
  }, []);

  return {
    results,
    groups,
    error,
    validationErrors,
    performSearch,
    reset: handleReset,
    isSearching,
  };
};
