import { Metadata } from "next";
import BookmarksList from "@/components/Bookmarks/BookmarksList";

export const metadata: Metadata = {
  title: "Bookmarks",
};

const BookmarksPage = () => {
  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Saved Posts</h1>
      <BookmarksList />
    </div>
  );
};

export default BookmarksPage;
