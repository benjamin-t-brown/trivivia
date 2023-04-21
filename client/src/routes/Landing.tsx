import { fetchAsync, FetchResponse } from 'actions';
import MobileLayout from 'elements/MobileLayout';
import React from 'react';
import { json, redirect, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTypedLoaderData } from 'hooks';
import NavButton from 'components/NavButton';
import { AccountResponse } from 'shared/responses';
import TopBar from 'elements/TopBar';
import CardTitleZone from 'elements/CardTitleZone';
import BackButton from 'components/BackButton';
import CardTitle from 'elements/CardTitle';
import Button from 'elements/Button';
import { LiveQuizStartRoute } from './LiveQuizStart';
import { ListQuizTemplatesRoute } from './ListQuizTemplates';
import Img from 'elements/Img';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

const loader = async () => {
  const accountResponse = await fetchAsync<AccountResponse>(
    'get',
    '/api/account'
  );

  if (accountResponse.error) {
    if (accountResponse.status === 403 || accountResponse.status === 404) {
      return redirect('/login');
    }

    throw new Response('', {
      status: accountResponse.status,
      statusText: accountResponse.message,
    });
  }

  return json(accountResponse);
};

const AdminLanding = () => {
  const accountResponse = useTypedLoaderData<FetchResponse<AccountResponse>>({
    isError: false,
  });
  const navigate = useNavigate();

  return (
    <>
      <TopBar>
        <CardTitleZone align="left">
          <BackButton useConfirm={false} />
        </CardTitleZone>
        <CardTitle>Trivivia</CardTitle>
        <CardTitleZone align="right">
          <Button
            color="plain"
            onClick={() => {
              navigate('/settings');
            }}
          >
            <Img
              style={{
                width: '22px',
                background: 'unset',
              }}
              alt="Settings"
              src="/res/cog.svg"
            />
          </Button>
        </CardTitleZone>
      </TopBar>
      <MobileLayout topBar>
        <InnerRoot>
          <p
            style={{
              textAlign: 'center',
            }}
          >
            Welcome {accountResponse?.data.email}!
          </p>
          <NavButton color="primary" route={LiveQuizStartRoute.path}>
            Start A Quiz
          </NavButton>
          <NavButton color="primary" route="/live-quizzes">
            Live Quizzes
          </NavButton>
          <br />
          <NavButton color="primary" route={ListQuizTemplatesRoute.path}>
            Quiz Templates
          </NavButton>
          <br />
          <NavButton color="secondary" route="/logout">
            Logout
          </NavButton>
        </InnerRoot>
      </MobileLayout>
    </>
  );
};

export const LandingRoute = {
  path: 'landing',
  element: <AdminLanding />,
  loader,
};
