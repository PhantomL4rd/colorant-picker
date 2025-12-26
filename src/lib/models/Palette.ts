import type {
  DyeProps,
  DyeWithRole,
  HarmonyPattern,
  PaletteEntry,
  ShowcasePalette,
} from '$lib/types';
import { BASE_WEIGHTS, calculateDeltaE, SUPPRESSION_FACTOR } from '$lib/utils/color/colorRatio';

/**
 * パレットクラス
 *
 * 3色の組み合わせを表し、役割（メイン/サブ/アクセント）と比率を計算する。
 * 役割でソートされた提案色を取得するメソッドを持つ。
 */
export class Palette {
  readonly primary: DyeProps;
  readonly suggested: readonly [DyeProps, DyeProps];
  readonly pattern: HarmonyPattern;

  private _ratioCache: [DyeWithRole, DyeWithRole, DyeWithRole] | null = null;

  constructor(primary: DyeProps, suggested: [DyeProps, DyeProps], pattern: HarmonyPattern) {
    this.primary = primary;
    this.suggested = suggested;
    this.pattern = pattern;
  }

  /**
   * ShowcasePalette（APIレスポンス）からPaletteを生成
   * @param showcase サーバーから取得したパレットデータ
   * @param dyes 染料データの配列
   * @returns Palette または null（染料が見つからない場合）
   */
  static fromShowcase(showcase: ShowcasePalette, dyes: DyeProps[]): Palette | null {
    const primary = dyes.find((d) => d.id === showcase.primaryDyeId);
    const suggested1 = dyes.find((d) => d.id === showcase.suggestedDyeIds[0]);
    const suggested2 = dyes.find((d) => d.id === showcase.suggestedDyeIds[1]);

    if (!primary || !suggested1 || !suggested2) return null;
    return new Palette(primary, [suggested1, suggested2], showcase.pattern);
  }

  /**
   * 3色の役割と比率を計算（キャッシュ付き）
   * 順序: [メイン, サブ, アクセント]
   */
  get ratio(): [DyeWithRole, DyeWithRole, DyeWithRole] {
    if (this._ratioCache) return this._ratioCache;

    const [color1, color2] = this.suggested;

    // メインからの色差を計算
    const deltaE1 = calculateDeltaE(this.primary.rgb, color1.rgb);
    const deltaE2 = calculateDeltaE(this.primary.rgb, color2.rgb);

    // 役割判定：色差が小さい方がサブ、大きい方がアクセント
    let subDye: DyeProps;
    let accentDye: DyeProps;
    let subDeltaE: number;
    let accentDeltaE: number;

    if (deltaE1 <= deltaE2) {
      subDye = color1;
      accentDye = color2;
      subDeltaE = deltaE1;
      accentDeltaE = deltaE2;
    } else {
      subDye = color2;
      accentDye = color1;
      subDeltaE = deltaE2;
      accentDeltaE = deltaE1;
    }

    // 非線形補正を適用したウェイト計算
    const mainWeight = BASE_WEIGHTS.main;
    const subWeight = BASE_WEIGHTS.sub * Math.exp(-SUPPRESSION_FACTOR * subDeltaE);
    const accentWeight = BASE_WEIGHTS.accent * Math.exp(-SUPPRESSION_FACTOR * accentDeltaE);

    // 正規化して比率を計算
    const totalWeight = mainWeight + subWeight + accentWeight;
    const rawMainPercent = (mainWeight / totalWeight) * 100;
    const rawSubPercent = (subWeight / totalWeight) * 100;
    const rawAccentPercent = (accentWeight / totalWeight) * 100;

    // 四捨五入して整数化
    let mainPercent = Math.round(rawMainPercent);
    const subPercent = Math.round(rawSubPercent);
    const accentPercent = Math.round(rawAccentPercent);

    // 合計が100%になるように調整
    const total = mainPercent + subPercent + accentPercent;
    if (total !== 100) {
      mainPercent += 100 - total;
    }

    this._ratioCache = [
      { dye: this.primary, role: 'main', percent: mainPercent },
      { dye: subDye, role: 'sub', percent: subPercent },
      { dye: accentDye, role: 'accent', percent: accentPercent },
    ];

    return this._ratioCache;
  }

  /** メインの役割情報 */
  get main(): DyeWithRole {
    return this.ratio[0];
  }

  /** サブの役割情報 */
  get sub(): DyeWithRole {
    return this.ratio[1];
  }

  /** アクセントの役割情報 */
  get accent(): DyeWithRole {
    return this.ratio[2];
  }

  /** 役割順でソートされた提案色 [サブ, アクセント] */
  get sortedSuggested(): readonly [DyeWithRole, DyeWithRole] {
    return [this.sub, this.accent] as const;
  }

  /**
   * 別のパレットと同一かどうか判定
   * primary, suggested[0], suggested[1], pattern がすべて一致する場合にtrue
   */
  equals(other: Palette | PaletteEntry): boolean {
    const otherSuggested = 'suggested' in other ? other.suggested : other.suggestedDyes;
    const otherPrimary = 'primary' in other ? other.primary : other.primaryDye;

    return (
      this.primary.id === otherPrimary.id &&
      this.suggested[0].id === otherSuggested[0].id &&
      this.suggested[1].id === otherSuggested[1].id &&
      this.pattern === other.pattern
    );
  }

  /**
   * パレットエントリの配列内に同一のパレットが存在するかチェック
   */
  isIn(entries: PaletteEntry[]): boolean {
    return entries.some((entry) => this.equals(entry));
  }
}
