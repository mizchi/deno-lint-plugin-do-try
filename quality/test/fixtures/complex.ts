/**
 * complex.ts
 *
 * このファイルは非常に複雑なコードサンプルを提供します。
 * 複雑なクラス階層、多数の関数と複雑な相互作用、深いネストの条件分岐、
 * 複雑なエラーハンドリング、状態管理、非同期処理、複雑なデータ変換などを含みます。
 */

// 型定義
export type DataRecord = {
  id: string;
  name: string;
  value: number;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  status: "active" | "pending" | "archived" | "deleted";
};

export type FilterOptions = {
  includeArchived?: boolean;
  includeDeleted?: boolean;
  minValue?: number;
  maxValue?: number;
  tags?: string[];
  fromDate?: Date;
  toDate?: Date;
  sortBy?: keyof DataRecord;
  sortDirection?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
};

export type ValidationError = {
  field: string;
  message: string;
  code: string;
};

export type ProcessingResult<T> = {
  success: boolean;
  data?: T;
  error?: Error;
  warnings?: string[];
  processingTime?: number;
  metadata?: Record<string, unknown>;
};

// インターフェース定義
export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export interface Validator<T> {
  validate(data: T): Promise<ValidationResult>;
}

export interface Transformer<T, R> {
  name: string;
  transform(data: T): Promise<R>;
}

export interface ErrorHandler {
  canHandle(error: Error): boolean;
  handle(error: Error): ProcessingResult<unknown>;
}

export interface MetricsCollector {
  recordTransformTime(transformerName: string, timeMs: number): void;
  recordTransformError(transformerName: string): void;
  recordProcessingTime(processorName: string, timeMs: number): void;
  recordProcessingError(processorName: string, errorType: string): void;
  getMetrics(): Record<string, unknown>;
}

// 基本的な抽象クラス
export abstract class DataProcessor<T, R> {
  protected logger: Logger;
  protected config: Record<string, unknown>;
  protected validators: Validator<T>[] = [];
  protected transformers: Transformer<T, any>[] = [];
  protected errorHandlers: ErrorHandler[] = [];
  protected metrics: MetricsCollector;

  constructor(
    logger: Logger,
    config: Record<string, unknown>,
    metrics: MetricsCollector,
  ) {
    this.logger = logger;
    this.config = config;
    this.metrics = metrics;
  }

  abstract process(data: T): Promise<ProcessingResult<R>>;

  protected async validate(data: T): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    for (const validator of this.validators) {
      try {
        const result = await validator.validate(data);
        if (!result.valid) {
          errors.push(...result.errors);
        }
      } catch (error) {
        this.logger.error("Validation error", { error });
        errors.push({
          field: "unknown",
          message: error instanceof Error ? error.message : "Unknown error",
          code: "VALIDATION_ERROR",
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  protected async transform<U>(
    data: T,
    transformer: Transformer<T, U>,
  ): Promise<U> {
    const startTime = Date.now();
    try {
      const result = await transformer.transform(data);
      const endTime = Date.now();
      this.metrics.recordTransformTime(transformer.name, endTime - startTime);
      return result;
    } catch (error) {
      const endTime = Date.now();
      this.metrics.recordTransformError(transformer.name);
      this.logger.error(`Transform error in ${transformer.name}`, { error });
      throw error;
    }
  }

  protected handleError(error: Error): ProcessingResult<R> {
    for (const handler of this.errorHandlers) {
      try {
        if (handler.canHandle(error)) {
          return handler.handle(error) as ProcessingResult<R>;
        }
      } catch (handlerError) {
        this.logger.error("Error in error handler", {
          originalError: error,
          handlerError,
        });
      }
    }

    return {
      success: false,
      error,
    };
  }

  addValidator(validator: Validator<T>): this {
    this.validators.push(validator);
    return this;
  }

  addTransformer<U>(transformer: Transformer<T, U>): this {
    this.transformers.push(transformer as unknown as Transformer<T, any>);
    return this;
  }

  addErrorHandler(handler: ErrorHandler): this {
    this.errorHandlers.push(handler);
    return this;
  }
}

// 具体的な実装クラス
export class ConsoleLogger implements Logger {
  private logLevel: "debug" | "info" | "warn" | "error";

  constructor(logLevel: "debug" | "info" | "warn" | "error" = "info") {
    this.logLevel = logLevel;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog("debug")) {
      console.debug(`[DEBUG] ${message}`, context);
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog("info")) {
      console.info(`[INFO] ${message}`, context);
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog("warn")) {
      console.warn(`[WARN] ${message}`, context);
    }
  }

  error(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog("error")) {
      console.error(`[ERROR] ${message}`, context);
    }
  }

  private shouldLog(level: "debug" | "info" | "warn" | "error"): boolean {
    const levels = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }
}

export class SimpleMetricsCollector implements MetricsCollector {
  private transformTimes: Record<string, number[]> = {};
  private transformErrors: Record<string, number> = {};
  private processingTimes: Record<string, number[]> = {};
  private processingErrors: Record<string, Record<string, number>> = {};

  recordTransformTime(transformerName: string, timeMs: number): void {
    if (!this.transformTimes[transformerName]) {
      this.transformTimes[transformerName] = [];
    }
    this.transformTimes[transformerName].push(timeMs);
  }

  recordTransformError(transformerName: string): void {
    this.transformErrors[transformerName] =
      (this.transformErrors[transformerName] || 0) + 1;
  }

  recordProcessingTime(processorName: string, timeMs: number): void {
    if (!this.processingTimes[processorName]) {
      this.processingTimes[processorName] = [];
    }
    this.processingTimes[processorName].push(timeMs);
  }

  recordProcessingError(processorName: string, errorType: string): void {
    if (!this.processingErrors[processorName]) {
      this.processingErrors[processorName] = {};
    }
    this.processingErrors[processorName][errorType] =
      (this.processingErrors[processorName][errorType] || 0) + 1;
  }

  getMetrics(): Record<string, unknown> {
    const transformerStats: Record<string, unknown> = {};
    for (const [name, times] of Object.entries(this.transformTimes)) {
      const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
      transformerStats[name] = {
        count: times.length,
        avgTime: avg,
        minTime: Math.min(...times),
        maxTime: Math.max(...times),
        errors: this.transformErrors[name] || 0,
      };
    }

    const processorStats: Record<string, unknown> = {};
    for (const [name, times] of Object.entries(this.processingTimes)) {
      const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
      processorStats[name] = {
        count: times.length,
        avgTime: avg,
        minTime: Math.min(...times),
        maxTime: Math.max(...times),
        errors: this.processingErrors[name] || {},
      };
    }

    return {
      transformers: transformerStats,
      processors: processorStats,
      timestamp: new Date().toISOString(),
    };
  }
}

// バリデータの実装
export class RecordValidator implements Validator<DataRecord> {
  async validate(record: DataRecord): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // ID検証
    if (!record.id || record.id.trim() === "") {
      errors.push({
        field: "id",
        message: "ID is required",
        code: "REQUIRED_FIELD",
      });
    } else if (!/^[a-zA-Z0-9-_]+$/.test(record.id)) {
      errors.push({
        field: "id",
        message: "ID contains invalid characters",
        code: "INVALID_FORMAT",
      });
    }

    // 名前検証
    if (!record.name || record.name.trim() === "") {
      errors.push({
        field: "name",
        message: "Name is required",
        code: "REQUIRED_FIELD",
      });
    } else if (record.name.length > 100) {
      errors.push({
        field: "name",
        message: "Name is too long (max 100 characters)",
        code: "INVALID_LENGTH",
      });
    }

    // 値検証
    if (typeof record.value !== "number") {
      errors.push({
        field: "value",
        message: "Value must be a number",
        code: "INVALID_TYPE",
      });
    } else if (record.value < 0) {
      errors.push({
        field: "value",
        message: "Value cannot be negative",
        code: "INVALID_VALUE",
      });
    }

    // タグ検証
    if (!Array.isArray(record.tags)) {
      errors.push({
        field: "tags",
        message: "Tags must be an array",
        code: "INVALID_TYPE",
      });
    } else {
      for (let i = 0; i < record.tags.length; i++) {
        const tag = record.tags[i];
        if (typeof tag !== "string") {
          errors.push({
            field: `tags[${i}]`,
            message: "Tag must be a string",
            code: "INVALID_TYPE",
          });
        } else if (tag.trim() === "") {
          errors.push({
            field: `tags[${i}]`,
            message: "Tag cannot be empty",
            code: "INVALID_VALUE",
          });
        }
      }
    }

    // ステータス検証
    if (!["active", "pending", "archived", "deleted"].includes(record.status)) {
      errors.push({
        field: "status",
        message: "Invalid status value",
        code: "INVALID_VALUE",
      });
    }

    // 日付検証
    if (!(record.createdAt instanceof Date)) {
      errors.push({
        field: "createdAt",
        message: "Created date must be a Date object",
        code: "INVALID_TYPE",
      });
      // トランスフォーマーの実装
      class RecordNormalizer implements Transformer<DataRecord, DataRecord> {
        name = "RecordNormalizer";

        async transform(record: DataRecord): Promise<DataRecord> {
          // ディープコピーを作成
          const normalized = JSON.parse(JSON.stringify(record)) as DataRecord;

          // 文字列フィールドの正規化
          normalized.id = normalized.id.trim();
          normalized.name = normalized.name.trim();

          // タグの正規化
          normalized.tags = [
            ...new Set(normalized.tags.map((tag) => tag.trim().toLowerCase())),
          ]
            .filter((tag) => tag !== "");

          // 日付の正規化
          normalized.createdAt = new Date(normalized.createdAt);
          normalized.updatedAt = new Date(normalized.updatedAt);

          // メタデータの正規化
          if (!normalized.metadata) {
            normalized.metadata = {};
          }

          return normalized;
        }
      }

      class RecordEnricher implements Transformer<DataRecord, DataRecord> {
        name = "RecordEnricher";

        async transform(record: DataRecord): Promise<DataRecord> {
          // ディープコピーを作成
          const enriched = JSON.parse(JSON.stringify(record)) as DataRecord;

          // メタデータの充実化
          if (!enriched.metadata.processedAt) {
            enriched.metadata.processedAt = new Date();
          }

          // タグに基づく追加情報
          if (enriched.tags.includes("important")) {
            enriched.metadata.importance = "high";
          } else if (enriched.tags.includes("normal")) {
            enriched.metadata.importance = "medium";
          } else {
            enriched.metadata.importance = "low";
          }

          // 値に基づく分類
          if (enriched.value > 1000) {
            enriched.metadata.valueCategory = "premium";
          } else if (enriched.value > 500) {
            enriched.metadata.valueCategory = "standard";
          } else {
            enriched.metadata.valueCategory = "basic";
          }

          // 非同期操作のシミュレーション
          await new Promise((resolve) => setTimeout(resolve, 50));

          return enriched;
        }
      }

      // エラーハンドラーの実装
      class ValidationErrorHandler implements ErrorHandler {
        canHandle(error: Error): boolean {
          return error.message.includes("Validation");
        }

        handle(error: Error): ProcessingResult<unknown> {
          return {
            success: false,
            error,
            metadata: {
              handledBy: "ValidationErrorHandler",
              recoverable: false,
            },
          };
        }
      }

      class NetworkErrorHandler implements ErrorHandler {
        private retryCount: number;
        private retryDelayMs: number;

        constructor(retryCount: number, retryDelayMs: number) {
          this.retryCount = retryCount;
          this.retryDelayMs = retryDelayMs;
        }

        canHandle(error: Error): boolean {
          return error.message.includes("network") ||
            error.message.includes("timeout") ||
            error.message.includes("connection");
        }

        handle(error: Error): ProcessingResult<unknown> {
          return {
            success: false,
            error,
            metadata: {
              handledBy: "NetworkErrorHandler",
              recoverable: true,
              retryCount: this.retryCount,
              retryDelay: this.retryDelayMs,
            },
          };
        }
      }

      class GenericErrorHandler implements ErrorHandler {
        canHandle(error: Error): boolean {
          return true; // フォールバックハンドラー
        }

        handle(error: Error): ProcessingResult<unknown> {
          return {
            success: false,
            error,
            metadata: {
              handledBy: "GenericErrorHandler",
              recoverable: false,
            },
          };
        }
      }

      // 具体的なデータプロセッサの実装
      class RecordProcessor extends DataProcessor<DataRecord, DataRecord> {
        private cache: Map<string, { record: DataRecord; timestamp: number }> =
          new Map();
        private cacheTimeoutMs: number;
        private retryCount: number;
        private retryDelayMs: number;

        constructor(
          logger: Logger,
          config: Record<string, unknown>,
          metrics: MetricsCollector,
          cacheTimeoutMs = 60000,
          retryCount = 3,
          retryDelayMs = 1000,
        ) {
          super(logger, config, metrics);
          this.cacheTimeoutMs = cacheTimeoutMs;
          this.retryCount = retryCount;
          this.retryDelayMs = retryDelayMs;

          // デフォルトのバリデータとトランスフォーマーを追加
          this.addValidator(new RecordValidator());
          this.addTransformer(new RecordNormalizer());
          this.addTransformer(new RecordEnricher());
          this.addErrorHandler(new ValidationErrorHandler());
          this.addErrorHandler(
            new NetworkErrorHandler(retryCount, retryDelayMs),
          );
          this.addErrorHandler(new GenericErrorHandler());
        }

        async process(
          record: DataRecord,
        ): Promise<ProcessingResult<DataRecord>> {
          const startTime = Date.now();
          let processedRecord = record;
          const warnings: string[] = [];

          try {
            // キャッシュチェック
            const cachedResult = this.checkCache(record.id);
            if (cachedResult) {
              this.logger.debug("Cache hit", { recordId: record.id });
              return {
                success: true,
                data: cachedResult,
                processingTime: 0,
                metadata: { cached: true },
              };
            }

            // バリデーション
            const validationResult = await this.validate(record);
            if (!validationResult.valid) {
              this.metrics.recordProcessingError(
                "RecordProcessor",
                "VALIDATION_ERROR",
              );
              return {
                success: false,
                error: new Error("Validation failed"),
                warnings,
                processingTime: Date.now() - startTime,
                metadata: { validationErrors: validationResult.errors },
              };
            }

            // 複数のトランスフォーメーションを適用
            for (const transformer of this.transformers) {
              try {
                processedRecord = await this.transform(
                  processedRecord,
                  transformer,
                );
              } catch (error) {
                if (
                  error instanceof Error &&
                  error.message.includes("non-critical")
                ) {
                  warnings.push(
                    `Non-critical error in ${transformer.name}: ${error.message}`,
                  );
                  continue;
                }
                throw error;
              }
            }

            // 複雑な条件分岐による追加処理
            if (processedRecord.status === "active") {
              if (processedRecord.value > 1000) {
                if (processedRecord.tags.includes("important")) {
                  await this.doHighPriorityProcessing(processedRecord);
                } else if (processedRecord.tags.includes("urgent")) {
                  await this.doUrgentProcessing(processedRecord);
                } else {
                  await this.doNormalProcessing(processedRecord);
                }
              } else if (processedRecord.value > 500) {
                if (processedRecord.metadata.priority === "high") {
                  await this.doHighPriorityProcessing(processedRecord);
                } else {
                  await this.doNormalProcessing(processedRecord);
                }
              } else {
                await this.doLowPriorityProcessing(processedRecord);
              }
            } else if (processedRecord.status === "pending") {
              await this.doPendingProcessing(processedRecord);
            } else if (processedRecord.status === "archived") {
              if (this.shouldReactivateArchived(processedRecord)) {
                processedRecord.status = "active";
                warnings.push("Archived record was reactivated");
                await this.doReactivationProcessing(processedRecord);
              }
            }

            // キャッシュに保存
            this.updateCache(processedRecord);

            const processingTime = Date.now() - startTime;
            this.metrics.recordProcessingTime(
              "RecordProcessor",
              processingTime,
            );

            return {
              success: true,
              data: processedRecord,
              warnings: warnings.length > 0 ? warnings : undefined,
              processingTime,
              metadata: {
                transformations: this.transformers.map((t) => t.name),
              },
            };
          } catch (error) {
            this.logger.error("Processing error", {
              error,
              recordId: record.id,
            });
            this.metrics.recordProcessingError(
              "RecordProcessor",
              error instanceof Error ? error.name : "UNKNOWN_ERROR",
            );
            return this.handleError(
              error instanceof Error ? error : new Error(String(error)),
            );
          }
        }

        private checkCache(id: string): DataRecord | null {
          const cached = this.cache.get(id);
          if (cached && Date.now() - cached.timestamp < this.cacheTimeoutMs) {
            return cached.record;
          }
          if (cached) {
            this.cache.delete(id);
          }
          return null;
        }

        private updateCache(record: DataRecord): void {
          this.cache.set(record.id, {
            record,
            timestamp: Date.now(),
          });

          // キャッシュサイズの管理
          if (this.cache.size > 1000) {
            let oldestId: string | null = null;
            let oldestTime = Infinity;

            for (const [id, { timestamp }] of this.cache.entries()) {
              if (timestamp < oldestTime) {
                oldestTime = timestamp;
                oldestId = id;
              }
            }

            if (oldestId) {
              this.cache.delete(oldestId);
            }
          }
        }

        private shouldReactivateArchived(record: DataRecord): boolean {
          // 複雑な条件チェック
          const daysSinceUpdate = (Date.now() - record.updatedAt.getTime()) /
            (1000 * 60 * 60 * 24);

          return (
            daysSinceUpdate < 30 &&
            record.value > 100 &&
            record.tags.some((tag) =>
              ["important", "reactivate"].includes(tag)
            ) &&
            record.metadata.autoReactivate === true
          );
        }

        // 様々な処理メソッド
        private async doHighPriorityProcessing(
          record: DataRecord,
        ): Promise<void> {
          this.logger.info("Performing high priority processing", {
            recordId: record.id,
          });
          await this.simulateAsyncOperation(100);
          record.metadata.priorityProcessed = true;
          record.metadata.processingLevel = "high";
        }

        private async doUrgentProcessing(record: DataRecord): Promise<void> {
          this.logger.info("Performing urgent processing", {
            recordId: record.id,
          });
          await this.simulateAsyncOperation(50);
          record.metadata.urgentProcessed = true;
          record.metadata.processingLevel = "urgent";
        }

        private async doNormalProcessing(record: DataRecord): Promise<void> {
          this.logger.debug("Performing normal processing", {
            recordId: record.id,
          });
          await this.simulateAsyncOperation(200);
          record.metadata.normalProcessed = true;
          record.metadata.processingLevel = "normal";
        }

        private async doLowPriorityProcessing(
          record: DataRecord,
        ): Promise<void> {
          this.logger.debug("Performing low priority processing", {
            recordId: record.id,
          });
          await this.simulateAsyncOperation(300);
          record.metadata.lowPriorityProcessed = true;
          record.metadata.processingLevel = "low";
        }

        private async doPendingProcessing(record: DataRecord): Promise<void> {
          this.logger.debug("Performing pending processing", {
            recordId: record.id,
          });
          await this.simulateAsyncOperation(150);
          record.metadata.pendingProcessed = true;

          // 条件に基づいてステータスを変更
          if (record.value > 200 && record.tags.includes("auto-activate")) {
            record.status = "active";
            record.metadata.autoActivated = true;
          }
        }

        private async doReactivationProcessing(
          record: DataRecord,
        ): Promise<void> {
          this.logger.info("Performing reactivation processing", {
            recordId: record.id,
          });
          await this.simulateAsyncOperation(120);
          record.metadata.reactivated = true;
          record.metadata.reactivationDate = new Date();
        }

        private async simulateAsyncOperation(delayMs: number): Promise<void> {
          return new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    if (!(record.updatedAt instanceof Date)) {
      errors.push({
        field: "updatedAt",
        message: "Updated date must be a Date object",
        code: "INVALID_TYPE",
      });
    } else if (
      record.createdAt instanceof Date &&
      record.updatedAt < record.createdAt
    ) {
      errors.push({
        field: "updatedAt",
        message: "Updated date cannot be earlier than created date",
        code: "INVALID_VALUE",
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
