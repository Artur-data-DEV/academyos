/**
 * Service Layer para o LMS.
 * No futuro, quando o backend for desacoplado, as chamadas para o banco de dados
 * devem sair daqui e se tornarem fetch() para a API.
 */

import { prisma } from "@academyos/database";

export async function getTrack(slug: string) {
  // Exemplo de abstração
  return prisma.track.findUnique({ where: { slug } });
}
