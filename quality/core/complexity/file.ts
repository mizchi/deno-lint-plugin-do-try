/**
 * コード品質計算モジュールの複雑度計算 - File関連
 *
 * このファイルでは、TypeScriptのSourceFile（ソースファイル）の複雑度を計算するための機能を提供します。
 */

// TypeScriptコンパイラを使用
import ts from "npm:typescript";
import {
  type ComplexityOptions,
  type ComplexityResult,
  createComplexityContext,
  DEFAULT_COMPLEXITY_OPTIONS,
} from "./common.ts";
import { calculateStatementComplexity } from "./statement.ts";

/**
 * ソースファイル全体の複雑度を計算する
 * @param sourceFile ソースファイル
 * @param options 複雑度計算オプション
 * @returns 複雑度計算結果
 */
export function calculateFileComplexity(
  sourceFile: ts.SourceFile,
  options: ComplexityOptions = DEFAULT_COMPLEXITY_OPTIONS,
): ComplexityResult {
  const context = createComplexityContext(sourceFile, options);

  // 基本スコア
  let score = 1;
  const children: ComplexityResult[] = [];

  // 各ステートメントの複雑さを計算
  for (const statement of sourceFile.statements) {
    const stmtComplexity = calculateStatementComplexity(statement, context);
    children.push(stmtComplexity);

    // ステートメントの種類に基づいて重み付けを行う
    let weight = 1.0;

    // クラス宣言は内部構造が複雑なので重みを増やす
    if (ts.isClassDeclaration(statement)) {
      // クラスのメンバー数に基づいて重みを調整
      const memberCount = statement.members.length;
      weight = 1.0 + (memberCount * 0.1);

      // 継承がある場合はさらに複雑
      if (statement.heritageClauses && statement.heritageClauses.length > 0) {
        weight += 0.5;
      }
    } // インターフェース宣言も複雑な構造を持つ
    else if (ts.isInterfaceDeclaration(statement)) {
      const memberCount = statement.members.length;
      weight = 1.0 + (memberCount * 0.05);
    } // 関数宣言は比較的シンプル
    else if (ts.isFunctionDeclaration(statement)) {
      // パラメータ数に基づいて重みを調整
      const paramCount = statement.parameters.length;
      weight = 0.8 + (paramCount * 0.05);
    }

    score += stmtComplexity.score * weight;
  }

  return {
    score,
    nodeType: ts.SyntaxKind[sourceFile.kind],
    children,
    lineInfo: {
      startLine: 1,
      endLine:
        sourceFile.getLineAndCharacterOfPosition(sourceFile.getEnd()).line + 1,
    },
    metadata: {
      fileName: sourceFile.fileName,
      statementCount: sourceFile.statements.length,
      weightedScore: true,
    },
  };
}

/**
 * コードの複雑度を計算する
 * @param code TypeScriptコード
 * @param options 複雑度計算オプション
 * @returns 複雑度計算結果
 */
export function calculateCodeComplexity(
  code: string,
  options: ComplexityOptions = DEFAULT_COMPLEXITY_OPTIONS,
): ComplexityResult {
  // ソースファイルを作成
  const sourceFile = ts.createSourceFile(
    "temp.ts",
    code,
    ts.ScriptTarget.Latest,
    true,
  );

  // ファイル全体の複雑度を計算
  return calculateFileComplexity(sourceFile, options);
}
