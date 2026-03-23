import React from "react";
import type { Metadata } from "next";
import { search } from "@/actions/search";

export const metadata: Metadata = {
  title: "Search",
  description: "Search for people and communities on Shadhin.io.",
};
import Link from "next/link";
import Image from "next/image";
import { UserRound, Search, MapPin, GraduationCap, Clock } from "lucide-react";
import { formatDistance } from "date-fns";
import { UserRole } from "@prisma/client";
import VerifiedBadge from "@/components/Shared/VerifiedBadge";
import SearchInput from "./SearchInput";

const SearchPage = async ({
  searchParams,
}: {
  searchParams: { q?: string };
}) => {
  const query = searchParams.q || "";
  const rawResults = query.length >= 2 ? await search(query) : null;
  const results =
    rawResults && "users" in rawResults ? rawResults : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Search
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find people, posts, and events across all districts
        </p>
      </div>

      {/* Search Input */}
      <SearchInput initialQuery={query} />

      {/* Min-characters warning */}
      {query.length > 0 && query.length < 2 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            Type at least 2 characters to search.
          </p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="mt-8 space-y-6">
          {/* People Section */}
          {results.users.length > 0 && (
            <section className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 pt-5 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  People
                </h2>
              </div>
              <div className="divide-y divide-border">
                {results.users.map((user) => (
                  <Link
                    key={user.id}
                    href={`/user/${user.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-accent/50 hover:ring-1 hover:ring-ring/10 transition-all"
                  >
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 ring-1 ring-border">
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <UserRound className="text-muted-foreground" size={22} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-medium text-sm text-foreground">
                        <span className="truncate">{user.name}</span>
                        <VerifiedBadge userRole={user.role as UserRole} isVerifiedOrg={user.isVerifiedOrg} />
                      </div>
                      {(user.stateName || user.university) && (
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {user.stateName && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              <MapPin size={11} className="shrink-0" />
                              {user.stateName}
                            </span>
                          )}
                          {user.university && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              <GraduationCap size={11} className="shrink-0" />
                              {user.university}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Posts & Events Section */}
          {results.events.length > 0 && (
            <section className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 pt-5 pb-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Posts & Events
                </h2>
              </div>
              <div className="divide-y divide-border">
                {results.events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/details/${event.id}`}
                    className="block px-5 py-4 hover:bg-accent/50 hover:border-ring/10 transition-all"
                  >
                    {/* User info header */}
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="h-7 w-7 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 ring-1 ring-border">
                        {event.user.image ? (
                          <Image
                            src={event.user.image}
                            alt={event.user.name}
                            width={28}
                            height={28}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <UserRound className="text-muted-foreground" size={14} />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="font-medium text-foreground">
                          {event.user.name}
                        </span>
                        <VerifiedBadge userRole={event.user.role as UserRole} isVerifiedOrg={event.user.isVerifiedOrg} />
                      </div>
                    </div>

                    {/* Content preview */}
                    <p className="text-sm leading-relaxed line-clamp-2 text-foreground/80 mb-2.5">
                      {event.content}
                    </p>

                    {/* Meta row */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock size={12} className="shrink-0" />
                      <span>
                        {formatDistance(new Date(event.createdAt), new Date(), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {results.users.length === 0 && results.events.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="text-muted-foreground" size={28} />
              </div>
              <p className="text-base font-medium text-foreground mb-1">
                No results found
              </p>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                We couldn&apos;t find anything matching &ldquo;{query}&rdquo;.
                Try different keywords or check for typos.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Initial State (no query) */}
      {!query && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Search className="text-muted-foreground" size={28} />
          </div>
          <p className="text-base font-medium text-foreground mb-1">
            Discover Shadhin
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Search for people by name, district, or university. Find posts and events across all communities.
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
