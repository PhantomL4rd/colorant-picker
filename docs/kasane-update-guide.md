# 襲色目（かさね色目）更新ガイド

FF14で新しいカララントが追加されたときに、襲色目の非表示エントリを再計算する手順です。

## 前提条件

- Node.js がインストールされていること

※ImageMagickや元画像は不要です（元のRGB値はCSVに保存済み）

## 手順

### 1. dyes.json に新しいカララントを追加

`static/data/dyes.json` に新しいカララントのデータを追加します。

```json
{
  "id": "dye_XXX",
  "name": "新しいカララント名",
  "rgb": { "r": 255, "g": 128, "b": 64 },
  "tags": ["red"]
}
```

※メタリック染料の場合は `"tags": ["metallic"]` を追加

### 2. mark-hidden.mjs を実行

```bash
node scripts/mark-hidden.mjs
```

このスクリプトが行うこと：
- `docs/kasane-colors-mapping.csv` から伝統色の元RGB値を読み込む
- 各伝統色に対して、除外タグなしのカララントから最も近い色を探す（OKLab色空間）
- `kasane.json` の `omote` / `ura` カララントIDを更新
- 色差（deltaE）が 0.07 を超えるエントリに `hidden: true` を設定
- 色差が閾値以下になったエントリは `hidden` フラグを削除（＝再表示）

### 3. 結果を確認

出力例：
```
updated: kori (氷)
  omote: dye_114 → dye_002 (Snow White)
  ura: dye_093 → dye_047 (Vanilla Yellow)
...
50件のカララントを更新
0件を非表示
```

除外タグを持つ染料（metallic/expensive/vivid）から、除外タグなしの近似色に自動でフォールバックします。

### 4. 動作確認

```bash
npm run dev
```

http://localhost:5173/kasane で表示を確認。

### 5. コミット

```bash
git add static/data/dyes.json static/data/kasane.json
git commit -m "feat: 新カララント追加＆襲色目再計算"
```

## 補足情報

### 閾値について

現在は閾値なし（全件表示）。雰囲気重視で色差が大きくても表示する方針。

※ 氷(kori)のみ手動で Pearl White / Pure White を設定（光沢表現のため）

### 除外される染料

以下のタグを持つ染料は近似計算から除外されます：

- **metallic**: 質感が異なるため
- **vivid**: ビビッド系は伝統的な色合いとマッチしない

### 関連ファイル

- `scripts/mark-hidden.mjs` - 非表示フラグ設定スクリプト
- `docs/kasane-colors-mapping.csv` - 伝統色の元RGB値（これがマスターデータ）
- `static/data/kasane.json` - 襲色目データ
- `static/data/dyes.json` - カララントデータ

### 元データについて

参照元: http://www.kariginu.jp/kikata/kasane-irome.htm

元画像（50x50ピクセルGIF）から抽出したRGB値を `docs/kasane-colors-mapping.csv` に保存しています。
- 右上 (45,5) = 表（omote）
- 左下 (5,45) = 裏（ura）
