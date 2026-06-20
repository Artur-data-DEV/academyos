'use server';

import { serialize } from 'next-mdx-remote/serialize';

export async function compileMdxPreview(source: string) {
  try {
    const mdxSource = await serialize(source, {
      parseFrontmatter: true,
      mdxOptions: {
        development: process.env.NODE_ENV === 'development',
      },
    });
    return { success: true, mdxSource };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
