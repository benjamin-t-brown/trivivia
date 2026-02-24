import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateEmail,
  validateString,
  validateInt,
  validateAnswerType,
  validateAnswersSubmitted,
} from '../src/validators';
import { AnswerBoxType } from 'shared/responses';

describe('validators', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('validateEmail', () => {
    it('returns true for valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user+tag@domain.co.uk')).toBe(true);
    });

    it('returns false for invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('no-at-sign.com')).toBe(false);
      expect(validateEmail('@nodomain.com')).toBe(false);
    });
  });

  describe('validateString', () => {
    it('returns true for non-empty strings within default length', () => {
      expect(validateString('hello')).toBe(true);
      expect(validateString('a')).toBe(true);
    });

    it('trims whitespace before validating', () => {
      expect(validateString('  hello  ')).toBe(true);
    });

    it('returns false for empty string when minLen is 1', () => {
      expect(validateString('', 1)).toBe(false);
      expect(validateString('   ', 1)).toBe(false);
    });

    it('returns true for empty string when minLen is 0 (default)', () => {
      expect(validateString('')).toBe(true);
    });

    it('respects minLen parameter', () => {
      expect(validateString('hi', 3)).toBe(false);
      expect(validateString('hi', 2)).toBe(true);
      expect(validateString('hello', 5)).toBe(true);
    });

    it('respects maxLen parameter', () => {
      expect(validateString('hello', undefined, 5)).toBe(true);
      expect(validateString('hello', undefined, 4)).toBe(false);
      expect(validateString('hi', undefined, 255)).toBe(true);
    });

    it('handles undefined', () => {
      expect(validateString(undefined as any)).toBe(false);
    });
  });

  describe('validateInt', () => {
    it('returns true for valid integers within bounds', () => {
      expect(validateInt(5)).toBe(true);
      expect(validateInt('42')).toBe(true);
      expect(validateInt(0)).toBe(true);
    });

    it('returns false for NaN', () => {
      expect(validateInt('not a number')).toBe(false);
      expect(validateInt(NaN)).toBe(false);
    });

    it('respects min parameter', () => {
      expect(validateInt(5, 0, 10)).toBe(true);
      expect(validateInt(5, 10, 20)).toBe(false);
      expect(validateInt(-5, -10, 0)).toBe(true);
    });

    it('respects max parameter', () => {
      expect(validateInt(5, 0, 10)).toBe(true);
      expect(validateInt(15, 0, 10)).toBe(false);
    });
  });

  describe('validateAnswerType', () => {
    it('returns true for known AnswerBoxType values', () => {
      expect(validateAnswerType(AnswerBoxType.INPUT1)).toBe(true);
      expect(validateAnswerType(AnswerBoxType.RADIO4)).toBe(true);
      expect(validateAnswerType(AnswerBoxType.CHECKBOX_LIST)).toBe(true);
    });

    it('returns true for extractAnswerBoxType fallback types', () => {
      expect(validateAnswerType('input2')).toBe(true);
      expect(validateAnswerType('radio3')).toBe(true);
      expect(validateAnswerType('checkbox_N_N')).toBe(true);
    });

    it('returns false for invalid answer types', () => {
      expect(validateAnswerType('invalid')).toBe(false);
      expect(validateAnswerType('')).toBe(false);
    });
  });

  describe('validateAnswersSubmitted', () => {
    it('returns false when more than 30 keys (length attack)', () => {
      const manyKeys: Record<string, any> = {};
      for (let i = 0; i < 31; i++) {
        manyKeys[String(i)] = { answer1: 'x' };
      }
      expect(validateAnswersSubmitted(manyKeys)).toBe(false);
    });

    it('returns false for invalid keys in answer objects', () => {
      expect(
        validateAnswersSubmitted({
          '0': { invalidKey: 'value' } as any,
        })
      ).toBe(false);
    });

    it('returns false when answer value fails validateString', () => {
      expect(
        validateAnswersSubmitted({
          '0': { answer1: 'x'.repeat(256) },
        })
      ).toBe(false);
    });

    it('returns true for valid answers', () => {
      expect(
        validateAnswersSubmitted({
          '0': { answer1: 'correct answer' },
        })
      ).toBe(true);
    });

    it('returns true for multiple questions with valid answers', () => {
      expect(
        validateAnswersSubmitted({
          '0': { answer1: 'a', answer2: 'b' },
          '1': { answer1: 'c' },
        })
      ).toBe(true);
    });
  });
});
