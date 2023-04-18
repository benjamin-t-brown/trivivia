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
import { getColors } from 'style';
import { quizTemplateIsReady } from 'validation';

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

  console.log('quiz templates', quizTemplates);

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
          {quizTemplates?.data.map(t => {
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
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 'calc(100% - 22px)',
                      display: 'flex',
                      textAlign: 'left',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        width: 'calc(100% - 132px)',
                      }}
                    >
                      {t.name}
                    </span>
                    {/* <span
                      style={{
                        color: getColors().TEXT_DESCRIPTION,
                        width: '100px',
                        marginLeft: '16px',
                      }}
                    >
                      {t.numRounds} Rounds
                    </span> */}
                    <span
                      style={{
                        color: quizTemplateIsReady(t)
                          ? getColors().SUCCESS_TEXT
                          : getColors().ERROR_TEXT,
                        width: '112px',
                      }}
                    >
                      {quizTemplateIsReady(t) ? 'Ready' : 'Not Ready'}
                    </span>
                  </div>
                  <div
                    style={{
                      width: '22px',
                    }}
                    onClick={handleEditQuizTemplateClick(t.id)}
                  >
                    <img alt="Edit" src="/res/edit.svg" />
                  </div>
                </div>
              </Button>
            );
          })}
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
