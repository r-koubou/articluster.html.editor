specs
=====


## このファイルの概要

各種仕様や制約を記載するファイルの説明を記載する。作業前に必ず目を通すこと。


## ファイル概要

```
├── README.md                           # このファイル
├── ui/                                 # UI全般に関する仕様
└── universal-definition-schema.json    # YAMLデータのスキーマ
```

## YAMLファイル

本プロジェクトでエクスポートされたYAMLファイルは、C#のプログラムで、ライブラリ YamlDotNet を使用して読み込まれる。
以下にC#側でのYAMLファイルの読み込み時の設定コードを示す。

```csharp
public static readonly IDeserializer DefaultDeserializer
    = new DeserializerBuilder()
        .Build();
```
