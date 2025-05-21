/**
 * コード品質計算モジュールの複雑度計算 - 極小エクスポート
 *
 * このファイルでは、複雑度計算に関連する絶対最小限の関数と型定義のみをエクスポートします。
 * 以前のバージョンでは複数の関数や型をエクスポートしていましたが、APIをさらに単純化するため、
 * `calculateNodeComplexity` のみをメインのエントリーポイントとして公開し、
 * その使用に必要な型定義のみを残しています。
 *
 * これにより、モジュールのAPIが極限までシンプルになり、内部実装の詳細が完全に隠蔽されます。
 * 利用者は単一の関数のみを意識すればよく、内部の複雑な実装詳細を知る必要がなくなります。
 * また、将来の内部実装の変更に対する影響をさらに最小限に抑えることができます。
 */

// calculateNodeComplexity 関数の使用に必要な最小限の型定義のみをエクスポート
export type {
  ComplexityContext,
  ComplexityOptions,
  ComplexityResult,
} from "./common.ts";

// メインのファサード関数 - 複雑度計算の唯一のエントリーポイント
export { calculateNodeComplexity } from "./node.ts";
export { createComplexityContext } from "./common.ts";
export { generateModuleComplexityReport } from "./module.ts";

export { summarizeComplexityResult } from "./utils.ts";

// 注意: 以前エクスポートしていた以下の要素はすべて削除されました
// - ModuleComplexityResult, ModuleDependency (型定義)
// - createComplexityContext, DEFAULT_COMPLEXITY_OPTIONS (共通関数と定数)
// - extractHotspots, flattenComplexityResult, summarizeComplexityResult (ユーティリティ関数)
// - generateModuleComplexityReport, topologicalSort (モジュール分析関数)
