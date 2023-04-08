import { vi } from 'vitest';
export const loaderMock = vi.fn();
export const navigationMock = vi.fn();
export const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const mod = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );
  return {
    ...mod,
    useLoaderData: loaderMock,
    useNavigation: navigationMock.mockImplementation(() => {
      return {};
    }),
    useNavigate: navigateMock,
  };
});

(window as any).TEST = true;

async function setup() {}

setup();
