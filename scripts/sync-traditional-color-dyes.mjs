/**
 * 伝統色 → 最近傍FF14カララント 再計算スクリプト
 *
 * ## 概要
 * static/data/traditional-colors.json の各伝統色について、
 * dyes.json から最も色差（CIEDE2000）の小さいカララントを探し、
 * dyeId フィールドを更新する。
 *
 * アプリ runtime の findNearestDyesInOklab と同じ CIEDE2000 メトリックを使用。
 * 新しいカララントが追加されたときは、dyes.json を更新してこのスクリプトを
 * 走らせれば、伝統色→dyeのマッピングが自動で洗い替えられる。
 * kasane.json は traditional-colors.json 経由で参照しているため、
 * このスクリプトだけ走らせれば全かさね色目の表示も自動更新される。
 *
 * ## helmlab フォールバック（実験中）
 * 第一候補（最小 CIEDE2000 ΔE00）の色差が --delta-threshold を超えた場合、
 * helmlab の知覚距離（distanceFromLab）で全候補から最近傍を選び直す。
 * 色相±許容範囲・chroma ガード・excess 上限などの手作りガードは廃止し、
 * helmlab の知覚距離だけに任せる。プールフィルタは「EXCLUDED_TAGS の除外」のみ。
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
 * node scripts/sync-traditional-color-dyes.mjs --delta-threshold=10
 *   - helmlab フォールバック発動の CIEDE2000 ΔE00 閾値を調整（既定 8）
 */

import fs from 'node:fs';
import { ColorSpace, Lab, OKLab, sRGB, deltaE as colorjsDeltaE, parse } from 'colorjs.io/fn';
import { Helmlab } from 'helmlab';

ColorSpace.register(sRGB);
ColorSpace.register(OKLab);
ColorSpace.register(Lab);

const TRADITIONAL_COLORS_PATH = './static/data/traditional-colors.json';
const DYES_PATH = './static/data/dyes.json';
const EXCLUDED_TAGS = ['metallic', 'vivid'];
// CIEDE2000 で「明らかに違う色」相当。JND ≈ 2.3、5 は「よく見れば差が分かる」、10+ は「別系統」。
// runtime の HELM_FALLBACK_DELTA_THRESHOLD と揃える。
const DEFAULT_DELTA_THRESHOLD = 8;

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

const deltaE = (a, b) => colorjsDeltaE(a, b, '2000');
const helmlab = new Helmlab();

const dyes = JSON.parse(fs.readFileSync(DYES_PATH, 'utf-8')).dyes;
const traditionalData = JSON.parse(fs.readFileSync(TRADITIONAL_COLORS_PATH, 'utf-8'));

function rgbToHex(rgb) {
  const h = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${h(rgb.r)}${h(rgb.g)}${h(rgb.b)}`;
}

const candidateDyes = dyes
  .filter((d) => !d.tags || !d.tags.some((tag) => EXCLUDED_TAGS.includes(tag)))
  .map((d) => {
    const color = parse(rgbToHex(d.rgb));
    const helm = helmlab.fromHex(rgbToHex(d.rgb));
    return { dye: d, color, helm };
  });
const dyeById = new Map(dyes.map((d) => [d.id, d]));

function findClosestByDeltaE(target) {
  let minDelta = Infinity;
  let closest = null;
  for (const c of candidateDyes) {
    const delta = deltaE(target, c.color);
    if (delta < minDelta) {
      minDelta = delta;
      closest = c;
    }
  }
  return { dye: closest.dye, delta: minDelta };
}

function findClosestByHelmlab(targetHelm, target) {
  let minDist = Infinity;
  let closest = null;
  for (const c of candidateDyes) {
    const dist = helmlab.distanceFromLab(targetHelm, c.helm);
    if (dist < minDist) {
      minDist = dist;
      closest = c;
    }
  }
  return { dye: closest.dye, dist: minDist, delta: deltaE(target, closest.color) };
}

function resolveDye(hex) {
  const target = parse(hex);
  if (!target) throw new Error(`invalid hex: ${hex}`);
  const primary = findClosestByDeltaE(target);

  if (primary.delta <= deltaThreshold) {
    return { ...primary, fallback: false };
  }
  const targetHelm = helmlab.fromHex(hex);
  const constrained = findClosestByHelmlab(targetHelm, target);
  if (constrained.dye.id === primary.dye.id) {
    return { ...primary, fallback: false, noHelmDiff: true };
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
      newDist: result.dist,
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
      delta: result.delta.toFixed(2),
      fallback: result.fallback,
    });
    color.dyeId = result.dye.id;
  }
}

console.log(`伝統色: ${traditionalData.colors.length} 色 (うちロック: ${lockedSkipped} 色)`);
console.log(`設定: --delta-threshold=${deltaThreshold} (helmlab fallback)`);
console.log(`helmlab フォールバック発動: ${fallbackUsed} 件`);
console.log(`変更: ${changed} 件`);
console.log('');
for (const c of changes) {
  const mark = c.fallback ? ' [helmlab フォールバック]' : '';
  console.log(`■ ${c.id} (${c.hex})${mark}`);
  console.log(
    `  ${c.oldDyeId} (${c.oldDyeName}) → ${c.newDyeId} (${c.newDyeName})  ΔE00=${c.delta}`,
  );
}
if (fallbackLogs.length > 0) {
  console.log('\n--- helmlab フォールバック詳細 ---');
  for (const f of fallbackLogs) {
    console.log(`■ ${f.id} (${f.hex})`);
    console.log(
      `  第一候補(CIEDE2000): ${f.primaryDyeName} (ΔE00=${f.primaryDelta.toFixed(2)})`,
    );
    console.log(
      `  採用(helmlab)      : ${f.newDyeName} (dist=${f.newDist.toFixed(4)}, ΔE00=${f.newDelta.toFixed(2)})`,
    );
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
