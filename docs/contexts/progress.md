# 現在の進捗・未解決事項

## 完了済み（2026-05-19）

- ArticulationGroups 導入に伴うスキーマ変更対応（`apps/app.js` / `apps/index.html` / `apps/style.css`）
  - データモデルを `Articulations[]` → `ArticulationGroups[{Name, Articulations[], Extra}]` に変更
  - グループUI：ドロップダウン切替方式（追加・削除・リネーム・Extra編集）
  - アーティキュレーションリストはグループ選択に連動
  - YAML export/import を新スキーマ対応（旧形式は互換性なし）
  - FormatVersion: 0 のまま維持
  - Articulations リストと Edit パネルの境界をマウスドラッグでリサイズ可能に

## 完了済み（2026-05-14）

- MIDIノートオン/オフの Data1 ドロップダウン化（`apps/app.js`）
- ファイルフォーマットバージョン値の追加（`apps/app.js`）

## 未解決事項

なし
