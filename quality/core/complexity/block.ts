/**
 * コード品質計算モジュールの複雑度計算 - Block関連
 *
 * このファイルでは、TypeScriptのBlock（ブロック）の複雑度を計算するための機能を提供します。
 */

// TypeScriptコンパイラを使用
import ts from "npm:typescript";
import {
  ComplexityContext,
  ComplexityResult,
  createTruncatedResult,
  getNodeLineInfo,
} from "./common.ts";
import { calculateStatementComplexity } from "./statement.ts";

/**
 * ブロックの複雑度を計算する
 * @param block ブロック
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
export function calculateBlockComplexity(
  block: ts.Block,
  context: ComplexityContext,
): ComplexityResult {
  // 再帰深度チェック
  if (context.currentDepth >= context.maxDepth) {
    return createTruncatedResult(block);
  }

  // 循環参照チェック
  if (context.visitedNodes.has(block)) {
    return createCircularReferenceBlockResult(block);
  }

  // 訪問済みノードに追加
  context.visitedNodes.add(block);
  context.currentDepth++;

  // 基本スコア
  let score = 1;
  const children: ComplexityResult[] = [];
  const metadata: Record<string, unknown> = {};

  // 各ステートメントの複雑さを計算
  for (const statement of block.statements) {
    const stmtComplexity = calculateStatementComplexity(statement, context);
    children.push(stmtComplexity);
    score += stmtComplexity.score;
  }

  // ブロック内のステートメント数に基づく追加スコア
  const statementCount = block.statements.length;
  score += statementCount * 0.1;
  metadata.statementCount = statementCount;

  // 再帰深度を戻す
  context.currentDepth--;

  return {
    score,
    nodeType: ts.SyntaxKind[block.kind],
    children,
    lineInfo: getNodeLineInfo(block, context.sourceFile),
    metadata,
  };
}

/**
 * 循環参照のブロック結果を作成する
 * @param block ブロック
 * @returns 複雑度計算結果
 */
function createCircularReferenceBlockResult(block: ts.Block): ComplexityResult {
  return {
    score: 1,
    nodeType: ts.SyntaxKind[block.kind],
    children: [],
    metadata: { circular: true },
  };
}
