import { describe, expect, test } from 'bun:test';
import { MentraStreamDeck } from '../index';

describe('StreamDeck app bootstrap', () => {
  test('MentraStreamDeck class is defined', () => {
    expect(MentraStreamDeck).toBeDefined();
  });
});

