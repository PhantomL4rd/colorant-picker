/**
 * かさね色目（襲色目）の色差計算・非表示フラグ設定スクリプト
 *
 * ## 概要
 * 平安時代の伝統的配色「かさね色目」をFF14カララントで近似する際、
 * 色差（deltaE）が大きすぎるエントリにhiddenフラグを設定する。
 *
 * ## 色差計算
 * - culoriライブラリのOKLab色空間で色差を計算
 * - OKLabは知覚的に均一な色空間で、人間の色の見え方に近い
 * - RGB Euclidean距離は使用しない（知覚と一致しないため）
 *
 * ## 閾値の決定（THRESHOLD = 0.07）
 * - 0.05: 61件除外（厳しすぎる、ほとんど消える）
 * - 0.06: 55件除外（厳選だが寂しい）
 * - 0.07: 26件除外（バランス良い、70件残る）★採用
 * - 0.08: 6件除外（緩すぎる）
 *
 * ## メタリック染料の扱い
 * - 基本的にメタリック染料は除外（質感が異なるため）
 * - 例外: 氷(kori)の表のみPearl White (dye_114)を手動設定
 *
 * ## 元データ
 * - 参照元: http://www.kariginu.jp/kikata/kasane-irome.htm
 * - 元のRGB値: docs/kasane-colors-mapping.csv に保存済み
 *
 * ## 使い方
 * 1. static/data/dyes.json に新カララントを追加
 * 2. node scripts/mark-hidden.mjs を実行
 *
 * ## 今後の更新
 * FF14でカララントが追加されたら、このスクリプトを再実行することで
 * 非表示エントリを減らせる可能性がある。
 */

import { differenceEuclidean } from 'culori/fn';
import { parse } from 'culori';
import fs from 'fs';

const CSV_PATH = './docs/kasane-colors-mapping.csv';
const THRESHOLD = 0.07; // OKLab deltaE閾値（これを超えると非表示）

const deltaE = differenceEuclidean('oklab');
const dyes = JSON.parse(fs.readFileSync('./static/data/dyes.json', 'utf-8')).dyes;
const kasane = JSON.parse(fs.readFileSync('./static/data/kasane.json', 'utf-8'));

// メタリック染料を除外（Pearl Whiteは氷用に別途許可）
const nonMetallicDyes = dyes.filter(d => !d.tags || !d.tags.includes('metallic'));
const dyesWithPearlWhite = dyes.filter(d => {
  if (!d.tags || !d.tags.includes('metallic')) return true;
  return d.name === 'Pearl White';
});

// CSVから元のRGB値を読み込む
function loadOriginalColors() {
  const csv = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = csv.trim().split('\n');
  const colorMap = {};

  // ヘッダーをスキップ
  for (let i = 1; i < lines.length; i++) {
    // rgb()の中にカンマがあるので正規表現でパース
    // 形式: 色名,rgb(r,g,b),表カララント,...,rgb(r,g,b),裏カララント,...
    const match = lines[i].match(/^([^,]+),(rgb\(\d+,\d+,\d+\)),[^,]+,[^,]+,[^,]+,(rgb\(\d+,\d+,\d+\))/);
    if (!match) {
      console.error(`CSV行パースエラー: ${lines[i].substring(0, 50)}...`);
      continue;
    }
    const id = match[1];
    const omoteRgb = match[2];
    const uraRgb = match[3];
    colorMap[id] = { omoteRgb, uraRgb };
  }

  return colorMap;
}

// rgb(r,g,b) 形式をパース
function parseRgb(str) {
  const m = str.match(/rgb\((\d+),(\d+),(\d+)\)/);
  if (!m) return null;
  return parse(`rgb(${m[1]}, ${m[2]}, ${m[3]})`);
}

// 最も近いカララントを探して最小deltaEを返す
function findMinDeltaE(targetColor, allowPearlWhite = false) {
  const candidates = allowPearlWhite ? dyesWithPearlWhite : nonMetallicDyes;
  let min = Infinity;

  for (const d of candidates) {
    const c = parse(`rgb(${d.rgb.r}, ${d.rgb.g}, ${d.rgb.b})`);
    const delta = deltaE(targetColor, c);
    if (delta < min) min = delta;
  }

  return min;
}

// メイン処理
const originalColors = loadOriginalColors();
const deltaMap = {};

for (const [id, colors] of Object.entries(originalColors)) {
  const omoteColor = parseRgb(colors.omoteRgb);
  const uraColor = parseRgb(colors.uraRgb);

  if (!omoteColor || !uraColor) {
    console.error(`パースエラー: ${id}`);
    continue;
  }

  // 氷(kori)の場合のみPearl Whiteを許可
  const allowPearlWhite = id === 'kori';

  const omoteDelta = findMinDeltaE(omoteColor, allowPearlWhite);
  const uraDelta = findMinDeltaE(uraColor, allowPearlWhite);

  // 表裏のうち大きい方を採用
  deltaMap[id] = Math.max(omoteDelta, uraDelta);
}

// kasane.jsonを更新
let hiddenCount = 0;
let unhiddenCount = 0;

for (const item of kasane.kasane) {
  const maxDelta = deltaMap[item.id];

  if (maxDelta && maxDelta > THRESHOLD) {
    if (!item.hidden) {
      unhiddenCount--; // カウント調整用（新規非表示）
    }
    item.hidden = true;
    hiddenCount++;
    console.log(`hidden: ${item.id} (${item.name}) deltaE=${maxDelta.toFixed(4)}`);
  } else if (item.hidden) {
    // 閾値以下になったので復活
    delete item.hidden;
    unhiddenCount++;
    console.log(`unhidden: ${item.id} (${item.name}) deltaE=${maxDelta?.toFixed(4) || 'N/A'}`);
  }
}

fs.writeFileSync('./static/data/kasane.json', JSON.stringify(kasane, null, 2) + '\n');

console.log(`\n${hiddenCount}件を非表示`);
if (unhiddenCount > 0) {
  console.log(`${unhiddenCount}件が復活！`);
}
