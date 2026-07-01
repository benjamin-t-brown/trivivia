import { faker } from '@faker-js/faker';
import { INTEGRATION_SEED } from '../../shared/integrationSeed';

export { INTEGRATION_SEED };

export const getRandomEmail = () =>
  faker.internet.email({ provider: 'test.trivivia.net' });

export const DEFAULT_TEST_PASSWORD = 'test-password-123';
