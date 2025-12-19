// カララント
export interface Dye {
  id: string;
  name: string;
  category: DyeCategory;
  hsv: HSVColor;
  rgb: RGBColor;
  hex: string;
  oklab: OklabColor;
  tags?: string[];
  lodestone?: string;
}

export type DyeCandidate = {
  dye: Dye;
  delta: number;
};

// HSV色空間
export interface HSVColor {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

// RGB色空間
export interface RGBColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

// Oklab色空間
export interface OklabColor {
  L: number; // 0.0-1.0
  a: number; // unbounded but in practice ranging from -0.5 to +0.5
  b: number; // unbounded but in practice ranging from -0.5 to +0.5
}

// Oklch色空間
export interface OklchColor {
  L: number; // 0.0-1.0
  C: number; // 0.0-? (typically up to ~0.5)
  h: number; // 0-360
}

// カララントカテゴリ
export type DyeCategory = '白系' | '赤系' | '茶系' | '黄系' | '緑系' | '青系' | '紫系' | 'レア系';

// 配色パターン
export type HarmonyPattern =
  | 'triadic'
  | 'split-complementary'
  | 'analogous'
  | 'monochromatic'
  | 'similar'
  | 'contrast'
  | 'clash';

// 組み合わせ
export interface DyeCombination {
  id: string;
  name?: string;
  pattern: HarmonyPattern;
  primaryDye: Dye;
  secondaryDyes: [Dye, Dye];
  harmonyScore: number;
  createdAt: string;
}

// フィルター設定
export interface FilterOptions {
  categories: DyeCategory | null;
  hueRange: [number, number];
  saturationRange: [number, number];
  valueRange: [number, number];
  excludeMetallic: boolean;
}

// カララントデータJSONの型
export interface DyeData {
  dyes: Dye[];
}

// パレットエントリ基底型（お気に入り・履歴共通）
export interface PaletteEntry {
  id: string;
  primaryDye: Dye;
  suggestedDyes: [Dye, Dye];
  pattern: HarmonyPattern;
  createdAt: string;
}

// 履歴エントリ
export interface HistoryEntry extends PaletteEntry {
  // 追加プロパティなし
}

// お気に入り（基底型を継承）
export interface Favorite extends PaletteEntry {
  name: string;
  updatedAt?: string;
}

// 保存用の軽量型定義（hsv/hex除外）
export interface StoredDye {
  id: string;
  name: string;
  category: DyeCategory;
  rgb: RGBColor;
  tags?: string[];
}

export interface StoredCustomColor {
  id: string;
  name: string;
  rgb: RGBColor;
  createdAt: Date;
  updatedAt: Date;
}

// 保存用パレットエントリ基底型
export interface StoredPaletteEntry {
  id: string;
  primaryDye: StoredDye;
  suggestedDyes: [StoredDye, StoredDye];
  pattern: HarmonyPattern;
  createdAt: string;
}

// 保存用履歴エントリ
export interface StoredHistoryEntry extends StoredPaletteEntry {
  // 追加プロパティなし
}

// 保存用お気に入り
export interface StoredFavorite extends StoredPaletteEntry {
  name: string;
  updatedAt?: string;
}

// LocalStorage用のお気に入りデータ
export interface FavoritesData {
  favorites: Favorite[];
  version: string;
}

// LocalStorage用の履歴データ
export interface HistoryData {
  entries: StoredHistoryEntry[];
  version: string;
}

// カスタムカラー
export interface CustomColor {
  id: string;
  name: string;
  rgb: RGBColor;
  hsv: HSVColor;
  createdAt: Date;
  updatedAt: Date;
}

// 拡張されたDye（カスタムカラー対応）
export type DyeSource = 'game' | 'custom';

export interface ExtendedDye extends Dye {
  source: DyeSource;
  customColor?: CustomColor;
}

// カスタムカラー対応シェアデータ
export interface CustomColorShare {
  type: 'custom';
  name: string;
  rgb: RGBColor;
  // hsv削除（必要時にrgbから計算）
}

export interface ExtendedSharePaletteData {
  p: string | CustomColorShare;
  s: [string, string];
  pt: HarmonyPattern;
}

// カスタムカラー対応お気に入り
export interface ExtendedFavorite extends Omit<Favorite, 'primaryDye'> {
  primaryDye: Dye | CustomColor;
}

// LocalStorage用のカスタムカラーデータ
export interface CustomColorsData {
  colors: CustomColor[];
  version: string;
  lastUpdated: string;
}
