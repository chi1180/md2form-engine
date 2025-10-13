# md2form

Markdownでフォーム定義を記述し、型安全なJSONに変換するパーサーライブラリです。
見出しレベルでページ構造と質問を表現し、シンプルなハッシュ記法（`#key value`）で詳細設定を行います。

## 主な特徴

- **シンプルな記法**: Markdownの見出しと段落だけでフォーム構造を定義
- **型安全**: TypeScriptの型定義（`FormDocument`）で変換結果を安全に扱える
- **豊富な質問タイプ**: テキスト入力から評価スケール、ファイルアップロードまで幅広くサポート
- **フロントマター対応**: YAMLでフォーム全体の設定を管理

## インストール

```bash
npm install md2form
# または
bun add md2form
```

開発環境では[Bun](https://bun.sh) v1.2.18+を推奨します。

```bash
git clone <repository>
cd md2form
bun install
```

## 基本的な使い方

### ライブラリとして使用

```typescript
import { parseMarkdownToForm } from "md2form";

const markdown = `
---
collectEmail: true
showProgressBar: true
---

# お問い合わせフォーム
簡単なアンケートです。

## 基本情報
### お名前
#type short_text
#placeholder "山田 太郎"
#required true

### 年齢
#type number
#min 0
#max 120
`;

const form = await parseMarkdownToForm(markdown);
console.log(form.title); // "お問い合わせフォーム"
console.log(form.pages[0].elements[0].type); // "short_text"
```

### サンプルの実行

```bash
bun run workspace
```

このコマンドで`workspace/sample-form.md`をパースし、結果を`workspace.json`に出力します。

## Markdownスキーマ

### 基本構造

```markdown
---
thisIsFrontMatter: true
collectEmail: true
showProgressBar: true
---

# フォームタイトル（必須）

フォームの説明文（任意）

## セクション1

セクションの説明（任意）

### 質問1

#type short_text
#placeholder "入力例"
#required true

### 質問2

#type radio
#options "選択肢1","選択肢2","選択肢3"

## セクション2

### 質問3

#type number
#min 1
#max 10
```

### 構造のルール

1. **フォームタイトル**: 最初の`# 見出し`がフォームタイトルになる
2. **セクション**: `## 見出し`で新しいページ（セクション）を作成
3. **質問**: `### 見出し`で質問を定義
4. **プロパティ**: 質問直後の段落に`#key value`形式で設定を記述

## サポートされる質問タイプ

### テキスト入力系

- `short_text`: 1行テキスト
- `long_text`: 複数行テキスト
- `number`: 数値入力
- `email`: メールアドレス
- `phone`: 電話番号

### 選択系

- `dropdown`: ドロップダウン
- `radio`: ラジオボタン（単一選択）
- `checkbox`: チェックボックス（複数選択）

### 日時系

- `date`: 日付
- `time`: 時刻

### 評価・スケール系

- `rating`: 星評価
- `likert`: リッカート尺度
- `matrix`: マトリクス（行×列）
- `scale`: スライダー

### その他

- `file_upload`: ファイルアップロード
- `signature`: 署名
- `boolean`: Yes/No選択
- `section_header`: セクション見出し（表示のみ）
- `image`: 画像表示
- `video`: 動画表示

## プロパティ一覧

### 共通プロパティ

```markdown
#required true # 必須入力
#visible false # 表示/非表示
```

### テキスト系

```markdown
#placeholder "入力例"
#maxLength 100
```

### 数値系

```markdown
#min 0
#max 100
#step 5
```

### 選択系

```markdown
#options "選択肢1","選択肢2","選択肢3"
#allowOther true
```

### 時刻系

```markdown
#minTime "09:00"
#maxTime "18:00"
```

### 評価系

```markdown
#scale 5
#labels "低い","高い"
#icon star
```

### ファイル系

```markdown
#allowedTypes "pdf","docx"
#maxFiles 3
#maxSizeMB 10
```

## フロントマター設定

```yaml
---
collectEmail: true # メールアドレス収集
allowMultipleResponses: false # 複数回答許可
showProgressBar: true # プログレスバー表示
shuffleQuestions: false # 質問順をシャッフル
responseReceipt: "whenRequested" # 回答受領通知
---
```

## 変換結果の型定義

```typescript
type FormDocument = {
  title: string;
  description?: string;
  settings?: FormSettings;
  pages: Page[];
};

type Page = {
  title?: string;
  description?: string;
  elements: FormElement[];
};

type FormElement = ShortText | NumberField | RadioField | CheckboxField;
// ... その他の型
```

詳細な型定義は`src/types/form.types.ts`を参照してください。

## 実装例

### 完全なフォーム例

`workspace/sample-form.md`に、すべての質問タイプを含む完全なサンプルがあります。

### カスタムパーサーの作成

```typescript
import { ParserEngine } from "md2form/src/parseEngine";

const engine = new ParserEngine(markdownContent);
await engine.parse();
const formData = engine.form;
```

## 制限事項・注意点

- プロパティ値のダブルクォートは現在そのまま保持されます
- 質問プロパティは`### 質問`の直後の段落に記述する必要があります
- リッチなMarkdown（リストや強調など）は説明文では限定的にサポート
- `unknown`タイプは内部的なプレースホルダーです

## 開発・貢献

```bash
# 開発環境のセットアップ
git clone <repository>
cd md2form
bun install

# サンプルの実行とテスト
bun run workspace

# 型チェック
bun run tsc --noEmit
```

## ライセンス

MIT License
