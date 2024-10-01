import React from "react";
import ReactMarkdown from "react-markdown";

const FormattedContent = ({ content }: { content: string }) => {
  return (
    <pre className="whitespace-pre-wrap break-words font-sans">
      <ReactMarkdown>{content}</ReactMarkdown>
    </pre>
  );
};

export default FormattedContent;
