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
 * - GIF画像から色抽出（右上=表、左下=裏）
 * - ImageMagickで抽出: magick image.gif -format '%[pixel:p{45,5}]' info:
 *
 * ## 使い方
 * 1. ImageMagickをインストール: brew install imagemagick
 * 2. 元画像を配置: /Users/hikaru/Downloads/かさね色目_files/
 * 3. 実行: node scripts/mark-hidden.mjs
 *
 * ## 今後の更新
 * FF14でカララントが追加されたら、このスクリプトを再実行することで
 * 非表示エントリを減らせる可能性がある。
 */

import { differenceEuclidean } from 'culori/fn';
import { parse } from 'culori';
import fs from 'fs';
import { execSync } from 'child_process';

const IMAGES_DIR = '/Users/hikaru/Downloads/かさね色目_files';
const THRESHOLD = 0.07; // OKLab deltaE閾値（これを超えると非表示）

const deltaE = differenceEuclidean('oklab');
const dyes = JSON.parse(fs.readFileSync('./static/data/dyes.json', 'utf-8')).dyes;
const kasane = JSON.parse(fs.readFileSync('./static/data/kasane.json', 'utf-8'));
const nonMetallicDyes = dyes.filter(d => !d.tags || !d.tags.includes('metallic'));

function extractColors(filepath) {
  const result = execSync('magick "' + filepath + '" -format "%[pixel:p{45,5}]\\n%[pixel:p{5,45}]" info:', { encoding: 'utf-8' });
  const [omote, ura] = result.trim().split('\n');
  return { omote, ura };
}

function parseRgba(str) {
  const m = str.match(/srgba?\((\d+),(\d+),(\d+)/);
  if (!m) return null;
  return parse('rgb(' + m[1] + ',' + m[2] + ',' + m[3] + ')');
}

function findClosest(targetColor) {
  let min = Infinity;
  for (const d of nonMetallicDyes) {
    const c = parse('rgb(' + d.rgb.r + ',' + d.rgb.g + ',' + d.rgb.b + ')');
    const delta = deltaE(targetColor, c);
    if (delta < min) min = delta;
  }
  return min;
}

// 各エントリのdeltaEを計算
const deltaMap = {};
const files = fs.readdirSync(IMAGES_DIR).filter(f => f.startsWith('iro-') && f.endsWith('.gif'));

for (const f of files) {
  const id = f.replace('iro-', '').replace('.gif', '');
  const colors = extractColors(IMAGES_DIR + '/' + f);
  const omoteColor = parseRgba(colors.omote);
  const uraColor = parseRgba(colors.ura);
  const omoteDelta = findClosest(omoteColor);
  const uraDelta = findClosest(uraColor);
  deltaMap[id] = Math.max(omoteDelta, uraDelta);
}

// kasane.jsonを更新
let hiddenCount = 0;
for (const item of kasane.kasane) {
  const maxDelta = deltaMap[item.id];
  if (maxDelta && maxDelta > THRESHOLD) {
    item.hidden = true;
    hiddenCount++;
    console.log('hidden: ' + item.id + ' (' + item.name + ') deltaE=' + maxDelta.toFixed(4));
  } else if (item.hidden) {
    delete item.hidden;
  }
}

fs.writeFileSync('./static/data/kasane.json', JSON.stringify(kasane, null, 2) + '\n');
console.log('\n' + hiddenCount + '件を非表示にしました');
