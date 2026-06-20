"use client";

import type { ReactNode } from "react";
import type { Element, Root, Text } from "hast";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

import { MermaidRenderer } from "./mermaid-renderer";
import { cn } from "./utils";

type HastNode = Element | Text | Root;

function getHastText(node: HastNode): string {
  if (node.type === "text") {
    return node.value;
  }

  if ("children" in node && Array.isArray(node.children)) {
    return node.children.map((child) => getHastText(child as HastNode)).join("");
  }

  return "";
}

function getCodeLanguage(className: string | undefined): string | null {
  const match = /language-(\w+)/.exec(className || "");
  return match?.[1] ?? null;
}

function isMermaidCodeElement(node: HastNode | undefined): boolean {
  if (!node || node.type !== "element" || node.tagName !== "code") {
    return false;
  }

  const className = node.properties?.className;
  const classes = Array.isArray(className)
    ? className.map(String)
    : className
      ? [String(className)]
      : [];

  return classes.some((value) => value === "language-mermaid");
}

function normalizeChart(children: ReactNode): string {
  if (typeof children === "string") {
    return children.replace(/\n$/, "").trim();
  }

  if (Array.isArray(children)) {
    return children
      .map((child) => (typeof child === "string" ? child : String(child)))
      .join("")
      .replace(/\n$/, "")
      .trim();
  }

  return String(children ?? "")
    .replace(/\n$/, "")
    .trim();
}

const markdownComponents: Components = {
  pre({ node, children }) {
    const codeChild = node?.children?.[0] as Element | undefined;

    if (isMermaidCodeElement(codeChild)) {
      return (
        <div className="mermaid-block not-prose my-6 w-full" data-mermaid-block>
          {children}
        </div>
      );
    }

    return (
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 text-sm">
        {children}
      </pre>
    );
  },

  code({ className, children, node }) {
    const language = getCodeLanguage(className);

    if (language === "mermaid") {
      const chart =
        node && node.type === "element"
          ? getHastText(node).trim()
          : normalizeChart(children);

      return <MermaidRenderer chart={chart} />;
    }

    const isInline =
      node?.type === "element" &&
      node.position &&
      node.position.start.line === node.position.end.line;

    if (isInline) {
      return (
        <code className={className}>
          {children}
        </code>
      );
    }

    return (
      <code className={cn("font-mono text-[0.9em]", className)}>
        {children}
      </code>
    );
  },
};

type MarkdownTextProps = {
  content: string;
  className?: string;
};

export function MarkdownText({ content, className }: MarkdownTextProps) {
  return (
    <div
      className={cn(
        "markdown-content prose max-w-none dark:prose-invert",
        "prose-p:leading-relaxed prose-p:mb-4 last:prose-p:mb-0",
        "prose-a:underline hover:prose-a:no-underline",
        "prose-ul:list-disc prose-ul:pl-5 prose-ul:mb-4",
        "prose-ol:list-decimal prose-ol:pl-5 prose-ol:mb-4",
        "prose-li:mb-1",
        "prose-strong:font-semibold",
        "prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:border",
        "prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
