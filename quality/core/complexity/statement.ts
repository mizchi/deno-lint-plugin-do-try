/**
 * コード品質計算モジュールの複雑度計算 - Statement関連
 *
 * このファイルでは、TypeScriptのStatement（文）の複雑度を計算するための機能を提供します。
 */

// TypeScriptコンパイラを使用
import ts from "npm:typescript";
import {
  type ComplexityContext,
  type ComplexityResult,
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
/**
 * 早期リターン条件をチェックする
 * @param statement 文
 * @param context 複雑度計算コンテキスト
 * @returns 早期リターン結果または null
 */
function checkEarlyReturnForStatement(
  statement: ts.Statement,
  context: ComplexityContext,
): ComplexityResult | null {
  // 再帰深度チェック
  if (context.currentDepth >= context.maxDepth) {
    return createTruncatedResult(statement);
  }

  // 循環参照チェック
  if (context.visitedNodes.has(statement)) {
    return createCircularReferenceStatementResult(statement);
  }

  return null;
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
  // 早期リターン条件をチェック
  const earlyResult = checkEarlyReturnForStatement(statement, context);
  if (earlyResult !== null) {
    return earlyResult;
  }

  // 訪問済みノードに追加
  context.visitedNodes.add(statement);
  context.currentDepth++;

  try {
    // ノードタイプに基づいて複雑度を計算
    return calculateStatementNodeComplexity(statement, context);
  } finally {
    // 再帰深度を戻す（例外が発生しても確実に実行）
    context.currentDepth--;
  }
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
/**
 * 式文の複雑度を計算する
 * @param statement 式文
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
function calculateExpressionStatementNodeComplexity(
  statement: ts.ExpressionStatement,
  context: ComplexityContext,
): ComplexityResult {
  let score = 1;
  const children: ComplexityResult[] = [];

  if (statement.expression) {
    const exprComplexity = calculateExpressionComplexity(
      statement.expression,
      context,
    );
    children.push(exprComplexity);
    score += exprComplexity.score;
  }

  return {
    score,
    nodeType: ts.SyntaxKind[statement.kind],
    children,
    lineInfo: getNodeLineInfo(statement, context.sourceFile),
  };
}

/**
 * 変数宣言文の複雑度を計算する
 * @param statement 変数宣言文
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
function calculateVariableStatementNodeComplexity(
  statement: ts.VariableStatement,
  context: ComplexityContext,
): ComplexityResult {
  let score = 1;
  const children: ComplexityResult[] = [];
  const metadata: Record<string, unknown> = {};

  // 宣言の数をカウント
  const declarationCount = statement.declarationList.declarations.length;

  // 各宣言の初期化式の複雑度を計算
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
    // let宣言の数に応じて複雑度を乗算
    const letMultiplier = 1 + (declarationCount * 0.5);
    score *= letMultiplier;
    metadata.mutable = true;
    metadata.letDeclarationCount = declarationCount;
    metadata.letMultiplier = letMultiplier;
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
 * if文の複雑度を計算する
 * @param statement if文
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
function calculateIfStatementNodeComplexity(
  statement: ts.IfStatement,
  context: ComplexityContext,
): ComplexityResult {
  let score = 1;
  const children: ComplexityResult[] = [];

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

  return {
    score,
    nodeType: ts.SyntaxKind[statement.kind],
    children,
    lineInfo: getNodeLineInfo(statement, context.sourceFile),
  };
}

/**
 * ループ文の複雑度を計算する（for, for-of, for-in, while, do-while）
 * @param statement ループ文
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
function calculateLoopStatementNodeComplexity(
  statement:
    | ts.ForStatement
    | ts.ForOfStatement
    | ts.ForInStatement
    | ts.WhileStatement
    | ts.DoStatement,
  context: ComplexityContext,
): ComplexityResult {
  let score = 1;
  const children: ComplexityResult[] = [];
  const metadata: Record<string, unknown> = {};

  // ループの種類に基づいて処理
  if (ts.isForStatement(statement)) {
    metadata.loopType = "for";

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

    // for文自体の複雑さ
    score += 1;
  } else if (ts.isForOfStatement(statement) || ts.isForInStatement(statement)) {
    metadata.loopType = ts.isForOfStatement(statement) ? "for-of" : "for-in";

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

    // for-of/for-in文自体の複雑さ
    score += 0.8;
  } else if (ts.isWhileStatement(statement)) {
    metadata.loopType = "while";

    // 条件式の複雑さ
    const conditionComplexity = calculateExpressionComplexity(
      statement.expression,
      context,
    );
    children.push(conditionComplexity);
    score += conditionComplexity.score;

    // while文自体の複雑さ
    score += 0.8;
  } else if (ts.isDoStatement(statement)) {
    metadata.loopType = "do-while";

    // 条件式の複雑さ
    const conditionComplexity = calculateExpressionComplexity(
      statement.expression,
      context,
    );
    children.push(conditionComplexity);
    score += conditionComplexity.score;

    // do-while文自体の複雑さ
    score += 1;
  }

  // 本体の複雑さ（すべてのループタイプに共通）
  const bodyComplexity = calculateStatementComplexity(
    statement.statement,
    context,
  );
  children.push(bodyComplexity);
  score += bodyComplexity.score;

  return {
    score,
    nodeType: ts.SyntaxKind[statement.kind],
    children,
    lineInfo: getNodeLineInfo(statement, context.sourceFile),
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}

/**
 * 文の種類に基づいて適切な計算関数を選択する
 * @param statement 文
 * @param context 複雑度計算コンテキスト
 * @returns 計算関数
 */
function selectStatementCalculator(
  statement: ts.Statement,
  context: ComplexityContext,
): () => ComplexityResult {
  // 式文
  if (ts.isExpressionStatement(statement)) {
    return () => calculateExpressionStatementNodeComplexity(statement, context);
  } // 変数宣言
  else if (ts.isVariableStatement(statement)) {
    return () => calculateVariableStatementNodeComplexity(statement, context);
  } // if文
  else if (ts.isIfStatement(statement)) {
    return () => calculateIfStatementNodeComplexity(statement, context);
  } // ループ文
  else if (
    ts.isForStatement(statement) ||
    ts.isForOfStatement(statement) ||
    ts.isForInStatement(statement) ||
    ts.isWhileStatement(statement) ||
    ts.isDoStatement(statement)
  ) {
    return () => calculateLoopStatementNodeComplexity(statement, context);
  } // その他の文タイプ（デフォルト）
  else {
    return () => {
      let score = 1;
      const children: ComplexityResult[] = [];

      // ブロック文
      if (ts.isBlock(statement)) {
        const blockComplexity = calculateBlockComplexity(statement, context);
        children.push(blockComplexity);
        score += blockComplexity.score;
      }

      return {
        score,
        nodeType: ts.SyntaxKind[statement.kind],
        children,
        lineInfo: getNodeLineInfo(statement, context.sourceFile),
      };
    };
  }
}

/**
 * ノードの複雑度を計算する
 * @param statement 文
 * @param context 複雑度計算コンテキスト
 * @returns 複雑度計算結果
 */
function calculateStatementNodeComplexity(
  statement: ts.Statement,
  context: ComplexityContext,
): ComplexityResult {
  // 再帰探索のための深度を増やす
  context.currentDepth++;

  try {
    // 文の種類に基づいて適切な計算関数を選択して実行
    const calculator = selectStatementCalculator(statement, context);
    return calculator();
  } finally {
    // 再帰探索のための深度を戻す（例外が発生しても確実に実行）
    context.currentDepth--;
  }
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

  // 宣言の数をカウント
  const declarationCount = statement.declarationList.declarations.length;

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
    // let宣言の数に応じて複雑度を乗算
    const letMultiplier = 1 + (declarationCount * 0.5);
    score *= letMultiplier;
    metadata.mutable = true;
    metadata.letDeclarationCount = declarationCount;
    metadata.letMultiplier = letMultiplier;
  }

  metadata.declarationCount = declarationCount;

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
