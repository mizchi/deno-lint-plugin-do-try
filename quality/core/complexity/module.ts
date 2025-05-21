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
  ComplexityContext,
  ComplexityOptions,
  ComplexityResult,
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
export function analyzeDependencies(
  sourceFile: ts.SourceFile,
  filePath: string,
): string[] {
  const dependencies: string[] = [];

  // インポート宣言を検索
  sourceFile.statements.forEach((statement) => {
    if (ts.isImportDeclaration(statement)) {
      const moduleSpecifier = statement.moduleSpecifier;

      // 文字列リテラルの場合のみ処理
      if (ts.isStringLiteral(moduleSpecifier)) {
        const importPath = moduleSpecifier.text;

        // 相対パスのインポートのみ処理（外部モジュールは除外）
        if (importPath.startsWith(".")) {
          // 相対パスを絶対パスに変換
          const absolutePath = resolveImportPath(filePath, importPath);
          dependencies.push(absolutePath);
        }
      }
    }
  });

  return dependencies;
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
  sourceFile.statements.forEach((statement) => {
    if (ts.isImportDeclaration(statement)) {
      const moduleSpecifier = statement.moduleSpecifier;

      // 文字列リテラルの場合のみ処理
      if (ts.isStringLiteral(moduleSpecifier)) {
        const importPath = moduleSpecifier.text;

        // インポート種別を判定
        if (importPath.startsWith(".")) {
          // ローカルインポート（相対パス）
          // インポートされたシンボル数をカウント
          if (statement.importClause) {
            if (statement.importClause.name) {
              // デフォルトインポート
              localImports += 1;
            }
            if (statement.importClause.namedBindings) {
              if (ts.isNamedImports(statement.importClause.namedBindings)) {
                // 名前付きインポート
                localImports +=
                  statement.importClause.namedBindings.elements.length;
              } else if (
                ts.isNamespaceImport(statement.importClause.namedBindings)
              ) {
                // 名前空間インポート
                localImports += 1;
              }
            }
          }
        } else {
          // ライブラリインポート（絶対パス）
          // インポートされたシンボル数をカウント
          if (statement.importClause) {
            if (statement.importClause.name) {
              // デフォルトインポート
              libraryImports += 1;
            }
            if (statement.importClause.namedBindings) {
              if (ts.isNamedImports(statement.importClause.namedBindings)) {
                // 名前付きインポート
                libraryImports +=
                  statement.importClause.namedBindings.elements.length;
              } else if (
                ts.isNamespaceImport(statement.importClause.namedBindings)
              ) {
                // 名前空間インポート
                libraryImports += 1;
              }
            }
          }
        }
      }
    }
  });

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
export function topologicalSort(
  modules: ModuleDependency[],
): ModuleDependency[] {
  const result: ModuleDependency[] = [];
  const moduleMap = new Map<string, ModuleDependency>();

  // モジュールをマップに登録
  modules.forEach((module) => {
    moduleMap.set(module.path, module);
    // 訪問フラグを初期化
    module.visited = false;
    module.temporaryMark = false;
  });

  // 各モジュールに対してDFSを実行
  modules.forEach((module) => {
    if (!module.visited) {
      visitModule(module, moduleMap, result);
    }
  });

  // 結果を反転（依存関係が少ない順）
  return result.reverse();
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
  // 循環依存のチェック
  if (module.temporaryMark) {
    // 循環依存の場合は処理を中断
    return;
  }

  // 既に訪問済みの場合はスキップ
  if (module.visited) {
    return;
  }

  // 一時マークを設定
  module.temporaryMark = true;

  // 依存先を再帰的に訪問
  for (const depPath of module.dependencies) {
    const depModule = moduleMap.get(depPath);
    if (depModule) {
      // 循環参照を検出した場合は、依存関係から除外
      if (depModule.temporaryMark) {
        // 循環参照を依存関係から除外
        module.dependencies = module.dependencies.filter((p) => p !== depPath);
        continue;
      }
      visitModule(depModule, moduleMap, result);
    }
  }

  // 訪問完了
  module.visited = true;
  module.temporaryMark = false;

  // 結果に追加
  result.push(module);
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
  function calculateDependencyComplexity(
    module: ModuleDependency,
    depth = 0,
  ): number {
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

    // 計算中としてマーク
    processingModules.add(module.path);

    // ファイル単体の複雑度
    let complexity = 0;

    // ファイルの複雑度を再帰的に計算（子ノードの複雑度も含める）
    if (module.fileComplexity) {
      // 子ノードの複雑度を累積
      complexity = module.fileComplexity.score;

      // 子ノードの複雑度を再帰的に加算
      for (const child of module.fileComplexity.children) {
        complexity += child.score;
      }
    }

    let dependencyComplexity = 0;

    // 依存先の複雑度を加算
    for (const depPath of module.dependencies) {
      const depModule = moduleMap.get(depPath);
      if (depModule) {
        // 循環参照を検出した場合は、依存関係から除外
        if (processingModules.has(depPath)) {
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
    }

    // 計算中マークを解除
    processingModules.delete(module.path);

    // 依存先の複雑度の一部を加算（重み付け）
    // 依存モジュールが多いほど複雑度が過大評価されないように調整
    if (module.dependencies.length > 0) {
      complexity += dependencyComplexity * 0.5 /
        Math.sqrt(module.dependencies.length);
    }

    // モジュールの複雑度を設定
    module.moduleComplexity = complexity;
    calculatedModules.add(module.path);

    return complexity;
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
export function calculateModulesComplexity(
  filePaths: string[],
  fileContents: Map<string, string>,
  options: ComplexityOptions = DEFAULT_COMPLEXITY_OPTIONS,
): ModuleComplexityResult[] {
  // モジュールの依存関係情報を作成
  const modules: ModuleDependency[] = [];
  const moduleMap = new Map<string, ModuleDependency>();

  // 各ファイルの依存関係を解析
  filePaths.forEach((filePath) => {
    const content = fileContents.get(filePath);
    if (!content) {
      return;
    }

    // ソースファイルを作成
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
    );

    // 依存関係を解析
    const dependencies = analyzeDependencies(sourceFile, filePath);

    // ファイルの複雑度を計算（モジュールファイル複雑度計算を使用）
    const fileComplexity = calculateModuleFileComplexity(
      filePath,
      content,
      options,
    );

    // モジュール情報を作成
    const module: ModuleDependency = {
      path: filePath,
      dependencies,
      fileComplexity,
      moduleComplexity: fileComplexity.score, // 初期値として設定
    };

    // モジュール情報を追加
    modules.push(module);
    moduleMap.set(filePath, module);
  });

  // 依存関係の解決（相対パスを絶対パスに変換）
  modules.forEach((module) => {
    // 依存先のモジュールが存在するか確認し、存在しない場合は依存リストから削除
    module.dependencies = module.dependencies.filter((depPath) => {
      return moduleMap.has(depPath);
    });
  });

  // トポロジカルソートを実行
  const sortedModules = topologicalSort(modules);

  // モジュールの複雑度を計算（依存関係が少ない順に計算）
  const modulesWithComplexity = calculateModuleComplexity(sortedModules);

  // 結果を整形
  return modulesWithComplexity.map((module) => ({
    path: module.path,
    fileComplexity: module.fileComplexity?.score || 0,
    moduleComplexity: module.moduleComplexity || 0,
    dependencies: module.dependencies,
    details: module.fileComplexity,
  }));
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

  // 各モジュールのレポートを生成（単純化されたフォーマット）
  sortedResults.forEach((result) => {
    // 依存先の複雑度の合計を計算
    report += `${result.path} file:${
      Math.round(result.fileComplexity)
    } module:${Math.round(result.moduleComplexity)}\n`;
  });

  return report;
}
