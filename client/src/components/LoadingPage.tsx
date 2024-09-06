import React from 'react';
import DefaultTopBar from './DefaultTopBar';
import MobileLayout from 'elements/MobileLayout';
import ReactAnimatedEllipsis from 'react-animated-ellipsis';

export const LoadingPage = () => {
  return (
    <>
      <DefaultTopBar useBackConfirm={false} />
      <MobileLayout topBar renderWhileLoading>
        <div
          style={{
            margin: '16px',
            textAlign: 'center',
          }}
        >
          Loading
          <ReactAnimatedEllipsis />
        </div>
      </MobileLayout>
    </>
  );
};
