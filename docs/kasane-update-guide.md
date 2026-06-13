# かさね色目 更新ガイド

FF14で新しいカララントが追加されたときに、伝統色↔カララントの対応を更新する手順です。

## 前提条件

- Node.js がインストールされていること

## アーキテクチャ

```
traditional-colors.json     # 伝統色のhex値と「現在最も近いカララント」
        ↓ omoteColor/uraColor で参照
kasane.json                  # かさね色目（梅・桜など）の表/裏の伝統色の組み合わせ
```

`kasane.json` はカララントIDを直接持たず、伝統色名（例: `白`, `蘇芳`）で表現されるため、
カララント側が更新されても `kasane.json` を直接触る必要はありません。
`traditional-colors.json` の `dyeId` だけを洗い替えれば全画面に反映されます。

## 手順

### 1. dyes.json に新しいカララントを追加

`static/data/dyes.json` に新しいカララントのデータを追加します。

```json
{
  "id": "dye_XXX",
  "name": "新しいカララント名",
  "category": "red",
  "rgb": { "r": 255, "g": 128, "b": 64 },
  "tags": [],
  "lodestone": "/lodestone/...",
  "source": "normal"
}
```

※ メタリック染料の場合は `"tags": ["metallic"]` を追加してください（伝統色マッチング対象から除外されます）。

### 2. 洗い替えスクリプトを実行

```bash
node scripts/sync-traditional-color-dyes.mjs --dry-run   # 差分プレビュー
node scripts/sync-traditional-color-dyes.mjs             # 本番実行（書き換え）
```

このスクリプトが行うこと：

- `traditional-colors.json` の各伝統色について、`dyes.json` の中から OKLab deltaE で最も近いカララントを探す
- **彩度フィルタ**: 対象色の OKLCH chroma が 0.06 以上のとき、染料 chroma が `target * --chroma-ratio-min`（デフォルト 0.4）未満のグレー寄り染料を候補から除外。「明度だけ一致するグレー」が選ばれるのを防ぐ
- 第一候補の deltaE が `--delta-threshold`（デフォルト 0.08）を超えたら、
  「色相距離が `--hue-tolerance`（デフォルト ±15°）以内のカララントの中で deltaE 最小」を選び直す（色相フォールバック）
- 色相フォールバックの deltaE 増加分が `--fallback-max-excess`（デフォルト 0.05）を超えるなら、フォールバックを採用せず第一候補に戻す（色相範囲内にまともな候補がない場合の暴走防止）
- メタリック/ビビッド系のタグを持つカララントは除外
- `lockDye: true` が付いたエントリ（意図的に特定のカララントを採用しているもの）はスキップ
- `dyeId` を更新

#### 色相フォールバックのチューニング

```bash
# 色相フォールバックを発動しやすくする（より積極的に色相を合わせる）
node scripts/sync-traditional-color-dyes.mjs --hue-tolerance=10

# 色差優先で従来挙動に近づける
node scripts/sync-traditional-color-dyes.mjs --hue-tolerance=25 --delta-threshold=0.12
```

例: `赤 (#c82a20)` は OKLab deltaE 最小では `Sunset Orange`（オレンジ）になってしまうが、
色相フォールバックが発動して `Blood Red` に置き換わる。
彩度が極端に低い（OKLCH chroma < 0.04）色相が不安定なエントリは色相フォールバックを適用せず、
素直に最小 deltaE を採用する。

### 3. 結果を確認

出力例：

```
伝統色: 51 色 (うちロック: 1 色)
設定: --delta-threshold=0.08 --hue-tolerance=15
色相フォールバック発動: 3 件
変更: 2 件

■ 赤 (#c82a20) [色相フォールバック]
  dye_019 (Sunset Orange) → dye_015 (Blood Red)  deltaE=0.1074
■ 縹 (#3f729f)
  dye_067 (Seafog Blue) → dye_068 (Peacock Blue)  deltaE=0.0450

書き込み完了: ./static/data/traditional-colors.json
```

### 4. 動作確認

```bash
npm run dev
```

http://localhost:5173/kasane で表示を確認。

### 5. コミット

```bash
git add static/data/dyes.json static/data/traditional-colors.json
git commit -m "feat: 新カララント追加＆伝統色マッピング洗い替え"
```

## 補足情報

### 特定のカララントを意図的に採用したいとき

例えば「白瑩」は瑩（シマー）感を出すために Pearl White を意図的に採用しております。
そういうエントリは `lockDye: true` を付けてスクリプトの対象外にしておきます。

```json
{
  "id": "白瑩",
  "reading": "しろつや",
  "hex": "#f1f3f3",
  "dyeId": "dye_114",
  "lockDye": true,
  "note": "Pearl Whiteを意図的に採用（瑩=シマー感の表現）"
}
```

### 除外される染料タグ

- **metallic**: 質感が異なるため
- **vivid**: ビビッド系は伝統的な色合いとマッチしない

`scripts/sync-traditional-color-dyes.mjs` の `EXCLUDED_TAGS` で調整できます。

### 関連ファイル

- `scripts/sync-traditional-color-dyes.mjs` - 伝統色↔カララント洗い替えスクリプト
- `static/data/traditional-colors.json` - 伝統色のhex値とカララントマッピング
- `static/data/kasane.json` - かさね色目データ（表/裏は伝統色名で参照）
- `static/data/dyes.json` - カララントデータ

### 元データについて

参照元: <http://www.kariginu.jp/kikata/kasane-irome.htm>

伝統色のhex値は同サイトの色見本GIFおよび「合わせ色目の異説の例」セクションの bgcolor から抽出してございます。
