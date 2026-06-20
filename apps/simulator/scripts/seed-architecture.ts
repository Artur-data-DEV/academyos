import { PrismaClient } from "@academyos/database";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Architecture Scenario...");

  const content = `
# Caso: Detran Vehicle Licensing
O governo do estado precisa modernizar o sistema de licenciamento de veículos.

## Requisitos
- **Volume:** Cerca de 50.000 veículos licenciados por dia, com picos no fim do mês (chegando a 500 requisições por segundo).
- **Consistência:** Um veículo não pode ser licenciado duas vezes simultaneamente.
- **Orçamento:** Baixo. Máximo de $300/mês para infraestrutura.
- **Integração:** Precisa integrar com um sistema legado demainframe via chamadas REST (que demora até 5s para responder).

## Sua Missão
Projete uma arquitetura para o fluxo de **"Solicitação de Licenciamento"**, lidando com os picos e a lentidão do legado sem estourar o orçamento. E justifique no campo de ADR.
`;

  const options = {
    layers: [
      {
        id: "api",
        name: "API / Ingestion",
        description: "Como você vai receber as chamadas dos usuários?",
        components: [
          { id: "api-gw-lambda", name: "API Gateway + Lambda", costImpact: 50, perfImpact: 80, secImpact: 50, feedback: "Escala perfeitamente para picos, baixo custo em ociosidade." },
          { id: "alb-ec2", name: "ALB + EC2 instances", costImpact: 150, perfImpact: 70, secImpact: 50, feedback: "Custo fixo alto, pode não escalar rápido o suficiente nos picos se mal configurado." }
        ]
      },
      {
        id: "queue",
        name: "Mensageria / Desacoplamento",
        description: "Como lidar com a lentidão de 5s do mainframe?",
        components: [
          { id: "sqs", name: "Amazon SQS", costImpact: 10, perfImpact: 90, secImpact: 50, feedback: "Perfeito. Absorve o pico de forma assíncrona enquanto o mainframe processa." },
          { id: "kafka", name: "Amazon MSK (Kafka)", costImpact: 200, perfImpact: 100, secImpact: 50, feedback: "Overkill extremo. Vai estourar o orçamento do projeto sem necessidade." },
          { id: "sync", name: "Chamada Síncrona", costImpact: 0, perfImpact: -50, secImpact: 50, feedback: "Péssima escolha. O pico de 500 req/s segurando conexões de 5s vai derrubar o sistema." }
        ]
      },
      {
        id: "database",
        name: "Persistência / Controle de Estado",
        description: "Onde guardar o status do licenciamento?",
        components: [
          { id: "dynamodb", name: "Amazon DynamoDB", costImpact: 30, perfImpact: 90, secImpact: 50, feedback: "Muito bom para chaves-valor rápidas e locks otimistas." },
          { id: "rds-aurora", name: "RDS Aurora Serverless", costImpact: 80, perfImpact: 80, secImpact: 50, feedback: "Boa escolha transacional, porém mais cara." }
        ]
      }
    ],
    thresholds: {
      maxCost: 100, // Alvo de custo (menor é melhor)
      minPerf: 80   // Alvo de performance (maior é melhor)
    }
  };

  const question = await prisma.question.create({
    data: {
      topic: "System Design",
      questionType: "architecture_design",
      content,
      correctAnswers: [],
      options,
      explanation: "A melhor solução é API Gateway -> SQS -> Lambda -> Mainframe + DynamoDB para gerenciar o estado."
    }
  });

  console.log("Successfully created Architecture Scenario ID:", question.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
