// ===== colorjs.io 互換の色オブジェクト型 =====
// colorjs.io の ColorObject 形式 ({ space: string, coords: [...] }) を採用。
// Helmlab は colorjs.io 0.7.0 で 'helmlab-metric' として同梱済み。
export interface Rgb {
  space: 'srgb';
  coords: [number, number, number]; // r, g, b (0-1)
  alpha?: number;
}
export interface Oklab {
  space: 'oklab';
  coords: [number, number, number]; // L, a, b
  alpha?: number;
}
export interface Oklch {
  space: 'oklch';
  coords: [number, number, number | null]; // L, C, h (achromaticでnull)
  alpha?: number;
}

// 染料のプロパティ形状（クラスDyeが実装するインターフェース）
export interface DyeProps {
  id: string;
  name: string;
  category: DyeCategory;
  rgb: Rgb; // colorjs.io sRGB (0-1範囲)
  hex: string;
  oklab: Oklab; // colorjs.io Oklab (直交座標 - 中間色計算/deltaE 用)
  oklch: Oklch; // colorjs.io Oklch (極座標 - 色相回転/明度・彩度操作 用)
  tags?: DyeTag[];
  source?: DyeSource;
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

// カララントのタグ（内部キー・英語）
// - metallic: メタリック染料
// - vivid: ビビッド系染料
export type DyeTag = 'metallic' | 'vivid';

// カララント入手元（FF14のカララント統合仕様）
// - normal: ノーマルカラー（基本染料）
// - additional1: アディショナルカラー1
// - additional2: アディショナルカラー2
// - paid: 課金（オンラインストア販売・統合対象外）
export type DyeSource = 'normal' | 'additional1' | 'additional2' | 'paid';

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
  | 'tint'
  | 'shade'
  | 'clash';

// フィルター設定
export interface FilterOptions {
  categories: DyeCategory | null;
  excludeMetallic: boolean;
}

// dyes.jsonからの生データ型（派生値なし、RGBのみ、0-255範囲）
export interface RawDyeData {
  id: string;
  name: string;
  category: DyeCategory;
  rgb: RGBColor255; // JSONは0-255範囲
  tags?: DyeTag[];
  source?: DyeSource;
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
  tags?: DyeTag[];
  source?: DyeSource;
}

// 保存用パレットエントリ基底型
export interface StoredPaletteEntry {
  id: string;
  primaryDye: StoredDye;
  suggestedDyes: [StoredDye, StoredDye];
  pattern: HarmonyPattern;
  createdAt: string;
}

// 保存用お気に入り
export interface StoredFavorite extends StoredPaletteEntry {
  // 追加プロパティなし
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

// ===== かさね色目関連 =====

// 季節の識別子
export type KasaneSeason = 'spring' | 'summer' | 'autumn' | 'winter' | 'misc';

// 表/裏の伝統色の組み合わせ（1つのかさねに複数の異説がある場合は variants に複数並ぶ）
export interface KasaneVariant {
  omoteColor: string; // TraditionalColor.id を参照（例: "白"）
  uraColor: string; // TraditionalColor.id を参照（例: "蘇芳"）
  nakaColor?: string; // 3色（表/中/裏）専用。kasane-three.json でのみ使用
}

// かさね色目エントリ
export interface KasaneIrome {
  id: string; // ローマ字表記（例: "ume", "sakura"）
  name: string; // 日本語名（例: "梅"）
  reading: string; // 読み仮名（例: "うめ"）
  season: KasaneSeason; // 所属季節
  variants: KasaneVariant[]; // 表/裏の解釈。先頭が代表
  hidden?: boolean; // 色差が大きいため非表示
}

// kasane.jsonのルート型
export interface KasaneData {
  kasane: KasaneIrome[];
}

// ===== 伝統色（かさね色目で参照される） =====

export interface TraditionalColor {
  id: string; // 日本語名（例: "白", "蘇芳"）
  reading: string; // 読み仮名（例: "しろ"）
  hex: string; // CSS hex（例: "#f9fbed"）
  dyeId: string; // 最も近い既存カララントのID（例: "dye_093"）
  lockDye?: boolean; // true なら自動洗い替えスクリプトの対象外（意図的な選択）
  note: string; // 出所メモなど
}

// traditional-colors.jsonのルート型
export interface TraditionalColorData {
  colors: TraditionalColor[];
}
