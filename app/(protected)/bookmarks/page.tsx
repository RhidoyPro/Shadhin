import { Metadata } from "next";
import BookmarksList from "@/components/Bookmarks/BookmarksList";
import { getTranslations } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Bookmarks",
};

const BookmarksPage = async () => {
  const t = getTranslations("bookmarks");

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>
      <BookmarksList />
    </div>
  );
};

export default BookmarksPage;
