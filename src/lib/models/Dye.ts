import type {
  DyeCategory,
  DyeProps,
  DyeTag,
  Hsv,
  Oklab,
  RawDyeData,
  RGBColor255,
  Rgb,
  StoredDye,
} from '$lib/types';
import { formatHex, toHsv, toOklab } from '$lib/utils/color/colorConversion';

/**
 * 染料クラス
 *
 * culori型を内部で直接使用し、変換オーバーヘッドを削減。
 * UI表示用には0-255/0-100範囲のヘルパーを提供。
 */
export class Dye implements DyeProps {
  readonly id: string;
  readonly name: string;
  readonly category: DyeCategory;
  readonly rgb: Rgb; // culori Rgb (0-1範囲)
  readonly tags?: DyeTag[];
  readonly lodestone?: string;

  constructor(data: RawDyeData) {
    this.id = data.id;
    this.name = data.name;
    this.category = data.category;
    // JSONの0-255範囲からculoriの0-1範囲に変換
    this.rgb = {
      mode: 'rgb',
      r: data.rgb.r / 255,
      g: data.rgb.g / 255,
      b: data.rgb.b / 255,
    };
    this.tags = data.tags;
    this.lodestone = data.lodestone;
  }

  /** culori Hsv (s,v: 0-1範囲) */
  get hsv(): Hsv {
    return toHsv(this.rgb) as Hsv;
  }

  /** HEX文字列 */
  get hex(): string {
    return formatHex(this.rgb).toUpperCase();
  }

  /** culori Oklab */
  get oklab(): Oklab {
    return toOklab(this.rgb) as Oklab;
  }

  // ===== 保存・共有用ヘルパー =====

  /** 保存用RGB (0-255範囲) */
  get rgb255(): RGBColor255 {
    return {
      r: Math.round(this.rgb.r * 255),
      g: Math.round(this.rgb.g * 255),
      b: Math.round(this.rgb.b * 255),
    };
  }

  /**
   * LocalStorage保存用の軽量オブジェクトに変換
   * 計算可能な派生値（hsv, hex, oklab）を除外し、RGBは0-255範囲で保存
   */
  toStorable(): StoredDye {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      rgb: this.rgb255, // 0-255範囲で保存
      tags: this.tags,
    };
  }
}
