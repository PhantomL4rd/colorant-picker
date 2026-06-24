import type {
  DyeCategory,
  DyeProps,
  DyeSource,
  DyeTag,
  Oklab,
  Oklch,
  RawDyeData,
  RGBColor255,
  Rgb,
  StoredDye,
} from '$lib/types';
import { formatHex, toOklab, toOklch } from '$lib/utils/color/colorConversion';

/**
 * 染料クラス
 *
 * colorjs.io の {space, coords} 形式の色オブジェクトを内部で直接保持。
 * UI表示用には0-255/0-100範囲のヘルパーを提供。
 */
export class Dye implements DyeProps {
  readonly id: string;
  readonly name: string;
  readonly category: DyeCategory;
  readonly rgb: Rgb; // colorjs.io sRGB (0-1範囲)
  readonly tags?: DyeTag[];
  readonly source?: DyeSource;
  readonly lodestone?: string;

  constructor(data: RawDyeData) {
    this.id = data.id;
    this.name = data.name;
    this.category = data.category;
    // JSONの0-255範囲から colorjs.io の0-1範囲に変換
    this.rgb = {
      space: 'srgb',
      coords: [data.rgb.r / 255, data.rgb.g / 255, data.rgb.b / 255],
    };
    this.tags = data.tags;
    this.source = data.source;
    this.lodestone = data.lodestone;
  }

  /** HEX文字列 */
  get hex(): string {
    return formatHex(this.rgb);
  }

  /** colorjs.io Oklab (直交座標 - 中間色計算/deltaE 用) */
  get oklab(): Oklab {
    return toOklab(this.rgb);
  }

  /** colorjs.io Oklch (極座標 - 色相回転/明度・彩度操作 用) */
  get oklch(): Oklch {
    return toOklch(this.rgb);
  }

  // ===== 保存・共有用ヘルパー =====

  /** 保存用RGB (0-255範囲) */
  get rgb255(): RGBColor255 {
    const [r, g, b] = this.rgb.coords;
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
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
      source: this.source,
    };
  }
}
