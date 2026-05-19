# 現在の進捗・未解決事項

## 完了済み（2026-05-14）

- MIDIノートオン/オフの Data1 ドロップダウン化（`apps/app.js`）
  - Note On / Note Off 選択時、Data1 を音階名付きドロップダウンに動的切り替え
  - 形式: `<ノートナンバー>: <音階名>`（YAMAHA方式: C3 = MIDI 60）
  - YAML import / export はノートナンバー数値のまま変更なし

- ファイルフォーマットバージョン値の追加（`apps/app.js`）
  - `FORMAT_VERSION = 1` 定数を追加
  - `newEmptyDefinition()` に `FormatVersion: FORMAT_VERSION` を追加
  - YAMLロード時に `FormatVersion` チェック（未定義 or 不一致でアラート＆ロード中止）
  - YAMLエクスポート時に `FormatVersion: 1` を先頭行に出力

## 完了済み（2026-05-06）

- MIDIチャンネル情報の仕様変更対応（`apps/app.js`）
  - `channel`（小文字、ステータスバイト埋め込み）を廃止
  - `Channel`（大文字、独立フィールド、-1 = 未指定）を導入
  - YAML インポート：`Channel` フィールドを読み込み、なければ -1
  - YAML エクスポート：`Channel !== -1` のときのみ出力
  - UI：MIDI行の表示順を `Channel → Status → Data1 → Data2` に変更

## 未解決事項

なし
