// ===== culori型をre-export =====
// 注: ファイル内で使用するためインポートが必要
import type { Hsv, Oklab, Oklch, Rgb } from 'culori/fn';
export type { Rgb, Hsv, Oklab, Oklch };

// 染料のプロパティ形状（クラスDyeが実装するインターフェース）
export interface DyeProps {
  id: string;
  name: string;
  category: DyeCategory;
  rgb: Rgb; // culori Rgb (0-1範囲, mode: 'rgb')
  hsv: Hsv; // culori Hsv (s,v: 0-1範囲, mode: 'hsv')
  hex: string;
  oklab: Oklab; // culori Oklab (mode: 'oklab')
  tags?: string[];
  lodestone?: string;
}

export type DyeCandidate = {
  dye: DyeProps;
  delta: number;
};

// ===== 保存・共有用の型（0-255範囲） =====

// 保存用RGB（0-255範囲）- JSONやLocalStorageで使用
export interface RGBColor255 {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

// 色の役割（黄金比計算用）- 翻訳キーとして使用
export type ColorRole = 'main' | 'sub' | 'accent';

// 役割付きの染料情報（Paletteクラスで使用）
export interface DyeWithRole {
  dye: DyeProps;
  role: ColorRole;
  percent: number; // 0-100の整数
}

// カララントカテゴリ（内部キー・英語）
export type DyeCategory =
  | 'white'
  | 'red'
  | 'brown'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'rare';

// ===== i18n関連 =====

// サポート言語
export type Locale = 'en' | 'ja';

// 翻訳データ構造
export interface DyeTranslations {
  dyes: Record<string, string>; // id → 翻訳名
  categories: Record<DyeCategory, string>; // カテゴリキー → 翻訳名
}

// Lodestoneドメインマッピング
export const LODESTONE_DOMAINS: Record<Locale, string> = {
  en: 'na.finalfantasyxiv.com',
  ja: 'jp.finalfantasyxiv.com',
};

// 配色パターン
export type HarmonyPattern =
  | 'triadic'
  | 'split-complementary'
  | 'analogous'
  | 'monochromatic'
  | 'similar'
  | 'contrast'
  | 'clash';

// フィルター設定
export interface FilterOptions {
  categories: DyeCategory | null;
  hueRange: [number, number];
  saturationRange: [number, number];
  valueRange: [number, number];
  excludeMetallic: boolean;
}

// dyes.jsonからの生データ型（派生値なし、RGBのみ、0-255範囲）
export interface RawDyeData {
  id: string;
  name: string;
  category: DyeCategory;
  rgb: RGBColor255; // JSONは0-255範囲
  tags?: string[];
  lodestone?: string;
}

// dyes.jsonのルート型
export interface RawDyeDataFile {
  dyes: RawDyeData[];
}

// カララントデータJSONの型（後方互換性のため維持）
export interface DyeData {
  dyes: DyeProps[];
}

// パレットエントリ基底型（お気に入り・履歴共通）
export interface PaletteEntry {
  id: string;
  primaryDye: DyeProps;
  suggestedDyes: [DyeProps, DyeProps];
  pattern: HarmonyPattern;
  createdAt: string;
}

// 履歴エントリ
export interface HistoryEntry extends PaletteEntry {
  // 追加プロパティなし
}

// お気に入り（基底型を継承）
export interface Favorite extends PaletteEntry {
  // 追加プロパティなし
}

// 保存用の軽量型定義（hsv/hex除外、0-255範囲）
export interface StoredDye {
  id: string;
  name: string;
  category: DyeCategory;
  rgb: RGBColor255; // LocalStorage保存は0-255範囲
  tags?: string[];
}

export interface StoredCustomColor {
  id: string;
  name: string;
  rgb: RGBColor255; // LocalStorage保存は0-255範囲
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
  // 追加プロパティなし
}

// カスタムカラー（内部はculori型）
export interface CustomColor {
  id: string;
  name: string;
  rgb: Rgb; // culori Rgb (0-1範囲)
  hsv: Hsv; // culori Hsv (s,v: 0-1範囲)
  createdAt: Date;
  updatedAt: Date;
}

// 拡張されたDye（カスタムカラー対応）
export type DyeSource = 'game' | 'custom';

export interface ExtendedDye extends DyeProps {
  source: DyeSource;
  customColor?: CustomColor;
}

// カスタムカラー対応シェアデータ（共有用は0-255範囲）
export interface CustomColorShare {
  type: 'custom';
  name: string;
  rgb: RGBColor255; // 共有URLは0-255範囲
}

export interface ExtendedSharePaletteData {
  p: string | CustomColorShare;
  s: [string, string];
  pt: HarmonyPattern;
}

// カスタムカラー対応お気に入り
export interface ExtendedFavorite extends Omit<Favorite, 'primaryDye'> {
  primaryDye: DyeProps | CustomColor;
}

// おすすめパレット（サーバーから取得）
export interface ShowcasePalette {
  id: number;
  primaryDyeId: string;
  suggestedDyeIds: [string, string];
  pattern: HarmonyPattern;
  createdAt: string;
}

// おすすめパレットAPIレスポンス
export interface ShowcaseData {
  palettes: ShowcasePalette[];
  updatedAt: string | null;
}

// ===== 襲色目関連 =====

// 季節の識別子
export type KasaneSeason = 'spring' | 'summer' | 'autumn' | 'winter' | 'misc';

// 襲色目エントリ
export interface KasaneIrome {
  id: string; // ローマ字表記（例: "ume", "sakura"）
  name: string; // 日本語名（例: "梅"）
  reading: string; // 読み仮名（例: "うめ"）
  season: KasaneSeason; // 所属季節
  omote: string; // 表カララントID（例: "dye_093"）
  ura: string; // 裏カララントID（例: "dye_015"）
}

// kasane.jsonのルート型
export interface KasaneData {
  kasane: KasaneIrome[];
}
