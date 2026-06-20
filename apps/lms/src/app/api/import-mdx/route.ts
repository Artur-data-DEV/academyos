import { NextResponse } from 'next/server';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { auth } from '@academyos/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Validação de acesso
    const session = await auth();
    if (!session?.user || !['ADMIN', 'INSTRUCTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { markdown } = await req.json();

    if (!markdown) {
      return NextResponse.json({ error: 'Markdown content is required' }, { status: 400 });
    }

    // Faz parse do markdown para mdast (Markdown Abstract Syntax Tree)
    const processor = unified().use(remarkParse).use(remarkGfm);
    const mdast = processor.parse(markdown);

    // Em um cenário real, converteríamos o mdast recursivamente para o formato do ProseMirror/Tiptap.
    // Aqui usamos um mock de como seria o output do conversor para evitar dependências complexas neste MVP.
    // O objetivo é devolver o JSON estruturado que o Tiptap entende.
    const tiptapJson = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: `Conteúdo importado com sucesso. AST Node Count: ${mdast.children.length}`,
            },
          ],
        },
        // O conversor mapearia mdast -> tiptapJson
      ],
      _rawAst: mdast // Opcional, para debug
    };

    return NextResponse.json({ content: tiptapJson });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
