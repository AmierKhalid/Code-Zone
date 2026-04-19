"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import GridPostList from "@/components/shared/GridPostList";
import Loader from "@/components/shared/Loader";
import type { Post } from "@/app/types/index";
import useDebounce from "@/hooks/useDebounce";

type FilterType = "all" | "newest" | "oldest" | "top";

type ExploreResponse = {
  documents: Post[];
  hasMore: boolean;
};

function isAbortError(err: unknown): boolean {
  return (
    err instanceof DOMException && err.name === "AbortError"
  );
}

type SearchResultProps = {
  isSearchFetching: boolean;
  searchedPosts: Post[];
};

const SearchResults = ({ isSearchFetching, searchedPosts }: SearchResultProps) => {
  if (isSearchFetching) {
    return (
      <div className="flex-center w-full min-h-[40vh]">
        <Loader />
      </div>
    );
  }
  if (searchedPosts.length > 0) return <GridPostList posts={searchedPosts} />;
  return <p className="text-light-4 mt-10 text-center w-full">No results found</p>;
};

export default function Explore() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce(searchValue.trim(), 300);
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchedPosts, setSearchedPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchFetching, setIsSearchFetching] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setIsLoading(true);
    setPage(1);
    setHasNextPage(true);

    const url = `/api/explore?page=1&limit=18&filter=${filter}`;
    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: ExploreResponse) => {
        if (!active) return;
        setPosts(data.documents ?? []);
        setHasNextPage(Boolean(data.hasMore));
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        console.error(err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      controller.abort("explore-filter-change");
    };
  }, [filter]);

  useEffect(() => {
    if (!debouncedSearch) {
      setSearchedPosts([]);
      setIsSearchFetching(false);
      return;
    }

    let active = true;
    const controller = new AbortController();
    setIsSearchFetching(true);
    const url = `/api/explore?page=1&limit=30&filter=${filter}&q=${encodeURIComponent(debouncedSearch)}`;
    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((data: ExploreResponse) => {
        if (!active) return;
        setSearchedPosts(data.documents ?? []);
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        console.error(err);
      })
      .finally(() => {
        if (active) setIsSearchFetching(false);
      });

    return () => {
      active = false;
      controller.abort("explore-search-change");
    };
  }, [debouncedSearch, filter]);

  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage || debouncedSearch || isFetchingMore) return;
    const target = sentinelRef.current;
    let cancelled = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || cancelled) return;
        cancelled = true;
        setIsFetchingMore(true);
        const nextPage = page + 1;
        const url = `/api/explore?page=${nextPage}&limit=18&filter=${filter}`;
        fetch(url)
          .then((res) => res.json())
          .then((data: ExploreResponse) => {
            setPosts((prev) => [...prev, ...(data.documents ?? [])]);
            setPage(nextPage);
            setHasNextPage(Boolean(data.hasMore));
          })
          .finally(() => {
            setIsFetchingMore(false);
            cancelled = false;
          });
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [page, filter, hasNextPage, debouncedSearch, isFetchingMore]);

  if (isLoading) {
    return (
      <div className="flex-center w-full min-h-[60vh]">
        <Loader />
      </div>
    );
  }

  const shouldShowSearchResults = searchValue.trim() !== "";
  const shouldShowPostsEnd = !shouldShowSearchResults && posts.length === 0;

  return (
    <div className="explore-container">
      <div className="explore-inner_container">
        <h2 className="h3-bold md:h2-bold w-full">Search Posts</h2>
        <div className="flex gap-1 px-4 w-full rounded-lg bg-dark-4">
          <img src="/icons/search.svg" width={24} height={24} alt="search" />
          <Input
            type="text"
            placeholder="Search"
            className="explore-search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-between w-full max-w-5xl mt-16 mb-7">
        <h3 className="body-bold md:h3-bold">Popular Today</h3>

        <div className="relative" ref={filterRef}>
          <div
            className="flex-center gap-3 bg-dark-3 rounded-xl px-4 py-2 cursor-pointer"
            onClick={() => setIsFilterOpen((v) => !v)}
          >
            <p className="small-medium md:base-medium text-light-2">
              {filter === "all"
                ? "All"
                : filter === "newest"
                  ? "Newest"
                  : filter === "oldest"
                    ? "Oldest"
                    : "Top Rated"}
            </p>
            <img src="/icons/filter.svg" width={20} height={20} alt="filter" />
          </div>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 bg-dark-3 rounded-lg shadow-lg z-10 min-w-[150px]">
              <button
                onClick={() => {
                  setFilter("all");
                  setIsFilterOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-dark-4 rounded-t-lg ${filter === "all" ? "text-primary-500" : "text-light-2"}`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setFilter("newest");
                  setIsFilterOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-dark-4 ${filter === "newest" ? "text-primary-500" : "text-light-2"}`}
              >
                Newest
              </button>
              <button
                onClick={() => {
                  setFilter("oldest");
                  setIsFilterOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-dark-4 ${filter === "oldest" ? "text-primary-500" : "text-light-2"}`}
              >
                Oldest
              </button>
              <button
                onClick={() => {
                  setFilter("top");
                  setIsFilterOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-dark-4 rounded-b-lg ${filter === "top" ? "text-primary-500" : "text-light-2"}`}
              >
                Top Rated
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-9 w-full max-w-5xl">
        {shouldShowSearchResults ? (
          <SearchResults
            isSearchFetching={isSearchFetching}
            searchedPosts={searchedPosts}
          />
        ) : shouldShowPostsEnd ? (
          <p className="text-light-4 mt-10 text-center w-full">End of posts</p>
        ) : (
          <GridPostList posts={posts} />
        )}
      </div>

      {hasNextPage && !debouncedSearch && (
        <div ref={sentinelRef} className="mt-10 w-full flex-center">
          <Loader />
        </div>
      )}
    </div>
  );
}
