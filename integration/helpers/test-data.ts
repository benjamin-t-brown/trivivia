import { faker } from '@faker-js/faker';
import { INTEGRATION_SEED } from '../../shared/integrationSeed';

export { INTEGRATION_SEED };

export const getRandomEmail = () =>
  faker.internet.email({ provider: 'test.trivivia.net' });

export const getUniqueQuizName = () =>
  `Integration Quiz ${faker.string.alphanumeric(8)}`;

export const getUniqueRoundTitle = () =>
  `Round ${faker.string.alphanumeric(6)}`;

export const DEFAULT_TEST_PASSWORD = 'test-password-123';
