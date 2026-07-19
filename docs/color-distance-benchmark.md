# 色差アルゴリズム比較メモ（かさね色目ベンチマーク）

伝統色 51 色 → 最近傍カララントを返すパイプラインは、本アプリにおいて
「色差アルゴリズムの良し悪し」が最も観察しやすい検証セットでございます。
helmlab など外部ライブラリの更新が入った際は、まずここで dry-run を回して
判定が改善されるか・悪化するかを確認するのが定石です。

## 現状の実装（基準ライン）

- スクリプト: `scripts/sync-traditional-color-dyes.mjs`
- 距離関数:
  - **primary**: OKLab deltaE（`differenceEuclidean('oklab')`）。プールフィルタは EXCLUDED_TAGS のみ
  - **fallback**: helmlab `distanceFromLab`
    - primary deltaE が `--delta-threshold`（デフォルト 0.08）を超えたら発動
- ランタイム同等実装: `src/lib/utils/color/colorHarmony.ts#findNearestDyesInOklab`
  - 同じ思想・同じ閾値（0.08）
- 手作りガード（hue±tolerance / chroma 最小比率 / fallback-max-excess）は全廃。
  fallback アルゴリズム自身の知覚距離だけで判断する設計

### helmlab の位置づけ

helmlab は研究実装であり、本プロジェクトでは fallback の補助役として実験的に利用している。
将来のバージョンで挙動が変わる前提で扱い、primary を helmlab に置き換える設計には進まない。
helmlab 自身の更新が入った際は、必ず本ドキュメント末尾の「再ベンチ手順」を回して
現行の救済 5 件（赤・紅・淡紫・淡黄・薄色）が崩れていないかを確認する。

現状の dry-run スナップショット:

```
伝統色: 51 色 (うちロック: 1 色)
helmlab フォールバック発動: 5 件
変更: 0 件
```

fallback 発動の 5 件は以下:

| 伝統色 | hex       | 第一候補 (OKLab) | 採用 (helmlab)  |
| ------ | --------- | ---------------- | --------------- |
| 赤     | `#ec001a` | Sunset Orange    | Coral Pink      |
| 紅     | `#dc1a43` | Sunset Orange    | Coral Pink      |
| 淡紫   | `#874da1` | Plum Purple      | Lavender Purple |
| 淡黄   | `#e6ec2e` | Cream Yellow     | Lime Green      |
| 薄色   | `#a869be` | Lavender Purple  | Colibri Pink    |

## 注視すべき色（helmlab の盲点候補）

helmlab の知覚距離が「これは違うだろう」という選択をするケース。
helmlab issue: <https://github.com/Grkmyldz148/helmlab/issues/3>

| 伝統色 | hex       | helmlab primary が選ぶ | 期待される dye    | 備考                            |
| ------ | --------- | ---------------------- | ----------------- | ------------------------------- |
| 鳥ノ子 | `#fbf0d0` | Snow White ❌          | Vanilla Yellow ✅ | 低彩度・明色で無彩色に飛ぶ      |
| 濃香   | `#9e5c46` | Blood Red ❌           | Qiqirn Brown ✅   | 茶色を赤系と誤認                |
| 淡黄   | `#e6ec2e` | Lime Green             | Cream Yellow      | fallback で緑寄りに引っ張られる |
| 薄色   | `#a869be` | Colibri Pink           | Lavender Purple   | fallback でピンク寄りに         |

helmlab 修正後、これらが正しい dye を返すかを最優先で確認すること。

## これまでに試した方式（2026-06 時点）

`scripts/sync-traditional-color-dyes.mjs` に一時的に `--method` フラグを追加して
4方式を比較した結果。実験コードは削除済み、結果のみ記録。

| method                    | 変更件数 | 鳥ノ子            | 濃香            | 備考                                                                                                     |
| ------------------------- | -------- | ----------------- | --------------- | -------------------------------------------------------------------------------------------------------- |
| **oklab**                 | 0        | Vanilla Yellow ✅ | Qiqirn Brown ✅ | 現状の primary。fallback 5件で救済                                                                       |
| **oklch** (vanilla)       | 0        | Vanilla Yellow ✅ | Qiqirn Brown ✅ | culori の polar→Cartesian 展開で oklab と数学的恒等                                                      |
| **oklchplus**             | 9        | Snow White ❌     | Sunset Orange   | primary は OKLab 寄り判定だが deltaE が閾値 0.08 を超え fallback に落ちると helmlab の盲点に巻き込まれる |
| **helmlab** (primary単独) | 10       | Snow White ❌     | Blood Red ❌    | 既知の盲点が露呈                                                                                         |

### chroma ガード撤廃（2026-06）

旧実装には「対象 chroma ≥ 0.06 のとき染料 chroma が `target * 0.4` 未満の候補を除外」
というガードが入っていたが、伝統色 51 色での dry-run 比較で挙動を確認したところ：

- ガードあり: 0 件変更 / 5 件 fallback
- ガードなし (`--chroma-ratio-min=0`): 1 件変更 / 5 件 fallback
  - 薄蘇芳 `#a25768`: Plum Purple → **Lilac Purple** (deltaE=0.0679)

薄蘇芳のケースでは Lilac Purple の chroma (0.033) が target chroma (0.100) の 33% しかなく、
本来のガードの想定通り「彩度が大きく落ちた染料」が浮上していた。

しかし fallback 件数は変わらず、「primary deltaE が大きすぎる」ケースの救済は
helmlab fallback が責務を負っている。ガードを残すと「primary deltaE は閾値以下なのに
彩度の都合で候補が選び直される」という挙動が起き、判断軸が二系統になって読みづらい。

そこで「primary は素直に OKLab deltaE 最小 → 不満があれば fallback」だけに統一し、
chroma ガードと関連フラグ (`--chroma-ratio-min`) は撤廃した。
薄蘇芳の Plum Purple → Lilac Purple は採用判断として受け入れ。

### differenceWithConfidence（helmlab 0.14.0）の検証 (2026-06)

helmlab 0.14.0 で `differenceWithConfidence(hex1, hex2): Confidence` が追加された。
返り値は知覚距離 `de` に加え `deHuman`, `disagreement`, `reliability`, `reliable`, `extrapolated`
を持ち、「観測者間の同意度」を提供する。

**期待していた使い方**: helmlab fallback 発動時に、helmlab `de` 順 top-K を取り、
`reliability` が高い候補を採用すれば「より人間が同意しやすい dye」が選べるのではないか。

**実証結果（K=3,5,8,10,20 をスイープ）**: **全件改悪**。

| 伝統色         | helmlab最近傍 | K=5 採用       | K=20 採用             |
| -------------- | ------------- | -------------- | --------------------- |
| 赤 `#ec001a`   | Coral Pink    | Pumpkin Orange | Millioncorn Yellow ❌ |
| 紫 `#884898`   | Plum Purple   | Gloom Purple   | Sky Blue ❌           |
| 薄色 `#a869be` | Colibri Pink  | Pastel Blue ❌ | Othard Blue ❌        |

K を大きくするほど「色相が全く違う遠い色」が選ばれる。

**原因**: `reliability = deHuman / (deHuman + disagreement)` の式から、
`deHuman` が大きい（＝距離が大きい）ほど reliability は上がる。
つまり **「reliability 高 ＝ 明らかに違うと皆が認める ＝ 遠い」** であって、
「そっくり」ではない。

逆に「reliability 最小」を採用すると、これは数学的に helmlab 最近傍と完全一致するため
（de 最小 → deHuman 最小 → reliability 最小）、再ランクとして機能しない。

**結論**: `differenceWithConfidence` は「この距離測定がどれだけ信頼できるか」のメタ情報であり、
fallback の **候補選択** の判断軸としては使えない。
dye マッチングの主軸はあくまで OKLab/OKLCH deltaE（primary）であり、
helmlab は色相意図が崩れた fallback 時の救済役にとどめる。
confidence は「判定の不確かさを UI に表示する」用途（例: 近似マッチバッジ）には
使えるかもしれないが、選択ロジックには組み込まない。

### Oklch+ について

- 出典: <https://zenn.dev/nekotrack/articles/290dea9ac90fa9>
- Naka-Rushton 関数で OKLCH の chroma 軸を非線形補正する3パラメータ手法
  - L' = L^0.73, C' = C^0.87 / (C^0.87 + 0.34^0.87), h' = h
- COMBVD ベンチ（STRESS）: Oklch+ = 29.10 / OKLab = 47.35 / CIEDE2000 = 29.18 / helmlab = 22.48
- **本アプリのかさね色目では決定打にならず**: helmlab fallback と組み合わせると鳥ノ子で同じ盲点に落ちる

## 再ベンチ手順（helmlab 更新時）

1. `npm i helmlab@latest` で最新版に上げる
2. dry-run で差分を見る:
   ```bash
   node scripts/sync-traditional-color-dyes.mjs --dry-run
   ```
3. 「注視すべき色」の表を見て、helmlab fallback が呼ばれた色の選択が改善されているか確認
4. 改善されていたら `--dry-run` を外して本番反映 → コミット
5. 鳥ノ子・濃香・淡黄・薄色について手元の目視でも比較しておく
   - `src/routes/kasane/+page.svelte` を起動して該当エントリを確認

## 別アルゴリズムを試したくなったら

過去の実験コードは git 履歴に残らないため、`--method` フラグの実装パターンを
再現する場合は以下のフローでお願いします:

1. `scripts/sync-traditional-color-dyes.mjs` に `--method=<name>` を一時追加
2. 各 method の `findClosestBy<Name>` を実装し、`resolveDye` で分岐
3. 3方式以上の dry-run 結果を比較表にまとめる
4. **結論が出たら必ず実験コードを削除**（プロダクションには残さない）
5. 結果は本ドキュメントの「これまでに試した方式」に追記

ベンチマーク対象は固定（伝統色 51 色、`lockDye` 1 件除く）なので、
同じ条件で比較できる前提が崩れないよう、`traditional-colors.json` の
エントリ数を変えるときはこのドキュメントの dry-run スナップショットも更新すること。
