/**
 * シードデータ投入スクリプト
 * 使用方法: npx wrangler d1 execute colorant-picker-showcase --remote --file=scripts/seed-showcase.sql
 *
 * このスクリプトはSQLファイルを生成するためのものです
 */

import * as fs from 'fs';
import * as path from 'path';

// 染料データを読み込み
const dyesPath = path.join(__dirname, '../static/data/dyes.json');
const dyesData = JSON.parse(fs.readFileSync(dyesPath, 'utf-8'));
const dyes: { id: string }[] = dyesData.dyes;

// パターン一覧
const patterns = ['triadic', 'splitComplementary', 'analogous', 'monochromatic'];

// ランダムに選択
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ランダムなUUID生成
function randomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// シードデータ生成（20件）
const seedCount = 20;
const insertStatements: string[] = [];

for (let i = 0; i < seedCount; i++) {
  const primaryDye = randomChoice(dyes);
  let suggestedDye1 = randomChoice(dyes);
  let suggestedDye2 = randomChoice(dyes);

  // 同じ染料にならないようにする
  while (suggestedDye1.id === primaryDye.id) {
    suggestedDye1 = randomChoice(dyes);
  }
  while (suggestedDye2.id === primaryDye.id || suggestedDye2.id === suggestedDye1.id) {
    suggestedDye2 = randomChoice(dyes);
  }

  const pattern = randomChoice(patterns);
  const clientId = randomUUID();

  insertStatements.push(
    `INSERT INTO palettes (primary_dye_id, suggested_dye_id_1, suggested_dye_id_2, pattern, client_id) VALUES ('${primaryDye.id}', '${suggestedDye1.id}', '${suggestedDye2.id}', '${pattern}', '${clientId}');`
  );
}

// SQLファイル出力
const sql = insertStatements.join('\n');
const outputPath = path.join(__dirname, 'seed-showcase.sql');
fs.writeFileSync(outputPath, sql);

console.log(`Generated ${seedCount} seed records to ${outputPath}`);
console.log('Run: npx wrangler d1 execute colorant-picker-showcase --remote --file=scripts/seed-showcase.sql');
