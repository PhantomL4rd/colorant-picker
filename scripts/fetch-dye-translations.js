#!/usr/bin/env node

/**
 * Lodestoneから染料名の翻訳データを取得するスクリプト
 *
 * 使い方:
 *   node scripts/fetch-dye-translations.js [--locale en|ja|ko] [--delay 1000]
 *
 * オプション:
 *   --locale  取得する言語（デフォルト: en）
 *   --delay   リクエスト間の待機時間（ミリ秒、デフォルト: 1000）
 *   --output  出力先（デフォルト: static/data/i18n/{locale}.json）
 *   --dry-run 実際には保存せず結果を表示
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lodestoneドメインマッピング
const LODESTONE_DOMAINS = {
  en: 'na.finalfantasyxiv.com',
  ja: 'jp.finalfantasyxiv.com',
  ko: 'kr.finalfantasyxiv.com',
};

// カテゴリマッピング（日本語 → 英語キー）
const CATEGORY_MAP = {
  白系: 'white',
  赤系: 'red',
  茶系: 'brown',
  黄系: 'yellow',
  緑系: 'green',
  青系: 'blue',
  紫系: 'purple',
  レア系: 'rare',
};

// カテゴリ翻訳（各言語用）
const CATEGORY_TRANSLATIONS = {
  en: {
    white: 'White',
    red: 'Red',
    brown: 'Brown',
    yellow: 'Yellow',
    green: 'Green',
    blue: 'Blue',
    purple: 'Purple',
    rare: 'Rare',
  },
  ja: {
    white: '白系',
    red: '赤系',
    brown: '茶系',
    yellow: '黄系',
    green: '緑系',
    blue: '青系',
    purple: '紫系',
    rare: 'レア系',
  },
  ko: {
    white: '흰색 계열',
    red: '빨간색 계열',
    brown: '갈색 계열',
    yellow: '노란색 계열',
    green: '초록색 계열',
    blue: '파란색 계열',
    purple: '보라색 계열',
    rare: '희귀 계열',
  },
};

// 引数パース
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    locale: 'en',
    delay: 1000,
    output: null,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--locale':
        options.locale = args[++i];
        break;
      case '--delay':
        options.delay = parseInt(args[++i], 10);
        break;
      case '--output':
        options.output = args[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
    }
  }

  if (!options.output) {
    options.output = path.join(__dirname, '..', 'static', 'data', 'i18n', `${options.locale}.json`);
  }

  return options;
}

// LodestoneのURLからパス部分を抽出
function extractLodestonePath(url) {
  const match = url.match(/\/lodestone\/playguide\/db\/item\/[^/]+\/?/);
  return match ? match[0] : null;
}

// Lodestoneページから染料名を抽出
async function fetchDyeName(lodestonePath, locale) {
  const domain = LODESTONE_DOMAINS[locale];
  if (!domain) {
    throw new Error(`Unknown locale: ${locale}`);
  }

  const url = `https://${domain}${lodestonePath}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language':
          locale === 'ko'
            ? 'ko-KR,ko;q=0.9'
            : locale === 'ja'
              ? 'ja-JP,ja;q=0.9'
              : 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // タイトルから染料名を抽出
    // パターン1: <title>エオルゼアデータベース「カララント:スノウホワイト」...</title>
    // パターン2: <title>Snow White Dye | Eorzea Database...</title>
    // パターン3: 韓国語版のパターン

    let dyeName = null;

    // 日本語: 「カララント:NAME」形式
    const jaMatch = html.match(/「カララント[:：]([^」]+)」/);
    if (jaMatch) {
      dyeName = jaMatch[1];
    }

    // 英語: "Eorzea Database: NAME Dye" 形式（タイトルから抽出）
    if (!dyeName) {
      const enTitleMatch = html.match(
        /<title>(?:Eorzea Database:\s*)?([^|<]+(?:Dye|Colorant))[^<]*<\/title>/i
      );
      if (enTitleMatch) {
        // "Eorzea Database: " プレフィックスと " Dye" サフィックスを削除
        dyeName = enTitleMatch[1]
          .replace(/^Eorzea Database:\s*/i, '')
          .replace(/\s+Dye$/i, '')
          .trim();
      }
    }

    // 韓国語: 「염료: NAME」または類似形式
    if (!dyeName) {
      const koMatch = html.match(/(?:염료|카라런트)[:：\s]*([^<」]+)/);
      if (koMatch) {
        dyeName = koMatch[1].trim();
      }
    }

    // フォールバック: h2タグなどから抽出
    if (!dyeName) {
      const h2Match = html.match(
        /<h2[^>]*class="[^"]*db-view__item__text__name[^"]*"[^>]*>([^<]+)<\/h2>/
      );
      if (h2Match) {
        dyeName = h2Match[1].trim();
      }
    }

    return dyeName;
  } catch (error) {
    console.error(`  ❌ Error fetching ${url}: ${error.message}`);
    return null;
  }
}

// 待機関数
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// メイン処理
async function main() {
  const options = parseArgs();

  console.log(`🌐 Fetching dye translations for locale: ${options.locale}`);
  console.log(`⏱️  Delay between requests: ${options.delay}ms`);
  console.log(`📁 Output: ${options.output}`);
  if (options.dryRun) {
    console.log('🔍 Dry run mode - will not save file');
  }
  console.log('');

  // dyes.jsonを読み込み
  const dyesJsonPath = path.join(__dirname, '..', 'static', 'data', 'dyes.json');
  const dyesData = JSON.parse(fs.readFileSync(dyesJsonPath, 'utf-8'));

  console.log(`📖 Loaded ${dyesData.dyes.length} dyes from dyes.json`);
  console.log('');

  // 翻訳データを収集
  const translations = {
    dyes: {},
    categories: CATEGORY_TRANSLATIONS[options.locale] || CATEGORY_TRANSLATIONS.en,
  };

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < dyesData.dyes.length; i++) {
    const dye = dyesData.dyes[i];
    const progress = `[${i + 1}/${dyesData.dyes.length}]`;

    if (!dye.lodestone) {
      console.log(`${progress} ⚠️  ${dye.id}: No lodestone URL`);
      failCount++;
      continue;
    }

    const lodestonePath = extractLodestonePath(dye.lodestone);
    if (!lodestonePath) {
      console.log(`${progress} ⚠️  ${dye.id}: Invalid lodestone URL: ${dye.lodestone}`);
      failCount++;
      continue;
    }

    console.log(`${progress} 🔄 Fetching ${dye.id} (${dye.name})...`);

    const translatedName = await fetchDyeName(lodestonePath, options.locale);

    if (translatedName) {
      translations.dyes[dye.id] = translatedName;
      console.log(`${progress} ✅ ${dye.id}: "${translatedName}"`);
      successCount++;
    } else {
      console.log(`${progress} ❌ ${dye.id}: Failed to extract name`);
      failCount++;
    }

    // レート制限対策
    if (i < dyesData.dyes.length - 1) {
      await sleep(options.delay);
    }
  }

  console.log('');
  console.log('📊 Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log('');

  if (!options.dryRun) {
    // 出力ディレクトリを作成
    const outputDir = path.dirname(options.output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // JSONファイルを保存
    fs.writeFileSync(options.output, JSON.stringify(translations, null, 2));
    console.log(`💾 Saved to ${options.output}`);
  } else {
    console.log('📝 Translation data:');
    console.log(JSON.stringify(translations, null, 2));
  }
}

main().catch(console.error);
