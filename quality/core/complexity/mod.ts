/**
 * コード品質計算モジュールの複雑度計算 - モジュールエクスポート
 *
 * このファイルでは、複雑度計算に関連する関数とインターフェースをエクスポートします。
 * ファサードパターンを適用し、内部実装の詳細を隠蔽して、必要最小限のAPIのみを公開します。
 */

// 共通の型定義をエクスポート
export type {
  ComplexityContext,
  ComplexityOptions,
  ComplexityResult,
} from "./common.ts";

export type { ModuleComplexityResult, ModuleDependency } from "./module.ts";

// 共通の定数と関数をエクスポート
export {
  createComplexityContext,
  DEFAULT_COMPLEXITY_OPTIONS,
} from "./common.ts";

// 内部実装の詳細を隠蔽し、主要な機能のみをエクスポート
import { calculateBlockComplexity } from "./block.ts";
import { calculateCodeComplexity, calculateFileComplexity } from "./file.ts";
import { calculateNewExpressionComplexity } from "./expression.ts";
import { calculateStatementComplexity } from "./statement.ts";
import {
  extractHotspots,
  flattenComplexityResult,
  summarizeComplexityResult,
} from "./utils.ts";
import {
  calculateModuleComplexity,
  calculateModuleFileComplexity,
  calculateModulesComplexity,
  generateModuleComplexityReport,
  topologicalSort,
} from "./module.ts";

// 複雑度計算のファサード
export {
  // ブロック関連
  calculateBlockComplexity,
  // ファイル関連
  calculateCodeComplexity,
  calculateFileComplexity,
  // モジュール関連
  calculateModuleComplexity,
  calculateModuleFileComplexity,
  calculateModulesComplexity,
  // 式関連
  calculateNewExpressionComplexity,
  // 文関連
  calculateStatementComplexity,
  // ユーティリティ
  extractHotspots,
  flattenComplexityResult,
  generateModuleComplexityReport,
  summarizeComplexityResult,
  topologicalSort,
};

// 以下の関数は内部実装の詳細であり、外部からは直接アクセスできないようにします
// - getNodeLineInfo
// - calculateExpressionComplexity
// - calculateExpressionStatementComplexity
// - calculateIfStatementComplexity
// - calculateNewStatementComplexity
// - calculateVariableStatementComplexity
// - analyzeDependencies
