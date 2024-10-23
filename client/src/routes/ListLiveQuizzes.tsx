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
import { colorsDark, getColors } from 'style';
import { LiveQuizStartRoute } from './LiveQuizStart';
import Img from 'elements/Img';
import PaginatedList from 'elements/PaginatedList';
import RelativeTime from 'react-relative-time';
import PaginatedListFiltered from 'elements/PaginatedListFiltered';
import { ButtonAction } from 'elements/ButtonAction';

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

const renderLiveQuizButton = (
  t: LiveQuizResponse,
  handleQuizClick,
  handleEditQuizClick
) => {
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
          <span
            title={t.updatedOn}
            style={{
              color: colorsDark.TEXT_DESCRIPTION,
              fontSize: '12px',
            }}
          >
            <RelativeTime value={t.updatedOn} titleformat="iso8601" />
          </span>
          <div
            style={{
              marginTop: '4px',
            }}
          >
            {t.name}{' '}
            <span
              style={{
                color: colorsDark.TEXT_DESCRIPTION,

                marginLeft: '12px',
              }}
            >
              Current Round: {t.currentRoundNumber} /{' '}
              {t.quizTemplateJson.numRounds}
            </span>
          </div>
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
          <ButtonAction onClick={handleCreateQuizClick}>
            + Start New Live Quiz
          </ButtonAction>
          <p>Live Quizzes</p>
          <PaginatedListFiltered
            maxItemsPerPage={20}
            items={liveQuizListResponse?.data ?? []}
            renderItem={t =>
              renderLiveQuizButton(t, handleQuizClick, handleEditQuizClick)
            }
            isFiltered={(t, filter) =>
              t.name.toLocaleLowerCase().includes(filter.toLocaleLowerCase())
            }
            filterLabel="Search"
            id="filter"
          ></PaginatedListFiltered>
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
