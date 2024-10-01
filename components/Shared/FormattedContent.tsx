import { Inter } from "next/font/google";
import React from "react";
import ReactMarkdown from "react-markdown";

const inter = Inter({ subsets: ["latin"] });

const FormattedContent = ({ content }: { content: string }) => {
  return (
    <pre className={`prose whitespace-pre-wrap break-words ${inter.className}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </pre>
  );
};

export default FormattedContent;
