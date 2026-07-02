import { describe, it, expect } from 'vitest';
import { replaceInTemplate } from '../src/utils/templateUtils';

describe('templateUtils', () => {
  describe('replaceInTemplate', () => {
    it('replaces single occurrence of key', () => {
      expect(replaceInTemplate('Hello {name}', 'name', 'World')).toBe(
        'Hello World'
      );
    });

    it('replaces multiple occurrences of key', () => {
      expect(replaceInTemplate('{x} and {x}', 'x', 'same')).toBe(
        'same and same'
      );
    });

    it('handles numeric values', () => {
      expect(replaceInTemplate('Count: {n}', 'n', 42)).toBe('Count: 42');
    });

    it('handles zero', () => {
      expect(replaceInTemplate('Zero: {z}', 'z', 0)).toBe('Zero: 0');
    });

    it('returns original when key not present', () => {
      expect(replaceInTemplate('No placeholder', 'missing', 'value')).toBe(
        'No placeholder'
      );
    });
  });
});
