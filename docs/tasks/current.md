# データ型追加に伴うエディタへの対応

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

- [ ] 仕様の確認を行う
     - [ ] docs/specs/README.md の内容の確認
     - [ ] docs/specs/ui/README.md の内容の確認
     - [ ] docs/specs/universal-definition-schema.json の内容の確認
- [ ] 仕様の不明点について人間に質問する
- [ ] 実現可能性、方向性のすり合わせを人間とともに行う
- [ ] エディタの実装を行う
    - [ ] UIの実装
    - [ ] YAMLデータのエクスポート機能の実装
    - [ ] 既存YAMLデータのインポート機能の実装
- [ ] 動作確認を行う
    - [ ] UIの動作確認
    - [ ] YAMLデータのエクスポート機能の動作確認
    - [ ] 既存YAMLデータのインポート機能の動作確認
