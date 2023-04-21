import { fetchAsync, FetchResponse } from 'actions';
import Button from 'elements/Button';
import MobileLayout from 'elements/MobileLayout';
import React from 'react';
import { json, redirect, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTypedLoaderData } from 'hooks';
import DefaultTopBar from 'components/DefaultTopBar';
import { LiveQuizResponse } from 'shared/responses';
import TextCenter from 'elements/TextCenter';
import { getColors } from 'style';
import { LiveQuizStartRoute } from './LiveQuizStart';
import Img from 'elements/Img';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

const loader = async () => {
  const liveQuizListResponse = await fetchAsync<LiveQuizResponse[]>(
    'get',
    '/api/live-quiz-admin/all'
  );

  if (liveQuizListResponse.error) {
    if (liveQuizListResponse.status === 403) {
      return redirect('/login');
    }

    throw new Response('', {
      status: liveQuizListResponse.status,
      statusText: liveQuizListResponse.message,
    });
  }

  return json(liveQuizListResponse);
};

const ListLiveQuizzes = () => {
  const navigate = useNavigate();
  const liveQuizListResponse = useTypedLoaderData<
    FetchResponse<LiveQuizResponse[]>
  >({
    isError: false,
  });

  const handleCreateQuizClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    navigate(LiveQuizStartRoute.path);
  };

  const handleEditQuizClick = (id: string) => (ev: React.MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    navigate('/live-quiz-admin/' + id + '/edit');
  };

  const handleQuizClick = (id: string) => (ev: React.MouseEvent) => {
    ev.preventDefault();
    navigate('/live-quiz-admin/' + id);
  };

  return (
    <>
      <DefaultTopBar upTo="/landing" />
      <MobileLayout topBar>
        <InnerRoot>
          <p></p>
          <Button
            color="primary"
            style={{
              width: '100%',
            }}
            onClick={handleCreateQuizClick}
          >
            + Start New Live Quiz
          </Button>
          <p>Live Quizzes</p>
          {liveQuizListResponse?.data.map(t => {
            return (
              <Button
                key={t.id}
                color="secondary"
                style={{
                  width: '100%',
                }}
                onClick={handleQuizClick(t.id)}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>{t.name}</div>
                    <span style={{ color: getColors().TEXT_DESCRIPTION }}>
                      Current Round: {t.currentRoundNumber} /{' '}
                      {t.quizTemplateJson.numRounds}
                    </span>
                  </div>
                  <div
                    style={{
                      width: '22px',
                    }}
                    onClick={handleEditQuizClick(t.id)}
                  >
                    <Img alt="Edit" src="/res/edit.svg" />
                  </div>
                </div>
              </Button>
            );
          })}
          {liveQuizListResponse?.data?.length === 0 ? (
            <TextCenter>(none)</TextCenter>
          ) : null}
        </InnerRoot>
      </MobileLayout>
    </>
  );
};

export const ListLiveQuizzesRoute = {
  path: '/live-quizzes',
  element: <ListLiveQuizzes />,
  loader,
};
