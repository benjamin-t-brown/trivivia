import * as emailValidator from 'email-validator';
import { AnswerBoxType, AnswerState } from 'shared/responses';
import logger from './logger';

export const validateEmail = (email: string) => {
  return emailValidator.validate(email);
};

export const validateString = (
  str: string,
  minLen?: number,
  maxLen?: number
) => {
  str = str?.trim();
  return str?.length <= (maxLen ?? 255) && str?.length >= (minLen ?? 0);
};

export const validateInt = (n: number | string, min?: number, max?: number) => {
  n = parseInt(n as string);
  if (isNaN(n)) {
    return false;
  }

  min = min ?? -Infinity;
  max = max ?? Infinity;

  return n >= min && n <= max;
};

export const validateAnswerType = (answerType: string) => {
  for (const t in AnswerBoxType) {
    if (answerType === AnswerBoxType[t]) {
      return true;
    }
  }
  return false;
};

export const validateAnswersSubmitted = (
  answersSubmitted: Record<string, AnswerState>
) => {
  // spoofing length attack
  if (Object.keys(answersSubmitted).length > 30) {
    logger.error(
      `Answers submitted length is too long: ${
        Object.keys(answersSubmitted).length
      }`
    );
    return false;
  }

  const validKeys: string[] = [];
  for (let i = 1; i <= 16; i++) {
    validKeys.push('answer' + i);
  }
  for (let i = 0; i < Object.keys(answersSubmitted).length; i++) {
    const answers = answersSubmitted[i];
    for (const key in answers) {
      if (!validKeys.includes(key)) {
        logger.error(
          `Invalid key found while validating answers submitted: ${key}`
        );
        return false;
      }
      if (!validateString(answers[key], undefined, 255)) {
        logger.error(
          `Invalid answer length found while validating answers submitted: answerNum=${i} len=${answers[i].length}`
        );
        return false;
      }
    }
  }
  return true;
};
