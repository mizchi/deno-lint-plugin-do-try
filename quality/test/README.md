# コード品質計算モジュールのテスト

このディレクトリには、コード品質計算モジュールの統合テストが含まれています。

## テストの目的

これらのテストは、コード品質計算モジュールが以下の点で正しく動作することを検証します：

1. if の組み合わせが変数シンボルに比例して点が悪化すること
2. switch に関する複雑度計算が正しく行われること

テストは決定的なスコアのテストではなく、コード A とコード B のどちらが良いかを比較するテストです。例えば、「if の数が増えるとスコアが悪化する」「switch の方がネストした if よりも良い」などの比較を行います。

## テストの構造

- `if-matrix.test.ts`: if の組み合わせに関するテスト

  - 単一の if と複数の if の比較
  - ネストなしの if とネストありの if の比較
  - 変数の数が少ない if と多い if の比較
  - 条件式が単純な if と複雑な if の比較
  - 論理演算子の数が少ない if と多い if の比較
  - 否定演算子の数が少ない if と多い if の比較
  - 変数の変更可能性が低いコードと高いコードの比較

- `switch-matrix.test.ts`: switch に関するテスト
  - 単一の switch と同等の複数の if の比較
  - 単純な switch と複雑な switch の比較
  - switch と if-else チェーンの比較
  - case の数が少ない switch と多い switch の比較
  - 単純な case 処理と複雑な case 処理の比較
  - フォールスルーなしの switch とフォールスルーありの switch の比較

各テストファイルには、複数のテストケースが含まれており、それぞれのケースでは 2 つのコードを比較し、どちらが良いかを検証しています。

## テストの実装方法

各テストケースでは、以下の手順でコードの比較を行っています：

1. 比較対象のコード A（良いとされるコード）を定義
2. 比較対象のコード B（悪いとされるコード）を定義
3. `compareCodeComplexity`関数を使用して 2 つのコードを比較
4. 比較結果が期待通りであることを検証（例：コード A の方が良いことを期待）

テストヘルパー関数`assertCodeComparison`を使用して、コードの比較と検証を簡潔に記述しています。

## テストの実行方法

以下のコマンドを使用してテストを実行できます：

```bash
deno test test/
```

特定のテストファイルのみを実行する場合は、以下のようにします：

```bash
deno test test/if-matrix.test.ts
deno test test/switch-matrix.test.ts
```

## 結果の解釈

テストが成功した場合、すべてのテストケースが期待通りの結果を返したことを意味します。つまり、コード品質計算モジュールが以下の点で正しく動作していることが確認できます：

1. if の組み合わせが変数シンボルに比例して点が悪化する
2. ネストした if はネストしていない if よりも複雑度が高い
3. 条件式が複雑な if は単純な if よりも複雑度が高い
4. switch は同等の複数の if よりも複雑度が低い
5. case の数が多い switch は少ない switch よりも複雑度が高い

テストが失敗した場合は、期待される結果と実際の結果が一致しなかったことを意味します。その場合は、コード品質計算モジュールの実装を見直す必要があります。
