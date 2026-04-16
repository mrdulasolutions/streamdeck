import { describe, expect, test } from 'bun:test';

describe('smoke', () => {
  test('Bun test runner is available', () => {
    expect(typeof Bun.version).toBe('string');
  });
});
