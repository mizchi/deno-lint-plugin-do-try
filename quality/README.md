# コード品質計算モジュール

このモジュールは、TypeScript コードの複雑度を分析し、品質を評価するためのツールです。AST（抽象構文木）を再帰的に走査しながら、ステートメントごとにスコアを算出し、その合計スコアを最終的な複雑度とします。

## 目次

- [モジュールの概要と目的](#モジュールの概要と目的)
- [モジュールの構造](#モジュールの構造)
- [複雑度計算の仕組み](#複雑度計算の仕組み)
- [複雑度指標の説明](#複雑度指標の説明)
- [API の使用方法](#api-の使用方法)
- [CLI の使用方法](#cli-の使用方法)
- [テストの概要と実行方法](#テストの概要と実行方法)
- [ホットスポット検出](#ホットスポット検出)
- [コード比較](#コード比較)

## モジュールの概要と目的

コード品質計算モジュールは、TypeScript コードの品質を客観的に評価するためのツールです。このモジュールは以下の目的で設計されています：

1. コードの複雑度を定量的に測定する
2. 複雑度の高い部分（ホットスポット）を特定する
3. 異なるコード実装の品質を比較する
4. コードの改善点を示唆する詳細なレポートを生成する

このモジュールを使用することで、開発者はコードの品質を継続的に監視し、リファクタリングの必要な箇所を特定することができます。

## モジュールの構造

### ファイル構成

```
quality/
├── mod.ts                 # モジュールのエントリーポイント、主要な関数をエクスポート
├── cli.ts                 # コマンドラインインターフェース
├── test/                  # テストファイル
├── core/                  # コアモジュール
│   ├── mod.ts             # コアモジュールのエントリーポイント
│   ├── types.ts           # 型定義
│   ├── parser.ts          # コード解析機能
│   ├── metrics.ts         # 複雑度計算機能
│   ├── comparator.ts      # コード比較機能
│   └── reporter.ts        # レポート生成機能
├── fixtures/              # テスト用のフィクスチャ
│   ├── simple.ts          # シンプルなコード例
│   ├── medium.ts          # 中程度の複雑さのコード例
│   ├── complex.ts         # 複雑なコード例
│   └── compact_complex.ts # 簡潔だが複雑なコード例
└── test/                  # テストファイル
    ├── if-matrix.test.ts  # if文の複雑度テスト
    └── switch-matrix.test.ts # switch文の複雑度テスト
```

### 各ファイルの役割

- **mod.ts**: モジュールのエントリーポイントで、主要な関数をエクスポートします。
- **cli.ts**: コマンドラインからモジュールを使用するためのインターフェースを提供します。
- **core/mod.ts**: コアモジュールのエントリーポイントで、コア機能をエクスポートします。
- **core/types.ts**: モジュール全体で使用される型定義を提供します。
- **core/parser.ts**: TypeScript の AST を解析するための機能を提供します。
- **core/metrics.ts**: 複雑度指標を計算するための機能を提供します。
- **core/comparator.ts**: 2 つのコードの複雑度を比較するための機能を提供します。
- **core/reporter.ts**: 複雑度レポートを生成するための機能を提供します。

## 複雑度計算の仕組み

### 基本的なアプローチ

コード品質計算モジュールは、以下のステップでコードの複雑度を計算します：

1. TypeScript のコンパイラ API を使用して、コードを AST に変換します。
2. AST を再帰的に走査し、各ノードの複雑度を計算します。
3. 特定の種類のノード（変数宣言、関数宣言、条件分岐など）に対して、専用の複雑度計算ロジックを適用します。
4. 各ノードの複雑度スコアを累積して、全体の複雑度スコアを算出します。
5. 複雑度の高いノードをホットスポットとして記録します。

### スコア計算方法

複雑度スコアは、以下の指標の重み付け合計として計算されます：

```typescript
totalScore =
  variableMutabilityScore * variableMutabilityWeight +
  scopeComplexityScore * scopeComplexityWeight +
  assignmentScore * assignmentWeight +
  functionComplexityScore * functionComplexityWeight +
  conditionalComplexityScore * conditionalComplexityWeight +
  exceptionHandlingScore * exceptionHandlingWeight;
```

デフォルトの重み付け設定は以下の通りです：

```typescript
const DEFAULT_COMPLEXITY_WEIGHTS = {
  variableMutabilityWeight: 1.5, // 変数の変更可能性の重み
  scopeComplexityWeight: 1.0, // スコープの複雑さの重み
  assignmentWeight: 1.2, // 代入操作の重み
  functionComplexityWeight: 1.0, // 関数の複雑さの重み
  conditionalComplexityWeight: 2.0, // 条件分岐の複雑さの重み
  exceptionHandlingWeight: 1.5, // 例外処理の複雑さの重み
};
```

ユーザーはこれらの重み付けをカスタマイズすることで、特定の複雑度指標をより重視することができます。

## 複雑度指標の説明

このモジュールでは、以下の指標を使用してコードの複雑度を評価します：

### 1. 変数の変更可能性（Variable Mutability）

`let`で宣言された変数が変更される回数に基づくスコアです。変更が多いほど複雑度が高くなります。

計算方法：

- 各変数の変更回数を追跡します。
- 変更回数に応じてスコアを加算します（変更回数 = スコア）。
- 変更回数が多い変数はホットスポットとして記録されます。

### 2. スコープの複雑さ（Scope Complexity）

スコープ内のシンボル（変数、関数、クラスなど）の数に基づくスコアです。シンボルが多いほど複雑度が高くなります。

計算方法：

- スコープ内のシンボル数をカウントします。
- シンボル数 × 0.5 をスコアとして加算します。
- シンボル数が 5 を超えるスコープはホットスポットとして記録されます。

### 3. 代入操作（Assignment Operations）

代入操作の数に基づくスコアです。代入が多いほど複雑度が高くなります。

計算方法：

- 各代入操作（`=`演算子）に対して 1 ポイントを加算します。
- 複合代入演算子（`+=`, `-=`など）や前置・後置インクリメント/デクリメント演算子（`++`, `--`）も変数の変更として追跡されます。

### 4. 関数の複雑さ（Function Complexity）

関数の本体の複雑さと引数の数に基づくスコアです。関数が複雑であるほど、スコアが高くなります。

計算方法：

- 関数本体の複雑さを計算します（各ステートメントの複雑さの合計）。
- 引数の数を考慮します。
- 推定呼び出し回数を計算します（本体の複雑さに基づく推定値）。
- 関数の複雑さ = 推定呼び出し回数 × (本体の複雑さ + 引数の数)
- 複雑さスコアが 5 を超える関数はホットスポットとして記録されます。

### 5. 条件分岐の複雑さ（Conditional Complexity）

条件式の複雑さと switch 文のケース数に基づくスコアです。条件分岐が複雑であるほど、スコアが高くなります。

計算方法：

- if 文の条件式の複雑さを計算します（論理演算子や比較演算子の使用に基づく）。
- switch 文のケース数 × 0.5 をスコアとして加算します。
- 複雑さが 2 を超える条件式や、5 ケース以上の switch 文はホットスポットとして記録されます。

### 6. 例外処理の複雑さ（Exception Handling Complexity）

try-catch-finally ブロックと throw 文の複雑さに基づくスコアです。例外処理が複雑であるほど、スコアが高くなります。

計算方法：

- throw 文に対して基本スコア 1 を加算し、throw される式の複雑さも考慮します。
- try-catch ブロックに対して基本スコア 1 を加算します。
- try ブロックの行数 × 0.5 をスコアとして加算します。
- catch ブロックがある場合は 2 ポイント、finally ブロックがある場合は 1.5 ポイントを加算します。
- 複雑さスコアが 5 を超える try-catch ブロックはホットスポットとして記録されます。

## API の使用方法

### 基本的な使用方法

```typescript
import {
  analyzeCodeComplexity,
  calculateComplexityScore,
  compareCodeComplexity,
  generateDetailedComplexityReport,
} from "./quality/mod.ts";

// コードの複雑度を分析
const code = `
function add(a: number, b: number) {
  return a + b;
}
`;
const metrics = analyzeCodeComplexity(code);
const score = calculateComplexityScore(metrics);
console.log(`複雑度スコア: ${score}`);

// 詳細レポートの生成
const report = generateDetailedComplexityReport(code);
console.log(`総合スコア: ${report.score}`);
console.log("詳細指標:", report.breakdown);
console.log("ホットスポット:", report.hotspots);
```

### カスタム重み付けの使用

```typescript
import {
  analyzeCodeComplexity,
  calculateComplexityScore,
  ComplexityWeights,
} from "./quality/mod.ts";

// カスタム重み付け設定
const customWeights: ComplexityWeights = {
  variableMutabilityWeight: 2.0, // 変数の変更可能性の重み
  scopeComplexityWeight: 1.5, // スコープの複雑さの重み
  assignmentWeight: 1.0, // 代入操作の重み
  functionComplexityWeight: 1.5, // 関数の複雑さの重み
  conditionalComplexityWeight: 2.5, // 条件分岐の複雑さの重み
  exceptionHandlingWeight: 2.0, // 例外処理の複雑さの重み
};

const code = `/* コード */`;
const metrics = analyzeCodeComplexity(code);
const score = calculateComplexityScore(metrics, customWeights);
console.log(`カスタム重み付けによる複雑度スコア: ${score}`);
```

### 2 つのコードの比較

```typescript
import { compareCodeComplexity } from "./quality/mod.ts";

const codeA = `function add(a, b) { return a + b; }`;
const codeB = `
function add(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('引数は数値である必要があります');
  }
  return a + b;
}
`;
const comparison = compareCodeComplexity(codeA, codeB);
console.log(`コードAのスコア: ${comparison.scoreA}`);
console.log(`コードBのスコア: ${comparison.scoreB}`);
console.log(`優れているコード: ${comparison.betterCode}`);
```

## CLI の使用方法

コマンドラインインターフェース（CLI）を使用して、ファイルの複雑度を分析することもできます。

### 単一ファイルの分析

```bash
deno run --allow-read quality/cli.ts analyze path/to/file.ts
```

### 2 つのファイルの比較

```bash
deno run --allow-read quality/cli.ts compare path/to/fileA.ts path/to/fileB.ts
```

### 詳細レポートの生成

```bash
deno run --allow-read quality/cli.ts report path/to/file.ts
```

### ホットスポットの検出

```bash
deno run --allow-read quality/cli.ts hotspots path/to/file.ts
```

特定の数のホットスポットのみを表示する場合：

```bash
deno run --allow-read quality/cli.ts hotspots path/to/file.ts 5
```

### ヘルプの表示

```bash
deno run --allow-read quality/cli.ts help
```

## テストの概要と実行方法

### テストの構成

テストは主に以下の 2 つのカテゴリに分かれています：

1. フィクスチャを使用したテスト（`fixtures_test.ts`）

   - 様々な複雑さのコード例（`fixtures/`ディレクトリ内）を使用して、複雑度計算の正確性をテストします。

2. 特定の構文に対するテスト（`test/`ディレクトリ内）
   - `if-matrix.test.ts`: if 文の様々なパターンに対する複雑度計算をテストします。
   - `switch-matrix.test.ts`: switch 文の様々なパターンに対する複雑度計算をテストします。

### テストの実行方法

すべてのテストを実行するには：

```bash
deno test --allow-read quality/
```

特定のテストファイルを実行するには：

```bash
deno test --allow-read quality/fixtures_test.ts
```

## ホットスポット検出

ホットスポットは、コード内で複雑度が特に高い部分を示します。各ホットスポットには以下の情報が含まれます：

- **nodeType**: AST ノードの種類（例: IfStatement, TryStatement）
- **line**: コード内の行番号
- **score**: 複雑度スコア
- **reason**: 複雑度が高い理由の説明

ホットスポットは複雑度スコアの降順でソートされ、最も複雑な部分から順に表示されます。

### ホットスポット検出の例

```typescript
import { analyzeCodeComplexity } from "./quality/mod.ts";

const code = `/* 複雑なコード */`;
const metrics = analyzeCodeComplexity(code);

// ホットスポットの表示
metrics.hotspots.forEach((hotspot, index) => {
  console.log(
    `${index + 1}. ${hotspot.nodeType} (行: ${
      hotspot.line
    }): スコア ${hotspot.score.toFixed(2)} - ${hotspot.reason}`
  );
});
```

## コード比較

このモジュールでは、2 つのコードの複雑度を比較する機能を提供しています。比較結果には、各コードの複雑度指標、スコア、およびどちらのコードが優れているかの判定が含まれます。

### 比較方法

1. 2 つのコードそれぞれに対して複雑度指標を計算します。
2. 各指標に重み付けを適用して総合スコアを算出します。
3. スコアを比較して、どちらのコードが優れているかを判定します（スコアが低いほど良い）。

### 比較レポートの生成

```typescript
import { generateComparisonReport } from "./quality/core/mod.ts";

const codeA = `/* コードA */`;
const codeB = `/* コードB */`;
const report = generateComparisonReport(
  codeA,
  codeB,
  "リファクタリング前",
  "リファクタリング後"
);
console.log(report);
```

生成されるレポートには、各コードのスコア、優劣の判定、および各複雑度指標の詳細な比較が含まれます。

## ライセンス

このモジュールは[ライセンス名]の下で公開されています。詳細については、リポジトリの LICENSE ファイルを参照してください。
