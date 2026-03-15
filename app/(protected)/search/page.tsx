import React from "react";
import { search } from "@/actions/search";
import Link from "next/link";
import Image from "next/image";
import { UserRound } from "lucide-react";
import { formatDistance } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { UserRole } from "@prisma/client";
import VerifiedBadge from "@/components/Shared/VerifiedBadge";
import SearchInput from "./SearchInput";

const SearchPage = async ({
  searchParams,
}: {
  searchParams: { q?: string };
}) => {
  const query = searchParams.q || "";
  const results = query.length >= 2 ? await search(query) : null;

  return (
    <div className="container px-4 py-6 max-w-2xl">
      <SearchInput initialQuery={query} />

      {query.length > 0 && query.length < 2 && (
        <p className="text-neutral-500 text-sm mt-4">
          Type at least 2 characters to search.
        </p>
      )}

      {results && (
        <div className="mt-6 space-y-6">
          {/* Users */}
          {results.users.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-4">
              <h2 className="font-semibold text-primary mb-3">People</h2>
              <div className="space-y-3">
                {results.users.map((user) => (
                  <Link
                    key={user.id}
                    href={`/user/${user.id}`}
                    className="flex items-center gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg p-2 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <UserRound className="text-slate-400" size={20} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 font-medium text-sm">
                        {user.name}
                        <VerifiedBadge userRole={user.role as UserRole} />
                      </div>
                      {user.stateName && (
                        <p className="text-xs text-neutral-500">
                          {user.stateName}
                          {user.university ? ` · ${user.university}` : ""}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Events */}
          {results.events.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-lg p-4">
              <h2 className="font-semibold text-primary mb-3">Posts & Events</h2>
              <div className="space-y-3">
                {results.events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/details/${event.id}`}
                    className="block hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg p-2 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {event.user.image ? (
                          <Image
                            src={event.user.image}
                            alt={event.user.name}
                            width={24}
                            height={24}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <UserRound className="text-slate-400" size={12} />
                        )}
                      </div>
                      <span className="text-xs text-neutral-500 flex items-center gap-1">
                        {event.user.name}
                        <VerifiedBadge userRole={event.user.role as UserRole} />
                        ·{" "}
                        {formatDistance(new Date(event.createdAt), new Date(), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2 text-primary">
                      {event.content}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.users.length === 0 && results.events.length === 0 && (
            <p className="text-neutral-500 text-sm text-center py-8">
              No results found for &ldquo;{query}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
