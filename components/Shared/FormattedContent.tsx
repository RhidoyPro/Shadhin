import { Inter } from "next/font/google";
import React from "react";
import ReactMarkdown from "react-markdown";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const FormattedContent = ({ content }: { content: string }) => {
  return (
    <pre className={`prose dark:prose-invert whitespace-pre-wrap break-words ${inter.className}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </pre>
  );
};

export default FormattedContent;
