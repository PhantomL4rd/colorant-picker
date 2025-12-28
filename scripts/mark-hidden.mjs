/**
 * かさね色目の色差計算・カララント更新・非表示フラグ設定スクリプト
 *
 * ## 概要
 * 平安時代の伝統的配色「かさね色目」をFF14カララントで近似する。
 * - 各伝統色の元RGB値から、除外タグなしの染料で最も近いものを探す
 * - kasane.jsonのomote/uraを更新
 * - 色差（deltaE）が大きすぎるエントリにhiddenフラグを設定
 *
 * ## 色差計算
 * - culoriライブラリのOKLab色空間で色差を計算
 * - OKLabは知覚的に均一な色空間で、人間の色の見え方に近い
 *
 * ## 閾値の決定（THRESHOLD = 0.07）
 * - 0.05: 厳しすぎる
 * - 0.06: 厳選だが寂しい
 * - 0.07: バランス良い ★採用
 * - 0.08: 緩すぎる
 *
 * ## 除外対象タグ
 * - metallic: 質感が異なるため
 * - expensive: 高価な染料は伝統配色に向かない
 * - vivid: ビビッド系は伝統的な色合いとマッチしない
 *
 * ## 元データ
 * - 参照元: http://www.kariginu.jp/kikata/kasane-irome.htm
 * - 元のRGB値: docs/kasane-colors-mapping.csv に保存済み
 *
 * ## 使い方
 * 1. static/data/dyes.json に新カララントを追加
 * 2. node scripts/mark-hidden.mjs を実行
 */

import { differenceEuclidean } from 'culori/fn';
import { parse } from 'culori';
import fs from 'fs';

const CSV_PATH = './docs/kasane-colors-mapping.csv';
const THRESHOLD = Infinity; // 閾値なし（全件表示）

const deltaE = differenceEuclidean('oklab');
const dyes = JSON.parse(fs.readFileSync('./static/data/dyes.json', 'utf-8')).dyes;
const kasane = JSON.parse(fs.readFileSync('./static/data/kasane.json', 'utf-8'));

// 除外対象のタグ
const EXCLUDED_TAGS = ['metallic', 'vivid'];

// 除外タグを持つ染料を除外
const nonExcludedDyes = dyes.filter(d => !d.tags || !d.tags.some(tag => EXCLUDED_TAGS.includes(tag)));

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

// 最も近いカララントを探す（IDとdeltaEを返す）
function findClosestDye(targetColor) {
  let minDelta = Infinity;
  let closestDye = null;

  for (const d of nonExcludedDyes) {
    const c = parse(`rgb(${d.rgb.r}, ${d.rgb.g}, ${d.rgb.b})`);
    const delta = deltaE(targetColor, c);
    if (delta < minDelta) {
      minDelta = delta;
      closestDye = d;
    }
  }

  return { dye: closestDye, delta: minDelta };
}

// メイン処理
const originalColors = loadOriginalColors();
let hiddenCount = 0;
let updatedCount = 0;

for (const item of kasane.kasane) {
  const colors = originalColors[item.id];
  if (!colors) {
    console.error(`元データなし: ${item.id}`);
    continue;
  }

  const omoteColor = parseRgb(colors.omoteRgb);
  const uraColor = parseRgb(colors.uraRgb);

  if (!omoteColor || !uraColor) {
    console.error(`パースエラー: ${item.id}`);
    continue;
  }

  const omoteResult = findClosestDye(omoteColor);
  const uraResult = findClosestDye(uraColor);

  // カララントIDを更新
  const oldOmote = item.omote;
  const oldUra = item.ura;
  item.omote = omoteResult.dye.id;
  item.ura = uraResult.dye.id;

  if (oldOmote !== item.omote || oldUra !== item.ura) {
    updatedCount++;
    console.log(`updated: ${item.id} (${item.name})`);
    if (oldOmote !== item.omote) {
      console.log(`  omote: ${oldOmote} → ${item.omote} (${omoteResult.dye.name})`);
    }
    if (oldUra !== item.ura) {
      console.log(`  ura: ${oldUra} → ${item.ura} (${uraResult.dye.name})`);
    }
  }

  // 表裏のうち大きい方の色差で非表示判定
  const maxDelta = Math.max(omoteResult.delta, uraResult.delta);

  if (maxDelta > THRESHOLD) {
    if (!item.hidden) {
      item.hidden = true;
      hiddenCount++;
      console.log(`hidden: ${item.id} (${item.name}) deltaE=${maxDelta.toFixed(4)}`);
    }
  } else if (item.hidden) {
    delete item.hidden;
    console.log(`unhidden: ${item.id} (${item.name}) deltaE=${maxDelta.toFixed(4)}`);
  }
}

fs.writeFileSync('./static/data/kasane.json', JSON.stringify(kasane, null, 2) + '\n');

console.log(`\n${updatedCount}件のカララントを更新`);
console.log(`${hiddenCount}件を非表示`);
