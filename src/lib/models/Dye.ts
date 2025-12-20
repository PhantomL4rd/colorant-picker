import type {
  DyeProps,
  RawDyeData,
  RGBColor,
  HSVColor,
  OklabColor,
  DyeCategory,
} from '$lib/types';
import { rgbToHsv, rgbToHex, rgbToOklab } from '$lib/utils/colorConversion';

/**
 * 染料クラス
 *
 * RGBを唯一の真実の源とし、派生値（hsv, hex, oklab）はgetterで純粋関数として計算する。
 * キャッシュなし - シンプルさを優先。
 */
export class Dye implements DyeProps {
  readonly id: string;
  readonly name: string;
  readonly category: DyeCategory;
  readonly rgb: RGBColor;
  readonly tags?: string[];
  readonly lodestone?: string;

  constructor(data: RawDyeData) {
    this.id = data.id;
    this.name = data.name;
    this.category = data.category;
    this.rgb = data.rgb;
    this.tags = data.tags;
    this.lodestone = data.lodestone;
  }

  /** RGBからHSVを計算 */
  get hsv(): HSVColor {
    return rgbToHsv(this.rgb);
  }

  /** RGBからHEXを計算 */
  get hex(): string {
    return rgbToHex(this.rgb);
  }

  /** RGBからOklabを計算 */
  get oklab(): OklabColor {
    return rgbToOklab(this.rgb);
  }
}
