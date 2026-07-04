/**
 * モノクロマティック配色セレクター
 *
 * colorjs.io の {space, coords} 形式の色オブジェクトを直接使用。
 */

import type { DyeProps, Oklch } from '$lib/types';
import { EPSILON, MONOCHROMATIC_CONFIG } from '$lib/constants/color';
import { GRAY_CHROMA_THRESHOLD, hueDiff } from '../colorConversion';

type Candidate = {
  dye: DyeProps;
  oklch: Oklch;
  score: number;
  dh: number;
  dC: number;
  dL: number;
};

type Options = {
  hueWindowDeg?: number; // e.g.: 35
  thetaDeg?: number; // e.g.: 30
  weights?: { wh: number; wc: number; wl: number };
  numResults?: number;
  diversifyByLightness?: boolean;
};

function huePenalty(dh: number, theta: number): number {
  // 色相 (h) の差が theta を超えるとペナルティが急増するようスコア付け
  const x = dh / theta;
  return x * x;
}

export function selectMonochromaticDyes(
  baseDye: DyeProps,
  palette: DyeProps[],
  opts: Options = {}
): Candidate[] {
  const {
    hueWindowDeg = MONOCHROMATIC_CONFIG.HUE_WINDOW_DEG,
    thetaDeg = MONOCHROMATIC_CONFIG.THETA_DEG,
    weights = {
      wh: MONOCHROMATIC_CONFIG.WEIGHTS.HUE,
      wc: MONOCHROMATIC_CONFIG.WEIGHTS.CHROMA,
      wl: MONOCHROMATIC_CONFIG.WEIGHTS.LIGHTNESS,
    },
    numResults = 2,
    diversifyByLightness = false,
  } = opts;

  const base = baseDye.oklch;
  const [baseL, baseC, baseH] = base.coords;
  const baseIsGray = baseC <= GRAY_CHROMA_THRESHOLD;

  // 1) 基準色との色相・彩度・明度の差を重み付けしてスコアリング
  const scored: Candidate[] = palette
    .filter((d) => d.id !== baseDye.id)
    .map((dye) => {
      const c = dye.oklch;
      const [cL, cC, cH] = c.coords;
      // ベース・候補いずれかが無彩色なら色相距離は無意味（null→0°=赤 扱い）なので免除し、
      // ベース側の baseIsGray と対称に扱う。
      const candIsGray = cC <= GRAY_CHROMA_THRESHOLD;
      const dh = baseIsGray || candIsGray ? 0 : hueDiff(baseH ?? 0, cH ?? 0);
      const dC = Math.abs(cC - baseC);
      const dL = Math.abs(cL - baseL);

      const s =
        weights.wh * huePenalty(dh, thetaDeg) +
        weights.wc * (dC / (baseC + EPSILON)) +
        weights.wl * dL;

      return { dye, oklch: c, score: s, dh, dC, dL };
    });

  // 2) 色相をフィルタして同系色に絞る（厳しめにしたいときは 30° 程度）
  const filtered = scored.filter((c) => c.dh <= hueWindowDeg);

  // Fallback 処理: 足りない時は「最も近い色相」から追加。
  // filtered に採用済みの候補を母集合から除外し、同一染料の重複 push を防ぐ。
  if (filtered.length < numResults) {
    const needed = numResults - filtered.length;
    const filteredIds = new Set(filtered.map((c) => c.dye.id));
    const fallback = scored
      .filter((c) => !filteredIds.has(c.dye.id))
      .sort((a, b) => a.dh - b.dh)
      .slice(0, needed);
    filtered.push(...fallback);
  }

  // 3) 明度で分散（任意）：近しいスコア上位を取りつつ L を簡易的にクラスタリング
  let picked: Candidate[];

  if (!diversifyByLightness) {
    picked = filtered.sort((a, b) => a.score - b.score).slice(0, numResults);
  } else {
    const sorted = filtered.sort((a, b) => a.score - b.score);

    // 候補色をその L の値域でクラスタ分割し、各クラスタから均等に選定する
    const BINS = MONOCHROMATIC_CONFIG.LIGHTNESS_BINS;
    const bins: Candidate[][] = Array.from({ length: BINS }, () => []);
    const Ls = sorted.map((x) => x.oklch.coords[0]);
    Ls.push(baseL); // 基準色の L も考慮する
    const Lmin = Math.min(...Ls);
    const Lmax = Math.max(...Ls);
    const step = (Lmax - Lmin) / BINS || 1;

    // L=Lmax のとき floor((L-Lmin)/step)=BINS で範囲外になるため必ずクランプする
    const binOf = (L: number): number =>
      Math.min(BINS - 1, Math.max(0, Math.floor((L - Lmin) / step)));

    const capacity = Math.ceil(numResults / BINS);
    // 容量超過で bins に入れなかった候補（スコア順）を控えとして保持する
    const overflow: Candidate[] = [];
    for (const c of sorted) {
      const bin = binOf(c.oklch.coords[0]);
      if (bins[bin].length < capacity) bins[bin].push(c);
      else overflow.push(c);
    }

    // 基準色の属するクラスタを除外（banned もクランプして範囲外参照を防ぐ）
    const banned = binOf(baseL);
    const selected: Candidate[] = [];
    const bannedItems: Candidate[] = []; // 除外クラスタの候補（不足時の最終補完用）
    bins.forEach((binItems, i) => {
      if (i === banned) bannedItems.push(...binItems);
      else selected.push(...binItems);
    });

    picked = selected.slice(0, numResults);

    // 不足時は捨てた候補（容量超過分 → 除外クラスタ分の順）でスコア順に補完し、
    // 必ず要求件数（利用可能なら numResults）を返す
    if (picked.length < numResults) {
      const pickedIds = new Set(picked.map((c) => c.dye.id));
      const refill = [...overflow, ...bannedItems]
        .filter((c) => !pickedIds.has(c.dye.id))
        .sort((a, b) => a.score - b.score);
      for (const c of refill) {
        if (picked.length >= numResults) break;
        picked.push(c);
      }
    }
  }

  // 4) 最終的にスコア→色相差→彩度差で安定ソート
  picked.sort((a, b) => a.score - b.score || a.dh - b.dh || a.dC - b.dC);

  return picked;
}
