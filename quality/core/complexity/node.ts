/**
 * コード品質計算モジュールの複雑度計算 - ノード複雑度計算
 *
 * このファイルでは、TypeScriptのノードの複雑度を計算するための関数を提供します。
 */

import type {
  ComplexityContext,
  ComplexityOptions,
  ComplexityResult,
} from "./common.ts";
import { calculateBlockComplexity } from "./block.ts";
import { calculateFileComplexity } from "./file.ts";
import { calculateExpressionComplexity } from "./expression.ts";
import { calculateStatementComplexity } from "./statement.ts";
import ts from "npm:typescript";

/**
 * ノードの複雑度を計算するファサード関数
 *
 * この関数は、TypeScriptのノード（式、文、ブロック、ファイル、モジュールなど）の
 * 複雑度を計算するための統一されたインターフェースを提供します。
 * ノードの種類に応じて適切な計算関数を呼び出します。
 *
 * @param node TypeScriptのノード
 * @param contextOrOptions 複雑度計算コンテキストまたはオプション（オプション）
 * @param options 複雑度計算オプション（オプション）
 * @returns 複雑度計算結果
 */
export function calculateNodeComplexity(
  node: ts.Node,
  contextOrOptions?: ComplexityContext | ComplexityOptions,
  options?: ComplexityOptions,
): ComplexityResult {
  // contextOrOptionsがComplexityContextかComplexityOptionsかを判定
  let context: ComplexityContext | undefined;
  let actualOptions: ComplexityOptions | undefined;

  if (contextOrOptions) {
    if ("sourceFile" in contextOrOptions) {
      // ComplexityContextの場合
      context = contextOrOptions as ComplexityContext;
      actualOptions = options;
    } else {
      // ComplexityOptionsの場合
      actualOptions = contextOrOptions as ComplexityOptions;
    }
  }

  // ノードの種類に応じて適切な計算関数を呼び出す
  if (ts.isSourceFile(node)) {
    // ソースファイルの場合
    return calculateFileComplexity(node, actualOptions);
  } else if (ts.isBlock(node)) {
    // ブロックの場合
    if (!context) {
      throw new Error("ブロックの複雑度計算にはコンテキストが必要です");
    }
    return calculateBlockComplexity(node, context);
  } else if (ts.isStatement(node)) {
    // 文の場合
    if (!context) {
      throw new Error("文の複雑度計算にはコンテキストが必要です");
    }
    return calculateStatementComplexity(node, context);
  } else if (ts.isExpression(node)) {
    // 式の場合
    if (!context) {
      throw new Error("式の複雑度計算にはコンテキストが必要です");
    }
    return calculateExpressionComplexity(node, context);
  } else {
    // その他のノードの場合
    throw new Error(`未対応のノード種類: ${ts.SyntaxKind[node.kind]}`);
  }
}
