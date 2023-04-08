import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { it, describe, expect, beforeEach, afterEach } from 'vitest';
import { LandingRoute } from 'routes/Landing';
import { loaderMock } from './setup';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

describe('Landing Test', () => {
  afterEach(() => {
    loaderMock.mockReset();
    cleanup();
  });

  it('Can render a basic landing page', async () => {
    loaderMock.mockImplementation(() => {
      return {
        data: {
          id: '1234',
          account: 'asdf@asdf.com',
        },
      };
    });

    const wrapper = render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={LandingRoute.element} />
        </Routes>
      </MemoryRouter>
    );

    expect(wrapper.container.textContent).toMatch(/Trivivia/);
  });
});
