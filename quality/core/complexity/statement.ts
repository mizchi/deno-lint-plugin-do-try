/**
 * コード品質計算モジュールの複雑度計算 - Statement関連
 *
 * このファイルでは、TypeScriptのStatement（文）の複雑度を計算するための機能を提供します。
 */

// TypeScriptコンパイラを使用
import ts from "npm:typescript";
import {
  ComplexityContext,
  ComplexityResult,
  createTruncatedResult,
  getNodeLineInfo,
} from "./common.ts";
import { calculateExpressionComplexity } from "./expression.ts";
import { calculateBlockComplexity } from "./block.ts";

/**
 * ステートメントの複雑度を計算する（新しいバージョン）
 * 各ノードタイプに対して明確で一貫性のあるスコア計算パターンを実装
 * @param statement ステートメント
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
export function calculateNewStatementComplexity(
  statement: ts.Statement,
  context: ComplexityContext,
): ComplexityResult {
  return calculateStatementComplexityWithPattern(statement, context);
}

/**
 * ステートメントの複雑度を計算する
 * @param statement ステートメント
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
export function calculateStatementComplexity(
  statement: ts.Statement,
  context: ComplexityContext,
): ComplexityResult {
  return calculateStatementComplexityWithPattern(statement, context);
}

/**
 * ステートメントの複雑度を計算する（パターンベースの実装）
 * @param statement ステートメント
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
function calculateStatementComplexityWithPattern(
  statement: ts.Statement,
  context: ComplexityContext,
): ComplexityResult {
  // 再帰深度チェック
  if (context.currentDepth >= context.maxDepth) {
    return createTruncatedResult(statement);
  }

  // 循環参照チェック
  if (context.visitedNodes.has(statement)) {
    return createCircularReferenceStatementResult(statement);
  }

  // 訪問済みノードに追加
  context.visitedNodes.add(statement);
  context.currentDepth++;

  // ノードタイプに基づいて複雑度を計算
  const result = calculateStatementNodeComplexity(statement, context);

  // 再帰深度を戻す
  context.currentDepth--;

  return result;
}

/**
 * 循環参照のステートメント結果を作成する
 * @param statement ステートメント
 * @returns 複雑度計算結果
 */
function createCircularReferenceStatementResult(
  statement: ts.Statement,
): ComplexityResult {
  // ノードタイプに基づいて基本的な複雑度を計算
  let baseScore = 1;
  const metadata: Record<string, unknown> = {
    circular: true,
    estimatedScore: true,
  };

  // ステートメントの種類に基づいて複雑度を追加
  if (ts.isIfStatement(statement)) {
    baseScore += 0.5;
    metadata.statementType = "if";
  } else if (
    ts.isForStatement(statement) || ts.isForOfStatement(statement) ||
    ts.isForInStatement(statement)
  ) {
    baseScore += 0.8;
    metadata.statementType = "loop";
  } else if (ts.isWhileStatement(statement)) {
    baseScore += 0.8;
    metadata.statementType = "while";
  } else if (ts.isDoStatement(statement)) {
    baseScore += 1;
    metadata.statementType = "doWhile";
  } else if (ts.isSwitchStatement(statement)) {
    // caseブロックの数が分からないので平均的な値を使用
    baseScore += 1.5;
    metadata.statementType = "switch";
  } else if (ts.isTryStatement(statement)) {
    baseScore += 3; // try + catch(2)
    metadata.statementType = "try";
  } else if (ts.isThrowStatement(statement)) {
    baseScore += 1;
    metadata.statementType = "throw";
  }

  return {
    score: baseScore,
    nodeType: ts.SyntaxKind[statement.kind],
    children: [],
    metadata,
  };
}

/**
 * ステートメントノードの複雑度を計算する
 * @param statement ステートメント
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
function calculateStatementNodeComplexity(
  statement: ts.Statement,
  context: ComplexityContext,
): ComplexityResult {
  // 基本スコア
  let score = 1;
  const children: ComplexityResult[] = [];
  const metadata: Record<string, unknown> = {};

  // 式文
  if (ts.isExpressionStatement(statement)) {
    if (statement.expression) {
      const exprComplexity = calculateExpressionComplexity(
        statement.expression,
        context,
      );
      children.push(exprComplexity);
      score += exprComplexity.score;
    }
  } // 変数宣言
  else if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.initializer) {
        const initComplexity = calculateExpressionComplexity(
          declaration.initializer,
          context,
        );
        children.push(initComplexity);
        score += initComplexity.score;
      }
    }

    // let宣言は複雑度が高い（変更可能性）
    if ((statement.declarationList.flags & ts.NodeFlags.Let) !== 0) {
      score += 0.5;
      metadata.mutable = true;
    }
  } // if文
  else if (ts.isIfStatement(statement)) {
    // 条件式の複雑さ
    const conditionComplexity = calculateExpressionComplexity(
      statement.expression,
      context,
    );
    children.push(conditionComplexity);
    score += conditionComplexity.score;

    // then節の複雑さ
    const thenComplexity = calculateStatementComplexity(
      statement.thenStatement,
      context,
    );
    children.push(thenComplexity);
    score += thenComplexity.score;

    // else節の複雑さ（存在する場合）
    if (statement.elseStatement) {
      const elseComplexity = calculateStatementComplexity(
        statement.elseStatement,
        context,
      );
      children.push(elseComplexity);
      score += elseComplexity.score;
    }

    // if文自体の複雑さ
    score += 0.5;
  } // for文
  else if (ts.isForStatement(statement)) {
    // 初期化式の複雑さ
    if (statement.initializer) {
      if (ts.isVariableDeclarationList(statement.initializer)) {
        for (const declaration of statement.initializer.declarations) {
          if (declaration.initializer) {
            const initComplexity = calculateExpressionComplexity(
              declaration.initializer,
              context,
            );
            children.push(initComplexity);
            score += initComplexity.score;
          }
        }
      } else if (ts.isExpression(statement.initializer)) {
        const initComplexity = calculateExpressionComplexity(
          statement.initializer,
          context,
        );
        children.push(initComplexity);
        score += initComplexity.score;
      }
    }

    // 条件式の複雑さ
    if (statement.condition) {
      const conditionComplexity = calculateExpressionComplexity(
        statement.condition,
        context,
      );
      children.push(conditionComplexity);
      score += conditionComplexity.score;
    }

    // 増分式の複雑さ
    if (statement.incrementor) {
      const incrementorComplexity = calculateExpressionComplexity(
        statement.incrementor,
        context,
      );
      children.push(incrementorComplexity);
      score += incrementorComplexity.score;
    }

    // 本体の複雑さ
    const bodyComplexity = calculateStatementComplexity(
      statement.statement,
      context,
    );
    children.push(bodyComplexity);
    score += bodyComplexity.score;

    // for文自体の複雑さ
    score += 1;
  } // for-of文/for-in文
  else if (ts.isForOfStatement(statement) || ts.isForInStatement(statement)) {
    // 初期化部分の複雑さ
    if (ts.isVariableDeclarationList(statement.initializer)) {
      for (const declaration of statement.initializer.declarations) {
        if (declaration.initializer) {
          const initComplexity = calculateExpressionComplexity(
            declaration.initializer,
            context,
          );
          children.push(initComplexity);
          score += initComplexity.score;
        }
      }
    }

    // 反復対象の複雑さ
    const expressionComplexity = calculateExpressionComplexity(
      statement.expression,
      context,
    );
    children.push(expressionComplexity);
    score += expressionComplexity.score;

    // 本体の複雑さ
    const bodyComplexity = calculateStatementComplexity(
      statement.statement,
      context,
    );
    children.push(bodyComplexity);
    score += bodyComplexity.score;

    // for-of/for-in文自体の複雑さ
    score += 0.8;
  } // while文
  else if (ts.isWhileStatement(statement)) {
    // 条件式の複雑さ
    const conditionComplexity = calculateExpressionComplexity(
      statement.expression,
      context,
    );
    children.push(conditionComplexity);
    score += conditionComplexity.score;

    // 本体の複雑さ
    const bodyComplexity = calculateStatementComplexity(
      statement.statement,
      context,
    );
    children.push(bodyComplexity);
    score += bodyComplexity.score;

    // while文自体の複雑さ
    score += 0.8;
  } // do-while文
  else if (ts.isDoStatement(statement)) {
    // 本体の複雑さ
    const bodyComplexity = calculateStatementComplexity(
      statement.statement,
      context,
    );
    children.push(bodyComplexity);
    score += bodyComplexity.score;

    // 条件式の複雑さ
    const conditionComplexity = calculateExpressionComplexity(
      statement.expression,
      context,
    );
    children.push(conditionComplexity);
    score += conditionComplexity.score;

    // do-while文自体の複雑さ
    score += 1;
  } // switch文
  else if (ts.isSwitchStatement(statement)) {
    // 条件式の複雑さ
    const conditionComplexity = calculateExpressionComplexity(
      statement.expression,
      context,
    );
    children.push(conditionComplexity);
    score += conditionComplexity.score;

    // 各caseの複雑さ
    for (const clause of statement.caseBlock.clauses) {
      // case式の複雑さ（default節でない場合）
      if (ts.isCaseClause(clause) && clause.expression) {
        const caseExprComplexity = calculateExpressionComplexity(
          clause.expression,
          context,
        );
        children.push(caseExprComplexity);
        score += caseExprComplexity.score * 0.3; // case式は比較的単純なので重みを下げる
      }

      // case本体の複雑さ
      for (const stmt of clause.statements) {
        const stmtComplexity = calculateStatementComplexity(stmt, context);
        children.push(stmtComplexity);
        score += stmtComplexity.score;
      }
    }

    // switch文自体の複雑さ（ケース数に基づく）
    const caseCount = statement.caseBlock.clauses.length;
    score += caseCount * 0.5;
    metadata.caseCount = caseCount;
  } // try-catch文
  else if (ts.isTryStatement(statement)) {
    // tryブロックの複雑さ
    const tryBlockComplexity = calculateBlockComplexity(
      statement.tryBlock,
      context,
    );
    children.push(tryBlockComplexity);
    score += tryBlockComplexity.score;

    // catchブロックの複雑さ（存在する場合）
    if (statement.catchClause) {
      // catch変数の複雑さ
      if (statement.catchClause.variableDeclaration) {
        score += 0.5;
      }

      // catchブロックの複雑さ
      const catchBlockComplexity = calculateBlockComplexity(
        statement.catchClause.block,
        context,
      );
      children.push(catchBlockComplexity);
      score += catchBlockComplexity.score;
      score += 2; // catchブロック自体の複雑さ
    }

    // finallyブロックの複雑さ（存在する場合）
    if (statement.finallyBlock) {
      const finallyBlockComplexity = calculateBlockComplexity(
        statement.finallyBlock,
        context,
      );
      children.push(finallyBlockComplexity);
      score += finallyBlockComplexity.score;
      score += 1.5; // finallyブロック自体の複雑さ
    }

    // try-catch文自体の複雑さ
    score += 1;
  } // throw文
  else if (ts.isThrowStatement(statement)) {
    if (statement.expression) {
      const exprComplexity = calculateExpressionComplexity(
        statement.expression,
        context,
      );
      children.push(exprComplexity);
      score += exprComplexity.score;
    }

    // throw文自体の複雑さ
    score += 1;
  } // return文
  else if (ts.isReturnStatement(statement)) {
    if (statement.expression) {
      const exprComplexity = calculateExpressionComplexity(
        statement.expression,
        context,
      );
      children.push(exprComplexity);
      score += exprComplexity.score;
    }
  } // ブロック文
  else if (ts.isBlock(statement)) {
    const blockComplexity = calculateBlockComplexity(statement, context);
    children.push(blockComplexity);
    score += blockComplexity.score;
  }

  return {
    score,
    nodeType: ts.SyntaxKind[statement.kind],
    children,
    lineInfo: getNodeLineInfo(statement, context.sourceFile),
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}

/**
 * 式文の複雑度を計算する
 * @param statement 式文
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
export function calculateExpressionStatementComplexity(
  statement: ts.ExpressionStatement,
  context: ComplexityContext,
): ComplexityResult {
  let score = 1;
  const children: ComplexityResult[] = [];
  const metadata: Record<string, unknown> = {};

  if (statement.expression) {
    const exprComplexity = calculateExpressionComplexity(
      statement.expression,
      context,
    );
    children.push(exprComplexity);
    score += exprComplexity.score;
    metadata.expressionType = ts.SyntaxKind[statement.expression.kind];
  }

  return {
    score,
    nodeType: ts.SyntaxKind[statement.kind],
    children,
    metadata,
  };
}

/**
 * 変数宣言文の複雑度を計算する
 * @param statement 変数宣言文
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
export function calculateVariableStatementComplexity(
  statement: ts.VariableStatement,
  context: ComplexityContext,
): ComplexityResult {
  let score = 1;
  const children: ComplexityResult[] = [];
  const metadata: Record<string, unknown> = {};

  for (const declaration of statement.declarationList.declarations) {
    if (declaration.initializer) {
      const initComplexity = calculateExpressionComplexity(
        declaration.initializer,
        context,
      );
      children.push(initComplexity);
      score += initComplexity.score;
    }
  }

  // let宣言は複雑度が高い（変更可能性）
  if ((statement.declarationList.flags & ts.NodeFlags.Let) !== 0) {
    score += 0.5;
    metadata.mutable = true;
  }

  metadata.declarationCount = statement.declarationList.declarations.length;

  return {
    score,
    nodeType: ts.SyntaxKind[statement.kind],
    children,
    metadata,
  };
}

/**
 * if文の複雑度を計算する
 * @param statement if文
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
export function calculateIfStatementComplexity(
  statement: ts.IfStatement,
  context: ComplexityContext,
): ComplexityResult {
  let score = 1;
  const children: ComplexityResult[] = [];
  const metadata: Record<string, unknown> = {};

  // 条件式の複雑さ
  const conditionComplexity = calculateExpressionComplexity(
    statement.expression,
    context,
  );
  children.push(conditionComplexity);
  score += conditionComplexity.score;

  // then節の複雑さ
  const thenComplexity = calculateStatementComplexity(
    statement.thenStatement,
    context,
  );
  children.push(thenComplexity);
  score += thenComplexity.score;

  // else節の複雑さ（存在する場合）
  if (statement.elseStatement) {
    const elseComplexity = calculateStatementComplexity(
      statement.elseStatement,
      context,
    );
    children.push(elseComplexity);
    score += elseComplexity.score;
    metadata.hasElse = true;
  }

  // if文自体の複雑さ
  score += 0.5;

  metadata.conditionComplexity = conditionComplexity.score;
  metadata.thenComplexity = thenComplexity.score;
  if (statement.elseStatement) {
    metadata.elseComplexity = children[2].score;
  }

  return {
    score,
    nodeType: ts.SyntaxKind[statement.kind],
    children,
    metadata,
  };
}
