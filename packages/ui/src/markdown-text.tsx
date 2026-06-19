import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { cn } from "./utils";

type MarkdownTextProps = {
  content: string;
  className?: string;
};

export function MarkdownText({ content, className }: MarkdownTextProps) {
  return (
    <div
      className={cn(
        "prose max-w-none dark:prose-invert",
        "prose-p:leading-relaxed prose-p:mb-4 last:prose-p:mb-0",
        "prose-a:text-primary hover:prose-a:underline",
        "prose-ul:list-disc prose-ul:pl-5 prose-ul:mb-4",
        "prose-ol:list-decimal prose-ol:pl-5 prose-ol:mb-4",
        "prose-li:mb-1",
        "prose-strong:font-semibold",
        "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:bg-muted prose-pre:border prose-pre:border-border",
        "prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground",
        "whitespace-pre-wrap",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
