// GET /api/palettes/showcase - おすすめパレット取得エンドポイント

interface ShowcasePalette {
  id: number;
  primaryDyeId: string;
  suggestedDyeIds: [string, string];
  pattern: string;
  createdAt: string;
}

interface ShowcaseData {
  palettes: ShowcasePalette[];
  updatedAt: string | null;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const data = await context.env.KV.get<ShowcaseData>('showcase:latest', 'json');

    return Response.json(data ?? { palettes: [], updatedAt: null });
  } catch (error) {
    console.error('Error fetching showcase:', error);
    return Response.json({ palettes: [], updatedAt: null });
  }
};
