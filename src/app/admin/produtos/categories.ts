import { prisma } from "@/lib/db";

// Lista as categorias com o caminho completo, ex.: "Beleza > Maquiagem > Batom".
export async function categoryOptions() {
  const all = await prisma.catalogCategory.findMany();
  const byId = new Map(all.map((c) => [c.id, c]));
  const path = (id: string): string => {
    const c = byId.get(id)!;
    return c.parentId ? `${path(c.parentId)} > ${c.name}` : c.name;
  };
  return all.map((c) => ({ id: c.id, label: path(c.id) })).sort((a, b) => a.label.localeCompare(b.label));
}
