/**
 * コード品質計算モジュールの複雑度計算 - モジュールエクスポート
 *
 * このファイルでは、複雑度計算に関連する最小限の関数とインターフェースをエクスポートします。
 * ファサードパターンを強化し、`calculateNodeComplexity` をメインのエントリーポイントとして
 * 公開することで、APIをよりシンプルにしました。これにより、モジュールの使用方法が
 * 統一され、内部実装の詳細がさらに隠蔽されます。
 *
 * 以前は複数の計算関数を直接エクスポートしていましたが、それらは内部実装の詳細として
 * 扱い、外部からは `calculateNodeComplexity` を通じてのみアクセスできるようにしました。
 * これにより、APIの一貫性が向上し、将来の内部実装の変更に対する影響を最小限に抑えられます。
 */

// 共通の型定義をエクスポート - 外部からの利用に必要な型のみを公開
export type {
  ComplexityContext,
  ComplexityOptions,
  ComplexityResult,
} from "./common.ts";

export type { ModuleComplexityResult, ModuleDependency } from "./module.ts";

// 共通の定数と関数をエクスポート - 複雑度計算の設定と初期化に必要
export {
  createComplexityContext,
  DEFAULT_COMPLEXITY_OPTIONS,
} from "./common.ts";

// メインのファサード関数 - 複雑度計算のエントリーポイント
export { calculateNodeComplexity } from "./node.ts";

// 必要なユーティリティ関数のみをエクスポート
export {
  // 結果の分析と加工に必要なユーティリティ
  extractHotspots,
  flattenComplexityResult,
  summarizeComplexityResult,
} from "./utils.ts";

// モジュール分析に必要な関数のみをエクスポート
export { generateModuleComplexityReport, topologicalSort } from "./module.ts";

// 以下の関数は内部実装の詳細であり、外部からは直接アクセスできないようにします
// - calculateBlockComplexity
// - calculateCodeComplexity
// - calculateFileComplexity
// - calculateNewExpressionComplexity
// - calculateStatementComplexity
// - calculateModuleComplexity
// - calculateModuleFileComplexity
// - calculateModulesComplexity
// - getNodeLineInfo
// - calculateExpressionComplexity
// - calculateExpressionStatementComplexity
// - calculateIfStatementComplexity
// - calculateNewStatementComplexity
// - calculateVariableStatementComplexity
// - analyzeDependencies
