import { PrismaClient } from "@academyos/database";

// Instância do Prisma que vai apontar para o Neon (DATABASE_URL do .env)
const prisma = new PrismaClient();

const SUPABASE_URL = "https://zlppqtksocqncaishbzh.supabase.co";
// Pegando do .env.local do simulator ou process.env. Pode colocar a chave abaixo se necessário.
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpscHBxdGtzb2NxbmNhaXNoYnpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjYyMDUzOCwiZXhwIjoyMDkyMTk2NTM4fQ.bXnyYiMS7XIpmrF2eTvRxol1ad4p5-HDF7awFdrMUik";

async function migrate() {
  console.log("Iniciando migração do Supabase para Neon...");

  try {
    // 1. Fazer fetch das questões via REST API do Supabase
    console.log("Baixando dados do Supabase...");
    const res = await fetch(`${SUPABASE_URL}/rest/v1/questions?select=*`, {
      headers: {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      }
    });

    if (!res.ok) {
      throw new Error(`Falha ao buscar do Supabase: ${res.status} ${res.statusText}`);
    }

    const supabaseQuestions = await res.json();
    console.log(`Foram encontradas ${supabaseQuestions.length} questões no Supabase.`);

    // 2. Mapear e inserir no banco Neon via Prisma
    let inserted = 0;
    for (const sq of supabaseQuestions) {
      // Verificar se já existe (via legacyId)
      const exists = await prisma.question.findUnique({
        where: { legacyId: BigInt(sq.id) }
      });

      if (!exists) {
        await prisma.question.create({
          data: {
            legacyId: BigInt(sq.id),
            sourceId: sq.source_id ? BigInt(sq.source_id) : null,
            topic: sq.topic,
            questionType: sq.question_type,
            content: sq.question,
            correctAnswers: sq.correct_answer, // já é array de string
            options: sq.options_json, // já é JSON no Supabase, mapeia pra JSON no Prisma
            // explanation não existia no supabase simulator original
          }
        });
        inserted++;
      }
    }

    console.log(`Migração concluída! ${inserted} novas questões foram importadas para o banco Neon.`);
  } catch (err) {
    console.error("Erro na migração:", err);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
