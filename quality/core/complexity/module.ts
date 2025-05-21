/**
 * コード品質計算モジュールの複雑度計算 - モジュール関連
 *
 * このファイルでは、TypeScriptモジュールの複雑度を計算するための機能を提供します。
 * モジュール間の依存関係を解析し、トポロジカルソートを使用して依存関係が少ない順にモジュールを並べ、
 * 各モジュールについて依存先の複雑度を再帰的に足し合わせます。
 */

// TypeScriptコンパイラを使用
import ts from "npm:typescript";
import {
  type ComplexityOptions,
  type ComplexityResult,
  DEFAULT_COMPLEXITY_OPTIONS,
} from "./common.ts";
import { calculateFileComplexity } from "./file.ts";

/**
 * モジュールの依存関係情報
 */
export interface ModuleDependency {
  // モジュールのパス
  path: string;
  // 依存先のモジュールパス
  dependencies: string[];
  // ファイルの複雑度
  fileComplexity?: ComplexityResult;
  // モジュールの複雑度（依存先を含む）
  moduleComplexity?: number;
  // 訪問済みフラグ（トポロジカルソート用）
  visited?: boolean;
  // 一時訪問フラグ（循環依存検出用）
  temporaryMark?: boolean;
}

/**
 * モジュールの複雑度計算結果
 */
export interface ModuleComplexityResult {
  // モジュールのパス
  path: string;
  // ファイル単体の複雑度
  fileComplexity: number;
  // モジュールの複雑度（依存先を含む）
  moduleComplexity: number;
  // 依存先のモジュール
  dependencies: string[];
  // 詳細情報
  details?: ComplexityResult;
}

/**
 * モジュールの依存関係を解析する
 * @param sourceFile ソースファイル
 * @param filePath ファイルパス
 * @returns 依存先のモジュールパスの配列
 */
/**
 * モジュールの依存関係を解析する
 * @param sourceFile ソースファイル
 * @param filePath ファイルパス
 * @returns 依存先のモジュールパスの配列
 */
/**
 * インポート宣言から依存関係を抽出する
 * @param statement ステートメント
 * @param filePath 現在のファイルパス
 * @returns 依存先のパス（相対パスの場合のみ）
 */
function extractDependencyFromImport(
  statement: ts.ImportDeclaration,
  filePath: string,
): string | null {
  const moduleSpecifier = statement.moduleSpecifier;

  // 文字列リテラルでない場合はスキップ
  if (!ts.isStringLiteral(moduleSpecifier)) {
    return null;
  }

  const importPath = moduleSpecifier.text;

  // 相対パスのインポートのみ処理（外部モジュールは除外）
  if (!importPath.startsWith(".")) {
    return null;
  }

  // 相対パスを絶対パスに変換
  return resolveImportPath(filePath, importPath);
}

/**
 * モジュールの依存関係を解析する
 * @param sourceFile ソースファイル
 * @param filePath ファイルパス
 * @returns 依存先のモジュールパスの配列
 */
export function analyzeDependencies(
  sourceFile: ts.SourceFile,
  filePath: string,
): string[] {
  const dependencies: string[] = [];

  // インポート宣言を検索
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) {
      continue;
    }

    const dependency = extractDependencyFromImport(statement, filePath);
    if (dependency) {
      dependencies.push(dependency);
    }
  }

  return dependencies;
}

/**
 * モジュールのインポート情報を解析する
 * @param sourceFile ソースファイル
 * @returns インポート情報 {ライブラリインポート数, ローカルインポート数}
 */
/**
 * インポート宣言からインポートされたシンボル数を計算する
 * @param importClause インポート句
 * @returns インポートされたシンボル数
 */
function countImportedSymbols(
  importClause: ts.ImportClause | undefined,
): number {
  if (!importClause) {
    return 0;
  }

  let count = 0;

  // デフォルトインポート
  if (importClause.name) {
    count += 1;
  }

  // 名前付きインポートと名前空間インポート
  if (importClause.namedBindings) {
    if (ts.isNamedImports(importClause.namedBindings)) {
      // 名前付きインポート
      count += importClause.namedBindings.elements.length;
    } else if (ts.isNamespaceImport(importClause.namedBindings)) {
      // 名前空間インポート
      count += 1;
    }
  }

  return count;
}

/**
 * モジュールのインポート情報を解析する
 * @param sourceFile ソースファイル
 * @returns インポート情報 {ライブラリインポート数, ローカルインポート数}
 */
export function analyzeImports(
  sourceFile: ts.SourceFile,
): { libraryImports: number; localImports: number } {
  let libraryImports = 0;
  let localImports = 0;

  // インポート宣言を検索
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) {
      continue;
    }

    const moduleSpecifier = statement.moduleSpecifier;
    if (!ts.isStringLiteral(moduleSpecifier)) {
      continue;
    }

    const importPath = moduleSpecifier.text;
    const symbolCount = countImportedSymbols(statement.importClause);

    // インポート種別を判定
    if (importPath.startsWith(".")) {
      // ローカルインポート（相対パス）
      localImports += symbolCount;
    } else {
      // ライブラリインポート（絶対パス）
      libraryImports += symbolCount;
    }
  }

  return { libraryImports, localImports };
}

/**
 * インポートパスを解決する
 * @param basePath 基準となるファイルパス
 * @param importPath インポートパス
 * @returns 解決されたパス
 */
function resolveImportPath(basePath: string, importPath: string): string {
  // ディレクトリパスを取得
  const baseDir = basePath.substring(0, basePath.lastIndexOf("/") + 1);

  // 相対パスを結合
  let resolvedPath = baseDir + importPath;

  // パスを正規化（./や../を解決）
  resolvedPath = normalizePath(resolvedPath);

  // 拡張子がない場合は.tsを追加
  if (!resolvedPath.endsWith(".ts") && !resolvedPath.endsWith(".js")) {
    resolvedPath += ".ts";
  }

  // index.tsの省略形対応
  if (resolvedPath.endsWith("/")) {
    resolvedPath += "index.ts";
  }

  return resolvedPath;
}

/**
 * パスを正規化する（./や../を解決）
 * @param path 正規化するパス
 * @returns 正規化されたパス
 */
function normalizePath(path: string): string {
  const parts = path.split("/");
  const result: string[] = [];

  for (const part of parts) {
    if (part === "." || part === "") {
      // 現在のディレクトリを表す "." や空の部分はスキップ
      continue;
    } else if (part === "..") {
      // 親ディレクトリを表す ".." は、結果の最後の要素を削除
      result.pop();
    } else {
      // それ以外の部分はそのまま追加
      result.push(part);
    }
  }

  return result.join("/");
}

/**
 * トポロジカルソートを実行する
 * @param modules モジュールの依存関係情報の配列
 * @returns ソートされたモジュールの配列
 */
/**
 * モジュールの訪問状態を初期化する
 * @param modules モジュールの配列
 * @returns モジュールのマップ
 */
function initializeModuleMap(
  modules: ModuleDependency[],
): Map<string, ModuleDependency> {
  const moduleMap = new Map<string, ModuleDependency>();

  for (const module of modules) {
    moduleMap.set(module.path, module);
    // 訪問フラグを初期化
    module.visited = false;
    module.temporaryMark = false;
  }

  return moduleMap;
}

/**
 * 循環参照を検出して依存関係から除外する
 * @param module 現在のモジュール
 * @param depPath 依存先のパス
 * @param depModule 依存先のモジュール
 * @returns 循環参照が検出されたかどうか
 */
function handleCircularDependency(
  module: ModuleDependency,
  depPath: string,
  depModule: ModuleDependency,
): boolean {
  if (depModule.temporaryMark) {
    // 循環参照を依存関係から除外
    module.dependencies = module.dependencies.filter((p) => p !== depPath);
    return true;
  }
  return false;
}

/**
 * モジュールを再帰的に訪問する（DFS）
 * @param module 現在のモジュール
 * @param moduleMap モジュールのマップ
 * @param result 結果配列
 */
function visitModule(
  module: ModuleDependency,
  moduleMap: Map<string, ModuleDependency>,
  result: ModuleDependency[],
): void {
  // 早期リターン条件
  if (module.temporaryMark || module.visited) {
    return;
  }

  // 一時マークを設定
  module.temporaryMark = true;

  // 依存先を再帰的に訪問
  for (const depPath of module.dependencies) {
    const depModule = moduleMap.get(depPath);
    if (!depModule) {
      continue;
    }

    // 循環参照を検出した場合は、依存関係から除外してスキップ
    if (handleCircularDependency(module, depPath, depModule)) {
      continue;
    }

    visitModule(depModule, moduleMap, result);
  }

  // 訪問完了
  module.visited = true;
  module.temporaryMark = false;

  // 結果に追加
  result.push(module);
}

/**
 * トポロジカルソートを実行する
 * @param modules モジュールの依存関係情報の配列
 * @returns ソートされたモジュールの配列
 */
export function topologicalSort(
  modules: ModuleDependency[],
): ModuleDependency[] {
  const result: ModuleDependency[] = [];
  const moduleMap = initializeModuleMap(modules);

  // 各モジュールに対してDFSを実行
  for (const module of modules) {
    if (!module.visited) {
      visitModule(module, moduleMap, result);
    }
  }

  // 結果を反転（依存関係が少ない順）
  return result.reverse();
}

/**
 * モジュールの複雑度を計算する
 * @param modules ソート済みのモジュールの配列
 * @returns 複雑度が計算されたモジュールの配列
 */
export function calculateModuleComplexity(
  modules: ModuleDependency[],
): ModuleDependency[] {
  const moduleMap = new Map<string, ModuleDependency>();
  const calculatedModules = new Set<string>(); // 計算済みモジュールを追跡
  const processingModules = new Set<string>(); // 現在計算中のモジュールを追跡（循環参照検出用）
  const maxDepth = 10; // 最大再帰深度（無限ループ防止）

  // モジュールをマップに登録し、初期値を設定
  modules.forEach((module) => {
    moduleMap.set(module.path, module);
    // 初期値として、ファイル単体の複雑度を設定
    if (module.fileComplexity) {
      module.moduleComplexity = module.fileComplexity.score;
    } else {
      module.moduleComplexity = 0;
    }
  });

  // 再帰的に依存モジュールの複雑度を計算する関数
  // 早期リターン条件をチェックする関数
  function shouldReturnEarly(
    module: ModuleDependency,
    depth: number,
  ): number | null {
    // 最大再帰深度を超えた場合は現在の値を返す（無限ループ防止）
    if (depth > maxDepth) {
      return module.moduleComplexity || 0;
    }

    // ファイル単体の複雑度がまだ計算されていない場合は0を返す
    if (!module.fileComplexity) {
      return 0;
    }

    // すでに計算済みの場合はその値を返す
    if (calculatedModules.has(module.path)) {
      return module.moduleComplexity || 0;
    }

    // 循環参照を検出した場合は、現在の値を返す（これ以上深く計算しない）
    if (processingModules.has(module.path)) {
      return module.moduleComplexity || 0;
    }

    // 早期リターン条件に該当しない場合はnullを返す
    return null;
  }

  // ファイルの複雑度を計算する関数
  function calculateFileNodeComplexity(module: ModuleDependency): number {
    if (!module.fileComplexity) {
      return 0;
    }

    // 子ノードの複雑度を累積
    let complexity = module.fileComplexity.score;

    // 子ノードの複雑度を加算
    for (const child of module.fileComplexity.children) {
      complexity += child.score;
    }

    return complexity;
  }

  // 依存先の複雑度を計算する関数
  function calculateDependenciesComplexity(
    module: ModuleDependency,
    depth: number,
  ): number {
    let dependencyComplexity = 0;

    // 依存先の複雑度を加算
    for (const depPath of module.dependencies) {
      const depModule = moduleMap.get(depPath);
      if (!depModule || processingModules.has(depPath)) {
        continue;
      }

      // 依存先の複雑度を再帰的に計算（深度を増やす）
      const depComplexity = calculateDependencyComplexity(
        depModule,
        depth + 1,
      );

      // 依存先の複雑度を累積
      dependencyComplexity += depComplexity;
    }

    return dependencyComplexity;
  }

  // メイン関数
  function calculateDependencyComplexity(
    module: ModuleDependency,
    depth = 0,
  ): number {
    // 早期リターン条件をチェック
    const earlyReturnValue = shouldReturnEarly(module, depth);
    if (earlyReturnValue !== null) {
      return earlyReturnValue;
    }

    // 計算中としてマーク
    processingModules.add(module.path);

    // ファイル単体の複雑度を計算
    const complexity = calculateFileNodeComplexity(module);

    // 依存先の複雑度を計算
    const dependencyComplexity = calculateDependenciesComplexity(module, depth);

    // 計算中マークを解除
    processingModules.delete(module.path);

    // 最終的な複雑度を計算
    let finalComplexity = complexity;

    // 依存先の複雑度の一部を加算（重み付け）
    // 依存モジュールが多いほど複雑度が過大評価されないように調整
    if (module.dependencies.length > 0) {
      finalComplexity += dependencyComplexity * 0.5 /
        Math.sqrt(module.dependencies.length);
    }

    // モジュールの複雑度を設定
    module.moduleComplexity = finalComplexity;
    calculatedModules.add(module.path);

    return finalComplexity;
  }

  // 各モジュールの複雑度を計算（トポロジカルソート順）
  // 依存関係が少ない順に計算するため、配列を逆順に処理
  for (const module of [...modules].reverse()) {
    if (!calculatedModules.has(module.path)) {
      calculateDependencyComplexity(module);
    }
  }

  return modules;
}

/**
 * ファイルの複雑度を計算する
 * @param filePath ファイルパス
 * @param code ファイルの内容
 * @param options 複雑度計算オプション
 * @returns 複雑度計算結果
 */
export function calculateModuleFileComplexity(
  filePath: string,
  code: string,
  options: ComplexityOptions = DEFAULT_COMPLEXITY_OPTIONS,
): ComplexityResult {
  // ソースファイルを作成
  const sourceFile = ts.createSourceFile(
    filePath,
    code,
    ts.ScriptTarget.Latest,
    true,
  );

  // インポート情報を解析
  const { libraryImports, localImports } = analyzeImports(sourceFile);

  // ファイル全体の複雑度を計算
  const result = calculateFileComplexity(sourceFile, options);

  // インポートに基づく複雑度を追加
  const importComplexity = (libraryImports * 3) + (localImports * 1);
  result.score += importComplexity;

  // let宣言の数に応じて複雑度を乗算
  let letDeclarationCount = 0;

  // ソースファイル内のlet宣言を検索
  function countLetDeclarations(node: ts.Node) {
    if (
      ts.isVariableStatement(node) &&
      (node.declarationList.flags & ts.NodeFlags.Let) !== 0
    ) {
      letDeclarationCount += node.declarationList.declarations.length;
    }

    ts.forEachChild(node, countLetDeclarations);
  }

  countLetDeclarations(sourceFile);

  // let宣言の数に応じて複雑度を乗算
  if (letDeclarationCount > 0) {
    const letMultiplier = 1 + (letDeclarationCount * 0.5);
    result.score *= letMultiplier;

    // メタデータにlet宣言情報を追加
    if (!result.metadata) {
      result.metadata = {};
    }
    result.metadata.letDeclarationCount = letDeclarationCount;
    result.metadata.letMultiplier = letMultiplier;
  }

  // メタデータにインポート情報を追加
  if (!result.metadata) {
    result.metadata = {};
  }
  result.metadata.libraryImports = libraryImports;
  result.metadata.localImports = localImports;
  result.metadata.importComplexity = importComplexity;

  return result;
}

/**
 * 複数のモジュールの複雑度を計算する
 * @param filePaths ファイルパスの配列
 * @param fileContents ファイル内容のマップ
 * @param options 複雑度計算オプション
 * @returns モジュールの複雑度計算結果の配列
 */
/**
 * ファイルからモジュール依存関係情報を作成する
 * @param filePath ファイルパス
 * @param content ファイル内容
 * @param options 複雑度計算オプション
 * @returns モジュール依存関係情報
 */
function createModuleDependency(
  filePath: string,
  content: string,
  options: ComplexityOptions,
): ModuleDependency {
  // ソースファイルを作成
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
  );

  // 依存関係を解析
  const dependencies = analyzeDependencies(sourceFile, filePath);

  // ファイルの複雑度を計算
  const fileComplexity = calculateModuleFileComplexity(
    filePath,
    content,
    options,
  );

  // モジュール情報を作成
  return {
    path: filePath,
    dependencies,
    fileComplexity,
    moduleComplexity: fileComplexity.score, // 初期値として設定
  };
}

/**
 * 依存関係を解決する（存在しない依存先を削除）
 * @param modules モジュールの配列
 * @param moduleMap モジュールのマップ
 */
function resolveDependencies(
  modules: ModuleDependency[],
  moduleMap: Map<string, ModuleDependency>,
): void {
  for (const module of modules) {
    // 依存先のモジュールが存在するか確認し、存在しない場合は依存リストから削除
    module.dependencies = module.dependencies.filter((depPath) =>
      moduleMap.has(depPath)
    );
  }
}

/**
 * モジュール複雑度計算結果を作成する
 * @param module モジュール依存関係情報
 * @returns モジュール複雑度計算結果
 */
function createModuleComplexityResult(
  module: ModuleDependency,
): ModuleComplexityResult {
  return {
    path: module.path,
    fileComplexity: module.fileComplexity?.score || 0,
    moduleComplexity: module.moduleComplexity || 0,
    dependencies: module.dependencies,
    details: module.fileComplexity,
  };
}

/**
 * 複数のモジュールの複雑度を計算する
 * @param filePaths ファイルパスの配列
 * @param fileContents ファイル内容のマップ
 * @param options 複雑度計算オプション
 * @returns モジュールの複雑度計算結果の配列
 */
export function calculateModulesComplexity(
  filePaths: string[],
  fileContents: Map<string, string>,
  options: ComplexityOptions = DEFAULT_COMPLEXITY_OPTIONS,
): ModuleComplexityResult[] {
  // モジュールの依存関係情報を作成
  const modules: ModuleDependency[] = [];
  const moduleMap = new Map<string, ModuleDependency>();

  // 各ファイルの依存関係を解析
  for (const filePath of filePaths) {
    const content = fileContents.get(filePath);
    if (!content) {
      continue;
    }

    const module = createModuleDependency(filePath, content, options);
    modules.push(module);
    moduleMap.set(filePath, module);
  }

  // 依存関係の解決（存在しない依存先を削除）
  resolveDependencies(modules, moduleMap);

  // トポロジカルソートを実行
  const sortedModules = topologicalSort(modules);

  // モジュールの複雑度を計算（依存関係が少ない順に計算）
  const modulesWithComplexity = calculateModuleComplexity(sortedModules);

  // 結果を整形
  return modulesWithComplexity.map(createModuleComplexityResult);
}

/**
 * モジュールの複雑度レポートを生成する
 * @param results モジュールの複雑度計算結果の配列
 * @returns フォーマットされたレポート文字列
 */
export function generateModuleComplexityReport(
  results: ModuleComplexityResult[],
): string {
  let report = "";

  // 複雑度でソート（降順）
  const sortedResults = [...results].sort(
    (a, b) => b.moduleComplexity - a.moduleComplexity,
  );

  const maxModuleComplexity = Math.max(
    ...results.map((result) => result.moduleComplexity),
  );
  console.log("maxModuleComplexity:", maxModuleComplexity);

  // 各モジュールのレポートを生成（単純化されたフォーマット）
  sortedResults.forEach((result) => {
    // 依存先の複雑度の合計を計算
    report += `${result.path} file:${
      Math.round(result.fileComplexity)
    } module:${Math.round(result.moduleComplexity)}\n`;
  });

  return report;
}
