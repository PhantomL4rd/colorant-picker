/**
 * 伝統色 → 最近傍FF14カララント 再計算スクリプト
 *
 * ## 概要
 * static/data/traditional-colors.json の各伝統色について、
 * dyes.json から最も色差（OKLab deltaE）の小さいカララントを探し、
 * dyeId フィールドを更新する。
 *
 * 新しいカララントが追加されたときは、dyes.json を更新してこのスクリプトを
 * 走らせれば、伝統色→dyeのマッピングが自動で洗い替えられる。
 * kasane.json は traditional-colors.json 経由で参照しているため、
 * このスクリプトだけ走らせれば全かさね色目の表示も自動更新される。
 *
 * ## 色相フォールバック
 * 第一候補（最小deltaE）の色差が --delta-threshold を超えた場合、
 * 「色相距離が --hue-tolerance 以内のカララントの中で最小deltaE」を選び直す。
 * 例: 赤 (#c82a20) は元の最近傍が Sunset Orange（オレンジ）だが、
 *     色相を優先することで赤系のカララントに置き換えられる。
 *
 * 対象色の彩度（OKLCH chroma）が低い場合は色相が不安定なので、
 * 色相フォールバックは適用せず素直に最小deltaEを採用する。
 *
 * ## 除外対象タグ
 * - metallic: 質感が異なるため
 * - vivid: ビビッド系は伝統色と相性が悪い
 *
 * ## 個別ロック
 * traditional-colors.json のエントリに `"lockDye": true` を付けると、
 * そのエントリは自動洗い替え対象外になる。
 * 例: 白瑩 は Pearl White (dye_114) を意図的に採用しているためロック。
 *
 * ## 使い方
 * node scripts/sync-traditional-color-dyes.mjs
 *   - 変更箇所を標準出力に表示し、traditional-colors.json を書き換える
 *
 * node scripts/sync-traditional-color-dyes.mjs --dry-run
 *   - 書き換えずに差分のみ表示
 *
 * node scripts/sync-traditional-color-dyes.mjs --delta-threshold=0.08 --hue-tolerance=20
 *   - 色相フォールバック発動の閾値と色相許容範囲を調整
 */

import fs from 'node:fs';
import { converter, parse } from 'culori';
import { differenceEuclidean } from 'culori/fn';

const TRADITIONAL_COLORS_PATH = './static/data/traditional-colors.json';
const DYES_PATH = './static/data/dyes.json';
const EXCLUDED_TAGS = ['metallic', 'vivid'];
const DEFAULT_DELTA_THRESHOLD = 0.08;
const DEFAULT_HUE_TOLERANCE_DEG = 15;
const MIN_CHROMA_FOR_HUE_FALLBACK = 0.04;
// 対象色が彩度を持つときに「明度だけ近いグレー寄り染料」が選ばれるのを防ぐ閾値。
// 対象 chroma がこの値以上のとき、染料 chroma が target * CHROMA_RATIO_MIN 未満の染料を除外する。
const CHROMATIC_TARGET_THRESHOLD = 0.06;
const DEFAULT_CHROMA_RATIO_MIN = 0.4;
// 色相フォールバックの結果が第一候補よりこの値以上 deltaE が悪化していたら採用しない
// （色相範囲内に妥当な候補がない場合に明らかにズレた色を掴むのを防ぐ）
const DEFAULT_FALLBACK_MAX_EXCESS = 0.05;

function parseNumberArg(name, fallback) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  if (!arg) return fallback;
  const v = Number(arg.slice(prefix.length));
  if (!Number.isFinite(v)) throw new Error(`invalid --${name} value`);
  return v;
}

const dryRun = process.argv.includes('--dry-run');
const deltaThreshold = parseNumberArg('delta-threshold', DEFAULT_DELTA_THRESHOLD);
const hueTolerance = parseNumberArg('hue-tolerance', DEFAULT_HUE_TOLERANCE_DEG);
const chromaRatioMin = parseNumberArg('chroma-ratio-min', DEFAULT_CHROMA_RATIO_MIN);
const fallbackMaxExcess = parseNumberArg('fallback-max-excess', DEFAULT_FALLBACK_MAX_EXCESS);

const deltaE = differenceEuclidean('oklab');
const toOklch = converter('oklch');

const dyes = JSON.parse(fs.readFileSync(DYES_PATH, 'utf-8')).dyes;
const traditionalData = JSON.parse(fs.readFileSync(TRADITIONAL_COLORS_PATH, 'utf-8'));

const candidateDyes = dyes
  .filter((d) => !d.tags || !d.tags.some((tag) => EXCLUDED_TAGS.includes(tag)))
  .map((d) => {
    const oklab = parse(`rgb(${d.rgb.r}, ${d.rgb.g}, ${d.rgb.b})`);
    const oklch = toOklch(oklab);
    return { dye: d, oklab, hue: oklch.h, chroma: oklch.c };
  });
const dyeById = new Map(dyes.map((d) => [d.id, d]));

function hueDistance(a, b) {
  if (a == null || b == null) return Infinity;
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

function eligibleDyes(targetChroma) {
  if ((targetChroma ?? 0) < CHROMATIC_TARGET_THRESHOLD) return candidateDyes;
  const minDyeChroma = targetChroma * chromaRatioMin;
  const filtered = candidateDyes.filter((c) => (c.chroma ?? 0) >= minDyeChroma);
  return filtered.length > 0 ? filtered : candidateDyes;
}

function findClosestByDeltaE(targetOklab, targetChroma) {
  const pool = eligibleDyes(targetChroma);
  let minDelta = Infinity;
  let closest = null;
  for (const c of pool) {
    const delta = deltaE(targetOklab, c.oklab);
    if (delta < minDelta) {
      minDelta = delta;
      closest = c;
    }
  }
  return { dye: closest.dye, delta: minDelta };
}

function findClosestByDeltaEWithinHue(targetOklab, targetHue, tolerance, targetChroma) {
  const pool = eligibleDyes(targetChroma);
  let minDelta = Infinity;
  let closest = null;
  for (const c of pool) {
    if (hueDistance(targetHue, c.hue) > tolerance) continue;
    const delta = deltaE(targetOklab, c.oklab);
    if (delta < minDelta) {
      minDelta = delta;
      closest = c;
    }
  }
  return closest ? { dye: closest.dye, delta: minDelta } : null;
}

function resolveDye(hex) {
  const target = parse(hex);
  if (!target) throw new Error(`invalid hex: ${hex}`);
  const targetLch = toOklch(target);
  const primary = findClosestByDeltaE(target, targetLch.c);

  if (primary.delta <= deltaThreshold) {
    return { ...primary, fallback: false };
  }
  if ((targetLch.c ?? 0) < MIN_CHROMA_FOR_HUE_FALLBACK) {
    return { ...primary, fallback: false, lowChroma: true };
  }
  const constrained = findClosestByDeltaEWithinHue(target, targetLch.h, hueTolerance, targetLch.c);
  if (!constrained || constrained.dye.id === primary.dye.id) {
    return { ...primary, fallback: false, noHueMatch: !constrained };
  }
  if (constrained.delta - primary.delta > fallbackMaxExcess) {
    return { ...primary, fallback: false, fallbackRejected: { dye: constrained.dye, delta: constrained.delta } };
  }
  return { ...constrained, fallback: true, primary };
}

let changed = 0;
let lockedSkipped = 0;
let fallbackUsed = 0;
const changes = [];
const fallbackLogs = [];
for (const color of traditionalData.colors) {
  if (color.lockDye) {
    lockedSkipped++;
    continue;
  }
  const result = resolveDye(color.hex);
  if (result.fallback) {
    fallbackUsed++;
    fallbackLogs.push({
      id: color.id,
      hex: color.hex,
      primaryDyeName: result.primary.dye.name,
      primaryDelta: result.primary.delta,
      newDyeName: result.dye.name,
      newDelta: result.delta,
    });
  }
  const oldDyeId = color.dyeId;
  if (oldDyeId !== result.dye.id) {
    changed++;
    const oldDye = dyeById.get(oldDyeId);
    changes.push({
      id: color.id,
      hex: color.hex,
      oldDyeId,
      oldDyeName: oldDye?.name ?? '(unknown)',
      newDyeId: result.dye.id,
      newDyeName: result.dye.name,
      delta: result.delta.toFixed(4),
      fallback: result.fallback,
    });
    color.dyeId = result.dye.id;
  }
}

console.log(`伝統色: ${traditionalData.colors.length} 色 (うちロック: ${lockedSkipped} 色)`);
console.log(
  `設定: --delta-threshold=${deltaThreshold} --hue-tolerance=${hueTolerance} --chroma-ratio-min=${chromaRatioMin} --fallback-max-excess=${fallbackMaxExcess}`,
);
console.log(`色相フォールバック発動: ${fallbackUsed} 件`);
console.log(`変更: ${changed} 件`);
console.log('');
for (const c of changes) {
  const mark = c.fallback ? ' [色相フォールバック]' : '';
  console.log(`■ ${c.id} (${c.hex})${mark}`);
  console.log(
    `  ${c.oldDyeId} (${c.oldDyeName}) → ${c.newDyeId} (${c.newDyeName})  deltaE=${c.delta}`,
  );
}
if (fallbackLogs.length > 0) {
  console.log('\n--- 色相フォールバック詳細 ---');
  for (const f of fallbackLogs) {
    console.log(`■ ${f.id} (${f.hex})`);
    console.log(`  第一候補: ${f.primaryDyeName} (deltaE=${f.primaryDelta.toFixed(4)})`);
    console.log(`  採用    : ${f.newDyeName} (deltaE=${f.newDelta.toFixed(4)})`);
  }
}

if (!dryRun && changed > 0) {
  fs.writeFileSync(TRADITIONAL_COLORS_PATH, `${JSON.stringify(traditionalData, null, 2)}\n`);
  console.log(`\n書き込み完了: ${TRADITIONAL_COLORS_PATH}`);
} else if (dryRun) {
  console.log('\n--dry-run のため書き換えていません');
} else {
  console.log('\n変更なし');
}
