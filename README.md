# Colorant Picker

A web app for exploring dye color combinations in Final Fantasy XIV.

## Features

- **Picker**: Browse all available dyes and find harmonious color combinations based on color theory
- **Showcase**: Discover popular palettes shared by the community
- **Favorites**: Save your favorite combinations locally
- **History**: View your recently explored combinations
- **Custom Colors**: Create and use your own custom colors
- **Filters**: Filter by dye categories, exclude metallic dyes
- **Share**: Share your palettes via URL

## Tech Stack

- **Frontend**: SvelteKit (Svelte 5), TypeScript, Tailwind CSS, DaisyUI
- **Backend**: Cloudflare Pages Functions, D1 (SQLite), KV
- **Deployment**: Cloudflare Pages

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Start with Pages Functions (D1/KV)
bun run build && bun run dev:pages

# Type check
bun run check

# Format
bun run format:fix
```

## Contributing

### Translations

English and Japanese dye names are generated from XIVAPI. For other languages or UI translations, please submit a PR; do not edit generated dye names directly.

### Other Contributions

Feel free to open an issue for:

- Bug reports
- Feature requests
- Any suggestions or feedback

Or reach me on [X](https://x.com/pl4rd) or [Lodestone](https://jp.finalfantasyxiv.com/lodestone/character/27344914/blog/5609012/)

## License

MIT

## Dependency security

SvelteKit 3 requires Node.js 22.17+, TypeScript 6, Vite 8 and adapter-static 4. Keep the static SPA fallback when updating the build configuration. Verify dependency updates with `bun run check`, `bun run check:cloudflare` and `bun run build`.

Dependency audits also cover transitive packages. Apply available compatible security patches; record unpatched packages and changes requiring a separate major migration rather than hiding audit results.

The audit still reports deepmerge, for which no fixed release is published. The SvelteKit alerts are addressed by the version update.

## 染色マスターの更新

染料の英語名・日本語名・RGBは [XIVAPI v2](https://v2.xivapi.com/api/sheet/Stain) の Stain シートから取得します。DBは使わず、生成したJSONをGitで管理し、アプリは同梱したデータを読み込みます。

- GitHub Actions の `Update dye master` が毎週水曜19:00（Asia/Tokyo、UTC 10:00）に起動します。Actionsの混雑により開始が遅れる場合があります。
- 手動更新: Actions → Update dye master → Run workflow（デフォルトブランチ）、または `bun run sync:dyes`。
- ローカル検証: `bun run test:dyes`。依存パッケージ不要、Node.js 22以降で実行できます。
- 取得と検証がすべて成功した場合だけ、染料JSONと `src/lib/translations/{en,ja}/dye.json` を更新します。API障害、空データ、既存行の欠落、日英の不一致は失敗とし、旧データを維持します。
- Actionsは変更がある場合だけデフォルトブランチへコミットします。リポジトリのActions書き込み権限と、botのpushを許すブランチ設定が必要です。公開環境への反映は既存のCloudflare Git連携によるビルド・デプロイに依存します。GITHUB_TOKENのpushは別のGitHub Actionsを起動しません。
- `scripts/dye-metadata.json` は既存IDとStain行IDの固定対応、およびアプリ独自のカテゴリ・タグ・Lodestoneリンク・入手元を保持します。既存IDは保存済み配色との互換性のため変更しません。
- 新しい染料は `dye_xivapi_<Stain行ID>` として追加します。カテゴリはShadeから、metallicタグは英語名から生成します。入手元・Lodestoneリンク・vividタグはAPIから推測せず、必要に応じて対応表に追記してください。既存のカテゴリ・タグは維持します。
- 季節別おすすめ・伝統色との対応など、編集方針を含む派生データの再生成は別作業です。
- 3リポジトリの取得スクリプトとテストは同じ仕様を保ち、変更時は合わせて更新してください。
