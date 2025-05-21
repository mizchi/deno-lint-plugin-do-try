/**
 * コード品質計算モジュールの複雑度計算 - 共通部分
 *
 * このファイルでは、複雑度計算に必要な共通のインターフェースと関数を提供します。
 */

// TypeScriptコンパイラを使用
import ts from "npm:typescript";

/**
 * 複雑度計算の結果を表すインターフェース
 */
export interface ComplexityResult {
  // 総合スコア
  score: number;
  // ノードの種類
  nodeType: string;
  // 子ノードの複雑度結果（再帰構造）
  children: ComplexityResult[];
  // 行番号情報
  lineInfo?: {
    startLine: number;
    endLine: number;
  };
  // 追加情報（理由など）
  metadata?: Record<string, unknown>;
}

/**
 * 複雑度計算のコンテキスト
 * 計算中に必要な情報を保持します
 */
export interface ComplexityContext {
  // ソースファイル（行番号計算に使用）
  sourceFile: ts.SourceFile;
  // 訪問済みノードを追跡（循環参照防止）
  visitedNodes: Set<ts.Node>;
  // 最大再帰深度
  maxDepth: number;
  // 現在の再帰深度
  currentDepth: number;
}

/**
 * 複雑度計算の設定
 */
export interface ComplexityOptions {
  // 最大再帰深度（デフォルト: 20）
  maxDepth?: number;
  // 式の複雑度の重み
  expressionWeight?: number;
  // ステートメントの複雑度の重み
  statementWeight?: number;
  // ブロックの複雑度の重み
  blockWeight?: number;
}

/**
 * デフォルトの複雑度計算オプション
 */
export const DEFAULT_COMPLEXITY_OPTIONS: ComplexityOptions = {
  maxDepth: 20,
  expressionWeight: 1.0,
  statementWeight: 1.5,
  blockWeight: 2.0,
};

/**
 * 複雑度計算のコンテキストを初期化する
 * @param sourceFile ソースファイル
 * @param options 複雑度計算オプション
 * @returns 初期化されたコンテキスト
 */
export function createComplexityContext(
  sourceFile: ts.SourceFile,
  options: ComplexityOptions = DEFAULT_COMPLEXITY_OPTIONS,
): ComplexityContext {
  return {
    sourceFile,
    visitedNodes: new Set<ts.Node>(),
    maxDepth: options.maxDepth || DEFAULT_COMPLEXITY_OPTIONS.maxDepth!,
    currentDepth: 0,
  };
}

/**
 * ノードの行情報を取得する
 * @param node ASTノード
 * @param sourceFile ソースファイル
 * @returns 行情報オブジェクト
 */
export function getNodeLineInfo(node: ts.Node, sourceFile: ts.SourceFile) {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
  return {
    startLine: start.line + 1, // 1-based
    endLine: end.line + 1, // 1-based
  };
}

/**
 * 切り捨てられた結果を作成する
 * @param node ASTノード
 * @returns 複雑度計算結果
 */
export function createTruncatedResult(node: ts.Node): ComplexityResult {
  return {
    score: 1,
    nodeType: ts.SyntaxKind[node.kind],
    children: [],
    metadata: { truncated: true },
  };
}
