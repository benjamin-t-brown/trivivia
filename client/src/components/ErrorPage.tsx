import MobileLayout from 'elements/MobileLayout';
import React from 'react';
import { useRouteError } from 'react-router-dom';
import { getColors } from 'style';
import DefaultTopBar from './DefaultTopBar';
import StatusTextError from './StatusTextError';

const ErrorPage = () => {
  const err = useRouteError();
  console.error('Route error', err);

  return (
    <>
      <DefaultTopBar title="Error" />
      <MobileLayout topBar>
        <p
          style={{
            textAlign: 'center',
          }}
        >
          An Error has occurred :(
        </p>
        <StatusTextError
          style={{
            textAlign: 'center',
          }}
        />
      </MobileLayout>
    </>
  );
};

export default ErrorPage;
