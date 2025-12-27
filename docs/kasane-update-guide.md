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
- 各伝統色に対して、FF14カララントの中から最も近い色を計算（OKLab色空間）
- 色差（deltaE）が 0.07 を超えるエントリに `hidden: true` を設定
- 色差が閾値以下になったエントリは `hidden` フラグを削除（＝再表示）

### 3. 結果を確認

出力例：
```
hidden: benibana (紅花) deltaE=0.0823
hidden: kurenai (紅) deltaE=0.0912
...
26件を非表示
```

新しいカララントの追加により、以前非表示だったエントリが復活する可能性があります：
```
unhidden: somethingred (紅なんとか) deltaE=0.0650
...
3件が復活！
```

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

現在の閾値は `0.07`（OKLab deltaE）です。

| 閾値 | 非表示件数 | 備考 |
|------|-----------|------|
| 0.05 | 61件 | 厳しすぎる |
| 0.06 | 55件 | 厳選だが寂しい |
| 0.07 | 26件 | バランス良い ★採用 |
| 0.08 | 6件 | 緩すぎる |

### メタリック染料の扱い

- 基本的にメタリック染料は除外（質感が異なるため）
- 例外：氷（kori）の表のみ Pearl White を使用

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
