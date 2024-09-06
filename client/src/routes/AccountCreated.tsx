import TopBar from 'elements/TopBar';
import Button from 'elements/Button';
import CardTitle from 'elements/CardTitle';
import MobileLayout from 'elements/MobileLayout';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import IconLeft from 'elements/IconLeft';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

const AccountCreated = () => {
  const navigate = useNavigate();

  const handleToLogin = (ev: React.MouseEvent) => {
    ev.preventDefault();
    navigate('/login');
  };

  return (
    <>
      <TopBar>
        <div />
        <CardTitle>
          {' '}
          <>
            Trivivia
            {/* <IconLeft
              style={{
                verticalAlign: 'middle',
              }}
              verticalAdjust={-2}
              src="/res/favicon_c2.svg"
            /> */}
          </>
        </CardTitle>
        <div />
      </TopBar>
      <MobileLayout topBar>
        <InnerRoot>
          <p>Your account has been created.</p>
          <Button
            color="secondary"
            style={{
              width: '100%',
            }}
            onClick={handleToLogin}
          >
            Go to Login
          </Button>
        </InnerRoot>
      </MobileLayout>
    </>
  );
};

export const AccountCreatedRoute = {
  path: '/account-created',
  element: <AccountCreated />,
};
