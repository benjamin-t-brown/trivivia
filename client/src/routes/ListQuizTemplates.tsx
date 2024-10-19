import { fetchAsync, FetchResponse } from 'actions';
import Button from 'elements/Button';
import MobileLayout from 'elements/MobileLayout';
import React from 'react';
import { json, redirect, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTypedLoaderData } from 'hooks';
import DefaultTopBar from 'components/DefaultTopBar';
import { QuizTemplateResponse } from 'shared/responses';
import TextCenter from 'elements/TextCenter';
import { colorsDark } from 'style';
import { quizTemplateIsReady } from 'validation';
import Img from 'elements/Img';
import PaginatedList from 'elements/PaginatedList';
import RelativeTime from 'react-relative-time';
import PaginatedListFiltered from 'elements/PagindatedListFiltered';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

const loader = async () => {
  const quizTemplatesResponse = await fetchAsync<QuizTemplateResponse[]>(
    'get',
    '/api/template/all/quiz'
  );

  if (quizTemplatesResponse.error) {
    if (quizTemplatesResponse.status === 403) {
      return redirect('/login');
    }

    throw new Response('', {
      status: quizTemplatesResponse.status,
      statusText: quizTemplatesResponse.message,
    });
  }

  return json(quizTemplatesResponse);
};

const renderQuizTemplateButton = (
  t: QuizTemplateResponse,
  handleQuizTemplateClick,
  handleEditQuizTemplateClick
) => {
  return (
    <Button
      key={t.id}
      color="secondary"
      style={{
        width: '100%',
      }}
      onClick={handleQuizTemplateClick(t.id)}
    >
      <div
        style={{
          fontSize: '12px',
          textAlign: 'left',
          color: colorsDark.TEXT_DESCRIPTION,
        }}
      >
        <span>
          <RelativeTime value={t.updatedOn} titleformat="iso8601" />
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '4px',
        }}
      >
        <div
          style={{
            width: 'calc(100% - 22px)',
            display: 'flex',
            textAlign: 'left',
            alignItems: 'flex-start',
          }}
        >
          <span
            style={{
              width: 'calc(100% - 32px)',
            }}
          >
            {t.name}
          </span>
        </div>
        <div
          style={{
            width: '122px',
            transform: 'translateY(-6px)',
            marginRight: '23px',
          }}
        >
          <span
            style={{
              color: quizTemplateIsReady(t)
                ? colorsDark.SUCCESS_TEXT
                : colorsDark.ERROR_TEXT,
              width: '60px',
              textAlign: 'center',
            }}
          >
            {quizTemplateIsReady(t) ? 'Ready' : 'Not Ready'}
          </span>
        </div>
        <div
          style={{
            width: '22px',
            transform: 'translateY(-6px)',
            flexShrink: 0,
          }}
          onClick={handleEditQuizTemplateClick(t.id)}
        >
          <Img alt="Edit" src="/res/edit.svg" />
        </div>
      </div>
    </Button>
  );
};

const ListQuizTemplates = () => {
  const navigate = useNavigate();
  const quizTemplates = useTypedLoaderData<
    FetchResponse<QuizTemplateResponse[]>
  >({
    isError: false,
  });

  const handleCreateQuizTemplateClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    navigate('/quiz-template-new');
  };

  const handleEditQuizTemplateClick =
    (id: string) => (ev: React.MouseEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      navigate('/quiz-template/' + id + '/edit');
    };

  const handleQuizTemplateClick = (id: string) => (ev: React.MouseEvent) => {
    ev.preventDefault();
    navigate('/quiz-template/' + id + '/round-templates');
  };

  // console.log('quiz templates', quizTemplates);

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
            onClick={handleCreateQuizTemplateClick}
          >
            + Create New Quiz Template
          </Button>
          <p>Quiz Templates</p>
          <PaginatedListFiltered
            maxItemsPerPage={20}
            items={quizTemplates?.data ?? []}
            renderItem={t =>
              renderQuizTemplateButton(
                t,
                handleQuizTemplateClick,
                handleEditQuizTemplateClick
              )
            }
            isFiltered={(t, filter) =>
              t.name.toLocaleLowerCase().includes(filter.toLocaleLowerCase())
            }
            filterLabel="Search"
            id="filter"
          ></PaginatedListFiltered>
          {quizTemplates?.data?.length === 0 ? (
            <TextCenter>(none)</TextCenter>
          ) : null}
        </InnerRoot>
      </MobileLayout>
    </>
  );
};

export const ListQuizTemplatesRoute = {
  path: '/quiz-templates',
  element: <ListQuizTemplates />,
  loader,
};
