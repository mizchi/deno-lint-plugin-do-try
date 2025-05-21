/**
 * コード品質計算モジュールの複雑度計算 - モジュールエクスポート
 *
 * このファイルでは、複雑度計算に関連する関数とインターフェースをエクスポートします。
 */

// 共通のインターフェースと関数をエクスポート
export type {
  ComplexityContext,
  ComplexityOptions,
  ComplexityResult,
} from "./common.ts";

export {
  createComplexityContext,
  DEFAULT_COMPLEXITY_OPTIONS,
  getNodeLineInfo,
} from "./common.ts";

// Expression関連の関数をエクスポート
export {
  calculateExpressionComplexity,
  calculateNewExpressionComplexity,
} from "./expression.ts";

// Statement関連の関数をエクスポート
export {
  calculateExpressionStatementComplexity,
  calculateIfStatementComplexity,
  calculateNewStatementComplexity,
  calculateStatementComplexity,
  calculateVariableStatementComplexity,
} from "./statement.ts";

// Block関連の関数をエクスポート
export { calculateBlockComplexity } from "./block.ts";

// File関連の関数をエクスポート
export { calculateCodeComplexity, calculateFileComplexity } from "./file.ts";

// ユーティリティ関数をエクスポート
export {
  extractHotspots,
  flattenComplexityResult,
  summarizeComplexityResult,
} from "./utils.ts";

// Module関連の関数をエクスポート
export {
  analyzeDependencies,
  calculateModuleComplexity,
  calculateModuleFileComplexity,
  calculateModulesComplexity,
  generateModuleComplexityReport,
  topologicalSort,
} from "./module.ts";

// Module関連の型定義をエクスポート
export type { ModuleComplexityResult, ModuleDependency } from "./module.ts";
