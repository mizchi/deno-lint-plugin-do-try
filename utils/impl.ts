function hasNodeParent(
  node: Deno.lint.Node,
): node is Deno.lint.Node & { parent: Deno.lint.Node } {
  return "parent" in node;
}

// try-catchブロック内にあるかどうかを確認する関数
export function isInsideTryCatch(node: Deno.lint.Node): boolean {
  let current: Deno.lint.Node | undefined = node;
  while (current) {
    if (!hasNodeParent(current)) {
      return false;
    }
    // TryStatementを見つけたら、try-catch内にあると判断
    if (current.type === "TryStatement") {
      return true;
    }
    if (
      current.type === "FunctionExpression" ||
      current.type === "ArrowFunctionExpression" ||
      current.type === "FunctionDeclaration"
    ) {
      return false;
    }
    current = current.parent;
  }
  return false;
}

// 関数名を取得する共通関数
export function getFunctionName(callee: Deno.lint.Node): string {
  // 直接呼び出し（例：doSomething()）
  if (callee.type === "Identifier") {
    return callee.name;
  } // メソッド呼び出し（例：obj.doMethod()）
  else if (
    callee.type === "MemberExpression" &&
    callee.property.type === "Identifier"
  ) {
    return callee.property.name;
  }
  return "";
}

// doで始まる関数のチェックと報告を行う共通関数
