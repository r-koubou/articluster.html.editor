UI仕様
=====

UI全般に関する仕様を記載する。UI実装作業前に必ず目を通すこと。


## 概要

docs/specs 以下のエディタ仕様 (*-editor.md) で記載されているUIの共通仕様を記載する。

## 実装アプローチ

エディタは Web ブラウザでHTML/CSS/JavaScript を使用して実装する。

### UIフレームワーク・Tailwind CSS の不使用

React や Vue などのフレームワーク、Tailwind CSS は使用せず、純粋な JavaScript で実装する。理由は以下の通り。

- バックエンドサーバーを用いないローカル完結（HTMLファイル開くだけで動作）で問題ないため。

## 全体レイアウト・コンテナ要素

appendix/app-layout.jpg を参照。

ピクセルサイズまでの完全再現は求めない。あくまでモック程度であることに留意すること。

## 各コンテナごとのレイアウト

以下を参照。

- appendix/0-header.jpg
- appendix/1-general-edit.jpg
- appendix/2-articulation-list.jpg
- appendix/3-articulation-edit.jpg
- appendix/extra-edit.jpg

ピクセルサイズまでの完全再現は求めない。あくまでモック程度であることに留意すること。

## Midi Message の編集UI

### ステータスについて

ドロップダウンリストから選択する形式とする。選択肢は以下の通り。

- Note On
- Note Off
- Control Change
- Program Change
- Pitch Bend
- Aftertouch
- Polyphonic Aftertouch

### チャンネルの有効な値の範囲

0 から 15 までの整数とする。

### データバイトの有効な値の範囲

0 から 127 までの整数とする。


## CRUD 操作時の通知表示

appendix/notification.jpg を参照。

## UI方針

- レスポンシブデザインを採用し、ウィンドウサイズに応じてレイアウトが適切に変化するようにする。

## YAMLデータエクスポート時の特記事項

### 文字コード

UTF-8 (BOMなし) とすること。

### MIDIメッセージのYAML表現

1. ステータスのドロップダウンリストで選択された値を MIDI ステータスメッセージの値に変換すること

- Note On: 144
- Note Off: 128
- Control Change: 176
- Program Change: 192
- Pitch Bend: 224
- Aftertouch: 208
- Polyphonic Aftertouch: 160

2. ステータスバイトの値とフォーム上のチャンネルの値を OR した値を出力する

```js
// 例: Note On (144) + チャンネル値が1 => 145
144 | 1 // => 145
```

### シーケンスのインデント

シーケンスのインデントはスペース2つとすること。

例:

```yaml
items:
  - item1
  - item2
```

## ファビコン

`${PROJECT_ROOT}/apps/favicon.png` をファビコンとして使用すること。
