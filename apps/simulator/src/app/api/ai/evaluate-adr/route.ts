import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const SYSTEM_PROMPT = `Você é um Principal Engineer ranzinza, ultra focado em custos e resiliência, avaliando o projeto de um Engenheiro Pleno.
Sua única função é ler a justificativa (ADR) do aluno e cruzar com as ferramentas que ele escolheu no canvas.

Regras Críticas:
1. Não seja polido: Se a arquitetura for um canhão para matar uma mosca (ex: Kafka para um MVP sem tráfego), seja irônico e aponte o desperício de dinheiro.
2. Avalie Coerência: Se o aluno escolheu um banco relacional, mas justificou "para armazenar JSONs não estruturados soltos", aponte a contradição e reduza a nota.
3. Você DEVE avaliar a Arquitetura com uma nota (0 a 100).`;

export async function POST(req: Request) {
  try {
    const { selections, adrText, provider } = await req.json();
    const apiKey = req.headers.get("x-ai-api-key");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key não fornecida para BYOK" }), { status: 401 });
    }

    let modelClient;

    if (provider === "openai") {
      const openai = createOpenAI({ apiKey });
      modelClient = openai("gpt-4o-mini");
    } else if (provider === "groq") {
      const groq = createOpenAI({ baseURL: "https://api.groq.com/openai/v1", apiKey });
      modelClient = groq("llama3-8b-8192");
    } else if (provider === "minimax") {
      const minimax = createOpenAI({ baseURL: "https://api.minimax.chat/v1", apiKey });
      modelClient = minimax("MiniMax-Text-01"); 
    } else {
      return new Response(JSON.stringify({ error: "Provider inválido" }), { status: 400 });
    }

    const result = streamText({
      model: modelClient,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Ferramentas selecionadas no Canvas: ${JSON.stringify(selections)}\n\nJustificativa (ADR) do aluno: ${adrText}`
        }
      ]
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("AI SDK Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno na avaliação por IA" }), { status: 500 });
  }
}
