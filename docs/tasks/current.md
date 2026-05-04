# エディタ作成

## ゴールの詳細

UI・機能要件を満たすエディタの実装。

### 成果物の要件

- 新規作成（New）で編集データを全てクリアできる
- General Edit で Universal Definition オブジェクト直下の項目が編集できる
- Articulation List で新規の Articulation を追加できる
- Articulation List で既存の Articulation を削除できる
- Articulation Edit でステータスを変更できる
- Extra Edit で Key Value の追加・削除・編集ができる
    - General Edit からの呼び出し Universal Definition オブジェクト直下の Extra の編集ができる
    - Articulation Edit からの呼び出し Articulation オブジェクト直下の Extra の編集ができる
- YAMLデータのエクスポートができる
    - エクスポートされるYAMLデータは、Universal Definition JSON スキーマの仕様を満たしていること
    - エクスポートされるYAMLデータの内容は、エディタ上の内容と一致していること
- 既存のYAMLデータのインポートができる
    - インポートされるYAMLデータは、Universal Definition JSON スキーマの仕様を満たしていること
    - インポートされるYAMLデータの内容は、エディタ上の内容と一致していること

## タスク内容

- [x] 仕様の確認を行う
     - [x] docs/specs/README.md の内容の確認
     - [x] docs/specs/ui/README.md の内容の確認
     - [x] docs/specs/universal-definition-schema.json の内容の確認
- [x] 仕様の不明点について人間に質問する
- [x] 実現可能性、方向性のすり合わせを人間とともに行う
- [x] エディタの実装を行う
    - [x] UIの実装
    - [x] YAMLデータのエクスポート機能の実装
    - [x] 既存YAMLデータのインポート機能の実装
- [x] 動作確認を行う
    - [x] UIの動作確認
    - [x] YAMLデータのエクスポート機能の動作確認
    - [x] 既存YAMLデータのインポート機能の動作確認
