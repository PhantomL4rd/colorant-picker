#!/usr/bin/env node

/**
 * dyes.json に source フィールド (DyeSource) を一括付与する移行スクリプト。
 *
 * FF14のカララント統合仕様に基づき、各染料を以下のいずれかに分類する:
 *   - normal:      ノーマルカラー（基本染料）
 *   - additional1: アディショナルカラー1
 *   - additional2: アディショナルカラー2
 *   - paid:        統合対象外（オンラインストア販売）
 *
 * 染料名（日本語）→ id の解決には src/lib/translations/ja/dye.json を使う。
 *
 * 使い方:
 *   node scripts/add-dye-source.js --dry-run    # 差分のみ表示
 *   node scripts/add-dye-source.js              # dyes.json を上書き
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dyesJsonPath = path.join(__dirname, '..', 'static', 'data', 'dyes.json');
const jaDyeJsonPath = path.join(__dirname, '..', 'src', 'lib', 'translations', 'ja', 'dye.json');

const isDryRun = process.argv.includes('--dry-run');

// -----------------------------------------------------------------------------
// 分類リスト（FF14公式の統合仕様に基づくユーザー提供リスト）
// -----------------------------------------------------------------------------

const NORMAL = [
  'スノウホワイト', 'アッシュグレイ', 'グゥーブーグレイ', 'スレートグレイ', 'チャコールグレイ',
  'スートブラック', 'ローズピンク', 'ライラックパープル', 'ロランベリーレッド', 'ダラガブレッド',
  'ラストレッド', 'ワインレッド', 'コーラルピンク', 'ブラッドレッド', 'サーモンピンク',
  'サンセットオレンジ', 'メサレッド', 'バークブラウン', 'チョコレートブラウン', 'ラセットブラウン',
  'コボルドブラウン', 'コルクブラウン', 'キキルンブラウン', 'オポオポブラウン', 'アルドゴートブラウン',
  'パンプキンオレンジ', 'エーコンブラウン', 'オーチャードブラウン', 'チェスナットブラウン', 'ゴブリンブラウン',
  'シェールブラウン', 'モールブラウン', 'ロームブラウン', 'ボーンホワイト', 'ウルダハンブラウン',
  'デザートイエロー', 'ハニーイエロー', 'ミリオンコーンイエロー', 'クァールイエロー', 'クリームイエロー',
  'ハラタリイエロー', 'レーズンブラウン', 'マッドグリーン', 'シルフグリーン', 'ライムグリーン',
  'モスグリーン', 'メドウグリーン', 'オリーヴグリーン', 'マーシュグリーン', 'アップルグリーン',
  'サボテンダーグリーン', 'ハンターグリーン', 'オチューグリーン', 'アダマンタスグリーン', 'ノフィカグリーン',
  'ディープウッドグリーン', 'セレストグリーン', 'ターコイズグリーン', 'モルボルグリーン', 'アイスブルー',
  'スカイブルー', 'シーフォグブルー', 'ピーコックブルー', 'ロータノブルー', 'コープスブルー',
  'セルレアムブルー', 'ウォードブルー', 'インクブルー', 'ラプトルブルー', 'オサードブルー',
  'ストームブルー', 'ヴォイドブルー', 'ロイヤルブルー', 'ミッドナイトブルー', 'シャドウブルー',
  'アビサルブルー', 'ラベンダーブルー', 'グルームパープル', 'カラントパープル', 'アイリスパープル',
  'グレープパープル', 'ロータスピンク', 'コリブリピンク', 'プラムパープル', 'リーガルパープル',
];

const ADDITIONAL1 = [
  'ルビーレッド', 'チェリーピンク', 'カナリーイエロー', 'バニライエロー', 'ドラグーンブルー',
  'ターコイズブルー', 'ガンメタル', 'パールホワイト', 'シャインブラス',
];

const ADDITIONAL2 = [
  'カーマインレッド', 'ネオンピンク', 'ブライトオレンジ', 'ネオンイエロー', 'ネオングリーン',
  'アズールブルー', 'バイオレットパープル', 'メタリックピンク', 'メタリックルビーレッド',
  'メタリックコバルトグリーン', 'メタリックダークブルー',
];

const PAID = [
  // 通常版
  'ピュアホワイト', 'ジェットブラック', 'パステルピンク', 'ダークレッド', 'ダークブラウン',
  'パステルグリーン', 'ダークグリーン', 'パステルブルー', 'ダークブルー', 'パステルパープル',
  'ダークパープル', 'シャインシルバー', 'シャインゴールド', 'メタリックレッド', 'メタリックオレンジ',
  'メタリックイエロー', 'メタリックグリーン', 'メタリックスカイブルー', 'メタリックブルー', 'メタリックパープル',
  // EX版
  'ピュアホワイトEX', 'ジェットブラックEX', 'パステルピンクEX', 'ダークレッドEX', 'ダークブラウンEX',
  'パステルグリーンEX', 'ダークグリーンEX', 'パステルブルーEX', 'ダークブルーEX', 'パステルパープルEX',
  'ダークパープルEX', 'シャインシルバーEX', 'シャインゴールドEX', 'メタリックレッドEX', 'メタリックオレンジEX',
  'メタリックイエローEX', 'メタリックグリーンEX', 'メタリックスカイブルーEX', 'メタリックブルーEX', 'メタリックパープルEX',
];

// -----------------------------------------------------------------------------
// 実処理
// -----------------------------------------------------------------------------

const jaDye = JSON.parse(fs.readFileSync(jaDyeJsonPath, 'utf-8'));
const dyesData = JSON.parse(fs.readFileSync(dyesJsonPath, 'utf-8'));

// ja名 → id の逆引き Map
const nameToId = new Map();
for (const [id, jaName] of Object.entries(jaDye.names ?? {})) {
  nameToId.set(jaName, id);
}

const idToSource = new Map();
const unresolved = { normal: [], additional1: [], additional2: [], paid: [] };

function assign(names, source) {
  for (const name of names) {
    const id = nameToId.get(name);
    if (!id) {
      unresolved[source].push(name);
      continue;
    }
    if (idToSource.has(id)) {
      console.warn(`重複検出: ${name} (id=${id}) は既に ${idToSource.get(id)} に分類済み`);
      continue;
    }
    idToSource.set(id, source);
  }
}

assign(NORMAL, 'normal');
assign(ADDITIONAL1, 'additional1');
assign(ADDITIONAL2, 'additional2');
assign(PAID, 'paid');

// dyes.json の各エントリに source を付与
let updated = 0;
const missingFromDyes = [];
const unassignedIds = [];

for (const dye of dyesData.dyes) {
  const source = idToSource.get(dye.id);
  if (source) {
    dye.source = source;
    updated++;
  } else {
    unassignedIds.push({ id: dye.id, name: dye.name });
  }
}

// idToSource にあるが dyes.json に無い id を検出
for (const [id] of idToSource) {
  if (!dyesData.dyes.some((d) => d.id === id)) {
    missingFromDyes.push(id);
  }
}

// -----------------------------------------------------------------------------
// レポート
// -----------------------------------------------------------------------------

console.log('=== 分類結果 ===');
console.log(`normal      : ${[...idToSource.values()].filter((v) => v === 'normal').length}件 (期待: ${NORMAL.length})`);
console.log(`additional1 : ${[...idToSource.values()].filter((v) => v === 'additional1').length}件 (期待: ${ADDITIONAL1.length})`);
console.log(`additional2 : ${[...idToSource.values()].filter((v) => v === 'additional2').length}件 (期待: ${ADDITIONAL2.length})`);
console.log(`paid        : ${[...idToSource.values()].filter((v) => v === 'paid').length}件 (期待: ${PAID.length})`);
console.log(`合計        : ${idToSource.size}件 / dyes.json: ${dyesData.dyes.length}件`);

// 未解決名は WARN（リスト名が dyes.json にまだ存在しない場合があるため。例: EX版）
for (const [source, list] of Object.entries(unresolved)) {
  if (list.length > 0) {
    console.warn(`\n[WARN] ${source} で未解決の名前 (${list.length}件、dyes.jsonに未登録):`);
    list.forEach((n) => console.warn(`  - ${n}`));
  }
}

// dyes.json の全染料に source が付かなければエラー
if (unassignedIds.length > 0) {
  console.error(`\n[ERROR] dyes.json 内で source が付かなかった染料 (${unassignedIds.length}件):`);
  unassignedIds.forEach(({ id, name }) => console.error(`  - ${id}: ${name}`));
  console.error('\n分類リストへの追加が必要です。中断します。');
  process.exit(1);
}

// -----------------------------------------------------------------------------
// 書き込み
// -----------------------------------------------------------------------------

if (isDryRun) {
  console.log('\n[DRY-RUN] 書き込みはスキップしました。');
  process.exit(0);
}

fs.writeFileSync(dyesJsonPath, `${JSON.stringify(dyesData, null, 2)}\n`, 'utf-8');
console.log(`\n${updated}件の染料に source を付与し、${dyesJsonPath} を更新しました。`);
