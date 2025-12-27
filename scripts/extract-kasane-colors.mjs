/**
 * かさね色目（襲色目）色抽出・マッチングスクリプト
 *
 * ## 概要
 * 元画像（GIF）から伝統色のRGB値を抽出し、
 * FF14カララントの中から最も近い色を計算してCSV出力する。
 *
 * ## 色差計算
 * - culoriライブラリのOKLab色空間で色差（deltaE）を計算
 * - メタリック染料は除外（質感が異なるため）
 * - 例外: 氷(kori)のみPearl Whiteを許可
 *
 * ## 出力
 * - 標準出力: CSV形式（色名,表RGB,表カララント,表ID,表deltaE,裏RGB,...）
 * - 標準エラー: kasane.json更新用のJSONマッピング
 *
 * ## 使い方
 * node scripts/extract-kasane-colors.mjs > docs/kasane-colors-recalculated.csv
 *
 * ## 関連スクリプト
 * - mark-hidden.mjs: 色差が大きいエントリに非表示フラグを設定
 * - analyze-delta.mjs: 色差の分布を分析
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { parse } from 'culori';
import { differenceEuclidean } from 'culori/fn';

const IMAGES_DIR = '/Users/hikaru/Downloads/かさね色目_files';
const DYES_PATH = './static/data/dyes.json';

// culoriのOKLab色差関数
const deltaEOklab = differenceEuclidean('oklab');

// FF14カララントデータを読み込み
const dyesData = JSON.parse(fs.readFileSync(DYES_PATH, 'utf-8'));
const allDyes = dyesData.dyes;

// メタリック染料を除外（Pearl Whiteは氷用に別途許可）
const nonMetallicDyes = allDyes.filter(d => !d.tags || !d.tags.includes('metallic'));
const dyesWithPearlWhite = allDyes.filter(d => {
  if (!d.tags || !d.tags.includes('metallic')) return true;
  return d.name === 'Pearl White';
});

console.error(`染料総数: ${allDyes.length}, 非メタリック: ${nonMetallicDyes.length}, Pearl White込み: ${dyesWithPearlWhite.length}`);

// 最も近いカララントを見つける（メタリック除外、氷のみPearl White許可）
function findClosestDye(rgb, allowPearlWhite = false) {
  const candidates = allowPearlWhite ? dyesWithPearlWhite : nonMetallicDyes;
  const targetColor = parse(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);

  let closest = null;
  let minDelta = Infinity;

  for (const dye of candidates) {
    const dyeColor = parse(`rgb(${dye.rgb.r}, ${dye.rgb.g}, ${dye.rgb.b})`);
    const delta = deltaEOklab(targetColor, dyeColor);
    if (delta < minDelta) {
      minDelta = delta;
      closest = dye;
    }
  }

  return { dye: closest, delta: minDelta };
}

// 画像から色を抽出
async function extractColors(imagePath) {
  // GIFをPNGに変換してから処理（パレット問題を回避）
  const { data, info } = await sharp(imagePath)
    .png()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // 左下のピクセル位置（5, height-6）
  const blX = 5;
  const blY = height - 6;
  const blIdx = (blY * width + blX) * channels;
  const bottomLeft = {
    r: data[blIdx],
    g: data[blIdx + 1],
    b: data[blIdx + 2]
  };

  // 右上のピクセル位置（width-6, 5）
  const trX = width - 6;
  const trY = 5;
  const trIdx = (trY * width + trX) * channels;
  const topRight = {
    r: data[trIdx],
    g: data[trIdx + 1],
    b: data[trIdx + 2]
  };

  return { bottomLeft, topRight };
}

// メイン処理
async function main() {
  const files = fs.readdirSync(IMAGES_DIR)
    .filter(f => f.startsWith('iro-') && f.endsWith('.gif'))
    .sort();

  console.log('色名,表RGB,表カララント,表カララントID,表deltaE,裏RGB,裏カララント,裏カララントID,裏deltaE');

  const results = [];

  for (const file of files) {
    const imagePath = path.join(IMAGES_DIR, file);
    const colorName = file.replace('iro-', '').replace('.gif', '');

    try {
      const { bottomLeft, topRight } = await extractColors(imagePath);

      // 氷(kori)の場合のみPearl Whiteを許可
      const allowPearlWhite = colorName === 'kori';

      // 右上が表（omote）、左下が裏（ura）
      const omoteMatch = findClosestDye(topRight, allowPearlWhite);
      const uraMatch = findClosestDye(bottomLeft, allowPearlWhite);

      results.push({
        id: colorName,
        omoteRgb: `rgb(${topRight.r},${topRight.g},${topRight.b})`,
        omoteDye: omoteMatch.dye.name,
        omoteDyeId: omoteMatch.dye.id,
        omoteDelta: omoteMatch.delta.toFixed(4),
        uraRgb: `rgb(${bottomLeft.r},${bottomLeft.g},${bottomLeft.b})`,
        uraDye: uraMatch.dye.name,
        uraDyeId: uraMatch.dye.id,
        uraDelta: uraMatch.delta.toFixed(4),
      });

      console.log([
        colorName,
        `rgb(${topRight.r},${topRight.g},${topRight.b})`,
        omoteMatch.dye.name,
        omoteMatch.dye.id,
        omoteMatch.delta.toFixed(4),
        `rgb(${bottomLeft.r},${bottomLeft.g},${bottomLeft.b})`,
        uraMatch.dye.name,
        uraMatch.dye.id,
        uraMatch.delta.toFixed(4)
      ].join(','));
    } catch (err) {
      console.error(`Error processing ${file}: ${err.message}`);
    }
  }

  // kasane.json更新用のJSONを出力
  console.error('\n--- kasane.json更新用マッピング ---');
  for (const r of results) {
    console.error(`  "${r.id}": { "omote": "${r.omoteDyeId}", "ura": "${r.uraDyeId}" },`);
  }
}

main().catch(console.error);
