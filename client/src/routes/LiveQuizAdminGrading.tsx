import { fetchAsync, FetchResponse, createAction } from 'actions';
import Button from 'elements/Button';
import MobileLayout from 'elements/MobileLayout';
import React from 'react';
import { json, redirect, useFetcher, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { getColors } from 'style';
import { throwValidationError, useTypedLoaderData } from 'hooks';
import DefaultTopBar from 'components/DefaultTopBar';
import { updateCacheLiveQuizAdmin } from 'cache';
import {
  LiveQuizResponse,
  LiveQuizState,
  LiveRoundState,
  getNumAnswers,
} from 'shared/responses';
import FormErrorText from 'components/FormErrorText';
import SectionTitle from 'elements/SectionTitle';
import { getRoundAnswersArray, getRoundAnswersArrays } from 'utils';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

const ContentSpacer = () => {
  return <div style={{ height: '16px' }}></div>;
};

const Loading = styled.div<{ visible: boolean }>(props => {
  return {
    display: props.visible ? 'flex' : 'none',
    position: 'fixed',
    width: '100%',
    height: '100%',
    top: '0px',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '32px',
    background: 'rgba(0,0,0,0.5)',
  };
});

interface UpdateQuizValues {
  roundIndex?: number | string;
  questionIndex?: number | string;
  quizState?: LiveQuizState;
  roundState?: LiveRoundState;
  reset?: 'true' | 'false' | boolean;
}
const action = createAction(async (values: UpdateQuizValues, params) => {
  if (Object.keys(values).length === 0) {
    return null;
  }

  if (values.reset === 'true') {
    values.reset = true;
  } else if (values.reset === 'false') {
    values.reset = false;
  }

  if (values.roundIndex) {
    values.roundIndex = parseInt(values.roundIndex as string);
  }
  if (values.questionIndex) {
    values.questionIndex = parseInt(values.questionIndex as string);
  }

  const result = await fetchAsync<LiveQuizResponse>(
    'put',
    '/api/live-quiz-admin/quiz/' + params.liveQuizId + '/update',
    values
  );

  if (result.error) {
    throwValidationError(result.message, values);
  }

  updateCacheLiveQuizAdmin(result.data.id, result);
  return null;
});

const loader = async ({ params }) => {
  const quizTemplatesResponse = await fetchAsync<LiveQuizResponse>(
    'get',
    '/api/live-quiz-admin/quiz/' + params.liveQuizId,
    undefined,
    {
      bustCache: true,
    }
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

interface EditLiveQuizProps {
  error?: boolean;
}
const LiveQuizAdminGrading = (props: EditLiveQuizProps) => {
  const params = useParams();
  const fetcher = useFetcher();
  const liveQuizResponse = useTypedLoaderData<FetchResponse<LiveQuizResponse>>({
    isError: props.error,
  });
  const formId = 'grade-live-quiz-form';

  const liveQuiz = liveQuizResponse?.data;
  const isLoading = fetcher.state === 'submitting';

  if (!liveQuiz) {
    return (
      <>
        <DefaultTopBar useBackConfirm={false} upTo={'/live-quizzes'} />
        <MobileLayout topBar>
          <FormErrorText />
        </MobileLayout>
      </>
    );
  }

  const elems: any[] = [];

  for (let i = 0; i < liveQuiz.quizTemplateJson.roundOrder.length; i++) {
    const roundId = liveQuiz.quizTemplateJson.roundOrder[i];
    const roundTemplate = liveQuiz.quizTemplateJson.rounds?.find(
      t => t.id === roundId
    );
    if (!roundTemplate) {
      continue;
    }

    const subElems: any[] = [];

    liveQuiz.liveQuizTeams.forEach(team => {
      const { answersArr, teamAnswersArr, orderMattersArr } =
        getRoundAnswersArrays(roundTemplate, team);

      subElems.push(
        <div
          key={`round${roundId}-${team.id}`}
          style={{
            margin: '8px 0px',
            background: getColors().BACKGROUND2,
            borderRadius: '8px',
            padding: '8px',
          }}
        >
          <div>
            Team:{' '}
            <span
              style={{
                color: getColors().PRIMARY_TEXT,
              }}
            >
              {team.teamName}
            </span>
          </div>
          {answersArr.map((str, i) => {
            return (
              <div
                key={team.id + i}
                style={{
                  margin: '4px 0px',
                }}
              >
                <span>
                  {i + 1}.{' '}
                  {teamAnswersArr[i] || (
                    <span style={{ color: getColors().TEXT_DESCRIPTION }}>
                      (blank)
                    </span>
                  )}
                </span>
                <br />
                <span>
                  <span
                    style={{
                      color: getColors().TEXT_DESCRIPTION,
                    }}
                  >
                    Correct Answer:
                  </span>{' '}
                  {str}
                  {(true || orderMattersArr[i]) && <div>Order Matters!</div>}
                </span>
              </div>
            );
          })}
        </div>
      );
    });

    elems.push(
      <div key={i}>
        <SectionTitle>
          Round {i + 1}: {roundTemplate.title}
        </SectionTitle>
        {subElems}
      </div>
    );
  }

  return (
    <>
      <DefaultTopBar
        useBackConfirm={false}
        upTo={'/live-quiz-admin/' + params.liveQuizId}
      />
      <MobileLayout topBar>
        <fetcher.Form method="post" id={formId}>
          <InnerRoot>
            <SectionTitle>Grading</SectionTitle>
            {elems}
          </InnerRoot>
        </fetcher.Form>
      </MobileLayout>
      <Loading visible={isLoading}>Loading...</Loading>
    </>
  );
};

export const LiveQuizAdminGradingRoute = {
  path: '/live-quiz-admin/:liveQuizId/grade',
  element: <LiveQuizAdminGrading />,
  errorElement: <LiveQuizAdminGrading error={true} />,
  action,
  loader,
};
