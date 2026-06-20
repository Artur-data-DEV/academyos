'use client';

import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { CustomMdxComponents } from '../mdx';

interface LivePreviewProps {
  mdxSource: MDXRemoteSerializeResult | null;
  error: string | null;
}

export function LivePreview({ mdxSource, error }: LivePreviewProps) {
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded">
        <h3 className="font-bold">Error compiling MDX</h3>
        <pre className="whitespace-pre-wrap text-sm mt-2">{error}</pre>
      </div>
    );
  }

  if (!mdxSource) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <p>Loading preview...</p>
      </div>
    );
  }

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none p-6">
      <MDXRemote {...mdxSource} components={CustomMdxComponents} />
    </div>
  );
}
