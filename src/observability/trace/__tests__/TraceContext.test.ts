import { describe, it, expect, beforeEach, vi } from "vitest";
import { TraceContext } from "../TraceContext";
import { generateTraceId } from "@/utils/observability/trace";

// Mock generateTraceId for deterministic testing
vi.mock("@/utils/observability/trace", () => ({
  generateTraceId: vi.fn(),
  getTraceTimestamp: vi.fn(),
}));

describe("TraceContext", () => {
  let traceContext: TraceContext;
  let mockGenerateTraceId: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    traceContext = new TraceContext();
    mockGenerateTraceId = vi.mocked(generateTraceId);
    mockGenerateTraceId.mockClear();
  });

  describe("getCurrentTraceId", () => {
    it("should return null when not in traced context", () => {
      expect(traceContext.getCurrentTraceId()).toBeNull();
    });

    it("should return current trace ID when in traced context", () => {
      mockGenerateTraceId.mockReturnValue("trace-123");

      traceContext.trace(() => {
        expect(traceContext.getCurrentTraceId()).toBe("trace-123");
      });
    });

    it("should return null after trace completes", () => {
      mockGenerateTraceId.mockReturnValue("trace-123");

      traceContext.trace(() => {
        expect(traceContext.getCurrentTraceId()).toBe("trace-123");
      });

      expect(traceContext.getCurrentTraceId()).toBeNull();
    });
  });

  describe("trace (sync)", () => {
    it("should execute function and return result", () => {
      mockGenerateTraceId.mockReturnValue("trace-123");

      const result = traceContext.trace(() => {
        return "test-result";
      });

      expect(result).toBe("test-result");
    });

    it("should generate trace ID when not provided", () => {
      mockGenerateTraceId.mockReturnValue("generated-trace-456");

      traceContext.trace(() => {
        expect(traceContext.getCurrentTraceId()).toBe("generated-trace-456");
      });

      expect(mockGenerateTraceId).toHaveBeenCalledOnce();
    });

    it("should use custom trace ID when provided as string", () => {
      const result = traceContext.trace(() => {
        return traceContext.getCurrentTraceId();
      }, "custom-trace-789");

      expect(result).toBe("custom-trace-789");
      expect(mockGenerateTraceId).not.toHaveBeenCalled();
    });

    it("should use custom trace ID when provided in options", () => {
      const result = traceContext.trace(
        () => {
          return traceContext.getCurrentTraceId();
        },
        { traceId: "options-trace-abc" }
      );

      expect(result).toBe("options-trace-abc");
      expect(mockGenerateTraceId).not.toHaveBeenCalled();
    });

    it("should support nested traces with different IDs", () => {
      mockGenerateTraceId.mockReturnValueOnce("outer-trace").mockReturnValueOnce("inner-trace");

      const outerTraceId = traceContext.trace(() => {
        const outer = traceContext.getCurrentTraceId();

        const innerTraceId = traceContext.trace(() => {
          return traceContext.getCurrentTraceId();
        });

        // After inner trace completes, should be back to outer
        const afterInner = traceContext.getCurrentTraceId();

        return { outer, inner: innerTraceId, afterInner };
      });

      expect(outerTraceId.outer).toBe("outer-trace");
      expect(outerTraceId.inner).toBe("inner-trace");
      expect(outerTraceId.afterInner).toBe("outer-trace");
    });

    it("should restore context even when function throws", () => {
      mockGenerateTraceId.mockReturnValue("trace-error");

      expect(() => {
        traceContext.trace(() => {
          throw new Error("Test error");
        });
      }).toThrow("Test error");

      // Context should be restored to null
      expect(traceContext.getCurrentTraceId()).toBeNull();
    });

    it("should support operation name in options", () => {
      mockGenerateTraceId.mockReturnValue("trace-with-name");

      const result = traceContext.trace(
        () => {
          return "result";
        },
        { operationName: "testOperation" }
      );

      expect(result).toBe("result");
    });

    it("should support metadata in options", () => {
      mockGenerateTraceId.mockReturnValue("trace-with-metadata");

      const result = traceContext.trace(
        () => {
          return "result";
        },
        {
          metadata: { userId: 123, action: "test" },
        }
      );

      expect(result).toBe("result");
    });

    it("should handle deeply nested traces", () => {
      mockGenerateTraceId
        .mockReturnValueOnce("level-1")
        .mockReturnValueOnce("level-2")
        .mockReturnValueOnce("level-3");

      const result = traceContext.trace(() => {
        const l1 = traceContext.getCurrentTraceId();

        return traceContext.trace(() => {
          const l2 = traceContext.getCurrentTraceId();

          return traceContext.trace(() => {
            const l3 = traceContext.getCurrentTraceId();
            return { l1, l2, l3 };
          });
        });
      });

      expect(result.l1).toBe("level-1");
      expect(result.l2).toBe("level-2");
      expect(result.l3).toBe("level-3");

      // All contexts restored
      expect(traceContext.getCurrentTraceId()).toBeNull();
    });
  });

  describe("traceAsync (async)", () => {
    it("should execute async function and return result", async () => {
      mockGenerateTraceId.mockReturnValue("async-trace-123");

      const result = await traceContext.traceAsync(async () => {
        return "async-result";
      });

      expect(result).toBe("async-result");
    });

    it("should generate trace ID when not provided", async () => {
      mockGenerateTraceId.mockReturnValue("generated-async-456");

      await traceContext.traceAsync(async () => {
        expect(traceContext.getCurrentTraceId()).toBe("generated-async-456");
      });

      expect(mockGenerateTraceId).toHaveBeenCalledOnce();
    });

    it("should use custom trace ID when provided", async () => {
      const result = await traceContext.traceAsync(async () => {
        return traceContext.getCurrentTraceId();
      }, "custom-async-789");

      expect(result).toBe("custom-async-789");
      expect(mockGenerateTraceId).not.toHaveBeenCalled();
    });

    it("should support nested async traces", async () => {
      mockGenerateTraceId.mockReturnValueOnce("outer-async").mockReturnValueOnce("inner-async");

      const result = await traceContext.traceAsync(async () => {
        const outer = traceContext.getCurrentTraceId();

        const innerTraceId = await traceContext.traceAsync(async () => {
          return traceContext.getCurrentTraceId();
        });

        const afterInner = traceContext.getCurrentTraceId();

        return { outer, inner: innerTraceId, afterInner };
      });

      expect(result.outer).toBe("outer-async");
      expect(result.inner).toBe("inner-async");
      expect(result.afterInner).toBe("outer-async");
    });

    it("should restore context even when async function throws", async () => {
      mockGenerateTraceId.mockReturnValue("async-error-trace");

      await expect(
        traceContext.traceAsync(async () => {
          throw new Error("Async error");
        })
      ).rejects.toThrow("Async error");

      // Context should be restored to null
      expect(traceContext.getCurrentTraceId()).toBeNull();
    });

    it("should handle async function that returns Promise.reject", async () => {
      mockGenerateTraceId.mockReturnValue("reject-trace");

      await expect(
        traceContext.traceAsync(async () => {
          return Promise.reject(new Error("Rejected"));
        })
      ).rejects.toThrow("Rejected");

      expect(traceContext.getCurrentTraceId()).toBeNull();
    });

    it("should properly restore context for async operations", async () => {
      mockGenerateTraceId.mockReturnValue("async-restore-test");

      // Create async trace that we'll await after it completes
      const asyncTracePromise = traceContext.traceAsync(async () => {
        const idDuringExecution = traceContext.getCurrentTraceId();
        await new Promise((resolve) => setTimeout(resolve, 1));
        return idDuringExecution;
      });

      // Await completion
      const capturedId = await asyncTracePromise;

      // The trace ID was captured during execution
      expect(capturedId).toBe("async-restore-test");

      // Context is restored to null after trace completes
      expect(traceContext.getCurrentTraceId()).toBeNull();
    });

    it("should support operation name in async options", async () => {
      mockGenerateTraceId.mockReturnValue("async-with-name");

      const result = await traceContext.traceAsync(
        async () => {
          return "result";
        },
        { operationName: "asyncOperation" }
      );

      expect(result).toBe("result");
    });
  });

  describe("dispose", () => {
    it("should reset current trace ID to null", () => {
      mockGenerateTraceId.mockReturnValue("dispose-test-trace");

      // Set a trace context
      traceContext.trace(() => {
        expect(traceContext.getCurrentTraceId()).toBe("dispose-test-trace");
      });

      // Dispose should reset state
      traceContext.dispose();

      // Should be null after dispose
      expect(traceContext.getCurrentTraceId()).toBeNull();
    });

    it("should be idempotent (can be called multiple times)", () => {
      mockGenerateTraceId.mockReturnValue("idempotent-trace");

      traceContext.trace(() => {
        expect(traceContext.getCurrentTraceId()).toBe("idempotent-trace");
      });

      // Multiple dispose calls should not throw
      traceContext.dispose();
      traceContext.dispose();
      traceContext.dispose();

      expect(traceContext.getCurrentTraceId()).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty options object", () => {
      mockGenerateTraceId.mockReturnValue("empty-options");

      const result = traceContext.trace(() => {
        return traceContext.getCurrentTraceId();
      }, {});

      expect(result).toBe("empty-options");
    });

    it("should handle function returning undefined", () => {
      mockGenerateTraceId.mockReturnValue("undefined-result");

      const result = traceContext.trace(() => {
        return undefined;
      });

      expect(result).toBeUndefined();
    });

    it("should handle async function returning undefined", async () => {
      mockGenerateTraceId.mockReturnValue("async-undefined");

      const result = await traceContext.traceAsync(async () => {
        return undefined;
      });

      expect(result).toBeUndefined();
    });

    it("should handle function returning null", () => {
      mockGenerateTraceId.mockReturnValue("null-result");

      const result = traceContext.trace(() => {
        return null;
      });

      expect(result).toBeNull();
    });

    it("should handle complex return values", () => {
      mockGenerateTraceId.mockReturnValue("complex-trace");

      const result = traceContext.trace(() => {
        return { nested: { value: [1, 2, 3] }, traceId: traceContext.getCurrentTraceId() };
      });

      expect(result.nested.value).toEqual([1, 2, 3]);
      expect(result.traceId).toBe("complex-trace");
    });
  });
});
