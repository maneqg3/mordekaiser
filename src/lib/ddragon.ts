import { z } from 'zod';

export const SpellSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  tooltip: z.string(),
  cooldownBurn: z.string(),
  costBurn: z.string(),
  rangeBurn: z.string(),
  image: z.object({ full: z.string() }),
});

export const ChampionResponseSchema = z.object({
  version: z.string(),
  data: z.object({
    Mordekaiser: z.object({
      name: z.string(),
      title: z.string(),
      lore: z.string(),
      passive: z.object({
        name: z.string(),
        description: z.string(),
        image: z.object({ full: z.string() }),
      }),
      spells: z.array(SpellSchema).length(4),
      skins: z.array(z.object({ num: z.number(), name: z.string() })),
    }),
  }),
});

export type ChampionResponse = z.infer<typeof ChampionResponseSchema>;

export interface ChampionData {
  version: string;
  name: string;
  title: string;
  lore: string;
  passive: { name: string; description: string; icon: string };
  spells: Array<{
    id: string;
    name: string;
    description: string;
    tooltip: string;
    cooldownBurn: string;
    costBurn: string;
    rangeBurn: string;
    icon: string;
  }>;
  skins: Array<{ num: number; name: string }>;
}

export function parseChampion(json: unknown): ChampionResponse {
  const result = ChampionResponseSchema.safeParse(json);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Data Dragon: schema inesperado — a Riot pode ter mudado a API.\n${issues}`,
    );
  }
  return result.data;
}

export function pickChampionData(res: ChampionResponse): ChampionData {
  const champion = res.data.Mordekaiser;
  return {
    version: res.version,
    name: champion.name,
    title: champion.title,
    lore: champion.lore,
    passive: {
      name: champion.passive.name,
      description: champion.passive.description,
      icon: champion.passive.image.full,
    },
    spells: champion.spells.map((spell) => ({
      id: spell.id,
      name: spell.name,
      description: spell.description,
      tooltip: spell.tooltip,
      cooldownBurn: spell.cooldownBurn,
      costBurn: spell.costBurn,
      rangeBurn: spell.rangeBurn,
      icon: spell.image.full,
    })),
    skins: champion.skins.map((skin) => ({ num: skin.num, name: skin.name })),
  };
}
