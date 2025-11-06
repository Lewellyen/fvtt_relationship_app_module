import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { throttle, debounce } from "../throttle";

describe("throttle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should execute function immediately on first call", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled();

    expect(fn).toHaveBeenCalledOnce();
  });

  it("should ignore calls within throttle window", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledOnce();
  });

  it("should execute again after window expires", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled();
    expect(fn).toHaveBeenCalledOnce();

    // Advance time beyond window
    vi.advanceTimersByTime(1100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should pass arguments to throttled function", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled("arg1", 42);

    expect(fn).toHaveBeenCalledWith("arg1", 42);
  });

  it("should preserve latest arguments on subsequent calls", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 1000);

    throttled("first");
    throttled("second"); // Ignored (within window)

    // Wait for window to expire
    vi.advanceTimersByTime(1100);

    throttled("third");
    expect(fn).toHaveBeenLastCalledWith("third");
  });

  it("should handle rapid successive calls correctly", () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 500);

    // Rapid fire
    for (let i = 0; i < 100; i++) {
      throttled(i);
    }

    // Only first call should execute
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith(0);

    // Advance time and try again
    vi.advanceTimersByTime(600);

    throttled(200);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(200);
  });
});

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should not execute immediately", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);

    debounced();

    expect(fn).not.toHaveBeenCalled();
  });

  it("should execute after delay", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);

    debounced();
    vi.advanceTimersByTime(500);

    expect(fn).toHaveBeenCalledOnce();
  });

  it("should reset timer on subsequent calls", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);

    debounced();
    vi.advanceTimersByTime(200);
    debounced(); // Reset timer
    vi.advanceTimersByTime(200);
    debounced(); // Reset timer again

    // Total time: 400ms, but timer reset twice
    expect(fn).not.toHaveBeenCalled();

    // Advance remaining time
    vi.advanceTimersByTime(500);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("should use latest arguments", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);

    debounced("first");
    debounced("second");
    debounced("third");

    vi.advanceTimersByTime(500);

    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith("third");
  });

  it("should cancel pending execution", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);

    debounced();
    vi.advanceTimersByTime(200);

    debounced.cancel();

    vi.advanceTimersByTime(500);

    expect(fn).not.toHaveBeenCalled();
  });

  it("should allow new debounce after cancel", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);

    debounced();
    debounced.cancel();

    debounced("after-cancel");
    vi.advanceTimersByTime(500);

    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith("after-cancel");
  });

  it("should handle rapid successive calls", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 500);

    // Rapid fire
    for (let i = 0; i < 100; i++) {
      debounced(i);
    }

    // No execution yet
    expect(fn).not.toHaveBeenCalled();

    // Advance time
    vi.advanceTimersByTime(500);

    // Only last call should execute
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith(99);
  });
});
