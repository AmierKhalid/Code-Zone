import { useEffect, useState, useRef } from "react";
import { useInView } from "react-intersection-observer";

import { Input } from "@/components/ui";
import useDebounce from "@/hooks/useDebounce";
import { GridPostList, Loader } from "@/components/shared";
import { useGetPosts, useSearchPosts } from "@/lib/react-query/queries";

export type SearchResultProps = {
  isSearchFetching: boolean;
  searchedPosts: any[] | undefined;
};

const SearchResults = ({ isSearchFetching, searchedPosts }: SearchResultProps) => {
  if (isSearchFetching) {
    return <Loader />;
  } else if (searchedPosts && searchedPosts.length > 0) {
    return <GridPostList posts={searchedPosts} />;
  } else {
    return (
      <p className="text-light-4 mt-10 text-center w-full">No results found</p>
    );
  }
};

type FilterType = "all" | "newest" | "oldest" | "top";

const Explore = () => {
  const { ref, inView } = useInView();
  const [filter, setFilter] = useState<FilterType>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  
  const { data: posts, fetchNextPage, hasNextPage } = useGetPosts(filter);

  const [searchValue, setSearchValue] = useState("");
  const debouncedSearch = useDebounce(searchValue, 500);
  const { data: searchedPosts, isFetching: isSearchFetching } = useSearchPosts(debouncedSearch);

  // Close filter dropdown when clicking outside
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
    if (inView && !searchValue) {
      fetchNextPage();
    }
  }, [inView, searchValue, fetchNextPage]);

  if (!posts)
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );

  const shouldShowSearchResults = searchValue !== "";
  const shouldShowPosts = !shouldShowSearchResults && 
    posts.pages.every((item) => item.documents.length === 0);

  return (
    <div className="explore-container">
      <div className="explore-inner_container">
        <h2 className="h3-bold md:h2-bold w-full">Search Posts</h2>
        <div className="flex gap-1 px-4 w-full rounded-lg bg-dark-4">
          <img
            src="/assets/icons/search.svg"
            width={24}
            height={24}
            alt="search"
          />
          <Input
            type="text"
            placeholder="Search"
            className="explore-search"
            value={searchValue}
            onChange={(e) => {
              const { value } = e.target;
              setSearchValue(value);
            }}
          />
        </div>
      </div>

      <div className="flex-between w-full max-w-5xl mt-16 mb-7">
        <h3 className="body-bold md:h3-bold">Popular Today</h3>

        <div className="relative" ref={filterRef}>
          <div
            className="flex-center gap-3 bg-dark-3 rounded-xl px-4 py-2 cursor-pointer"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <p className="small-medium md:base-medium text-light-2">
              {filter === "all" ? "All" : filter === "newest" ? "Newest" : filter === "oldest" ? "Oldest" : "Top Rated"}
            </p>
            <img
              src="/assets/icons/filter.svg"
              width={20}
              height={20}
              alt="filter"
            />
          </div>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 bg-dark-3 rounded-lg shadow-lg z-10 min-w-[150px]">
              <button
                onClick={() => {
                  setFilter("all");
                  setIsFilterOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-dark-4 rounded-t-lg ${
                  filter === "all" ? "text-primary-500" : "text-light-2"
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setFilter("newest");
                  setIsFilterOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-dark-4 ${
                  filter === "newest" ? "text-primary-500" : "text-light-2"
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => {
                  setFilter("oldest");
                  setIsFilterOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-dark-4 ${
                  filter === "oldest" ? "text-primary-500" : "text-light-2"
                }`}
              >
                Oldest
              </button>
              <button
                onClick={() => {
                  setFilter("top");
                  setIsFilterOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-dark-4 rounded-b-lg ${
                  filter === "top" ? "text-primary-500" : "text-light-2"
                }`}
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
        ) : shouldShowPosts ? (
          <p className="text-light-4 mt-10 text-center w-full">End of posts</p>
        ) : (
          posts.pages.map((item, index) => {
            if (!item || !item.documents || item.documents.length === 0) {
              return null;
            }
            return (
              <GridPostList key={`page-${index}`} posts={item.documents} />
            );
          })
        )}
      </div>

      {hasNextPage && !searchValue && (
        <div ref={ref} className="mt-10">
          <Loader />
        </div>
      )}
    </div>
  );
};

export default Explore;