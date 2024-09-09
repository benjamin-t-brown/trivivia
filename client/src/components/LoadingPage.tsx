import React from 'react';
import DefaultTopBar from './DefaultTopBar';
import MobileLayout from 'elements/MobileLayout';
import AnimatedEllipsis from 'elements/AnimatedEllipsis';

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
          <AnimatedEllipsis />
        </div>
      </MobileLayout>
    </>
  );
};
