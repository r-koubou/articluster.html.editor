# 現在の進捗・未解決事項

## 完了済み（2026-05-06）

- MIDIチャンネル情報の仕様変更対応（`apps/app.js`）
  - `channel`（小文字、ステータスバイト埋め込み）を廃止
  - `Channel`（大文字、独立フィールド、-1 = 未指定）を導入
  - YAML インポート：`Channel` フィールドを読み込み、なければ -1
  - YAML エクスポート：`Channel !== -1` のときのみ出力
  - UI：MIDI行の表示順を `Channel → Status → Data1 → Data2` に変更

## 完了済み（2026-05-05）

- `apps/index.html` / `apps/style.css` / `apps/app.js` を新規実装し、エディタの全機能が動作することを確認した。
- YAML インポート時に Articulation が読み込まれないバグを修正した（同インデントシーケンス対応・BOM 除去）。
- `apps/style.css` をマテリアルデザイン（Indigo カラー）で刷新し、ヘッダ・ボタン・タイトル領域・モーダルの視認性を向上させた。
- フッターを追加した（GitHubリンク・Copyright表記・右寄せ・Indigoカラー）。

## 未解決事項

なし
