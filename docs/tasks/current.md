# JSONスキーマ仕様回収に伴うUIの改善

## 課題

新しいスキーマ仕様は `/docs/specs/universal-definition-schema_new.json` に記載されている。

- ArticulationGroups というグルーピングを導入
- 従来のArticulatiions を複数持てるようになった

これまで

```yaml
Articulations:
  - Name: articulation1
    MidiMessages:
    - Status: 0x90
      Data1: 60
      Data2: 127
  - Name: articulation2
    MidiMessages:
    - Status: 0xB0
      Data1: 64
      Data2: 127
```

新しいスキーマ

```yaml
ArticulationGroups:
  - Name: group1
    Articulations:
    - Name: articulation1
      MidiMessages:
      - Status: 0x90
        Data1: 60
        Data2: 127
    - Name: articulation2
      MidiMessages:
      - Status: 0xB0
        Data1: 64
        Data2: 127
  - Name: group2
    Articulations:
    - Name: articulation3
      MidiMessages:
      - Status: 0x80
        Data1: 60
        Data2: 0
```

### 成果物の要件

- ArticulationGroups の追加、削除、編集ができるようになること
- 現状のUI構成に無理が生じるようであれば再度レイアウトの見直しを行っても良い

## タスク内容

- [x] 実現可能性、方向性のすり合わせを人間とともに行う
- [x] コード修正
- [x] 動作確認を行う
    - [x] 動作確認
    - [x] リグレッションテスト
