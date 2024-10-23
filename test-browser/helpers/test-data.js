import { faker } from '@faker-js/faker';

export const getRandomEmail = () =>
  faker.internet.email({ provider: 'test.trivivia.net' });
