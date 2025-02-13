import {
  createAction,
  fetchAsync,
  FetchResponse,
  LocalErrorResponse,
} from 'actions';
import TopBar from 'elements/TopBar';
import Button from 'elements/Button';
import CardTitle from 'elements/CardTitle';
import Input from 'elements/Input';
import MobileLayout from 'elements/MobileLayout';
import React from 'react';
import {
  Form,
  useRouteError,
  useNavigation,
  useNavigate,
  redirect,
  json,
} from 'react-router-dom';
import { getColors } from 'style';
import styled from 'styled-components';
import {
  extractAnswerBoxType,
  isLegacyAnswerBoxType,
  LiveQuizStaticResponse,
  LiveQuizStaticRoundResponse,
} from 'shared/responses';
import { useTypedLoaderData } from 'hooks';
import { QuestionAnswerInputs } from 'components/QuestionAnswerInputs';
import { QuestionAnswerInputsStatic } from 'components/QuestionAnswerInputsStatic';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };
});

export interface ILoginAction {
  email: string;
  password: string;
}
export interface ILoginResponse {
  isAuthorized: boolean;
}
export const action = createAction(async (values: ILoginAction) => {
  if (!values.email || !values.password) {
    throw new Response('', {
      status: 400,
      statusText: 'Please fill out the form.',
    });
  }

  const result = await fetchAsync<ILoginResponse>(
    'post',
    '/api/account/login',
    values
  );
  if (result.error) {
    throw new Response('', {
      status: result.status,
      statusText: result.message,
    });
  }
  if (!result.data.isAuthorized) {
    throw new Response('', {
      status: 403,
      statusText: 'Unauthorized.',
    });
  }

  return redirect(`/landing`);
});

const loader = async ({ params }) => {
  const staticQuizResponse = await fetchAsync<LiveQuizStaticResponse>(
    'get',
    '/api/static/' + params.userFriendlyQuizId
  );

  // if (accountResponse.error) {
  //   throw new Response('', {
  //     status: accountResponse.status,
  //     statusText: `That quiz could not be found.`,
  //   });
  // }

  if (!staticQuizResponse.data) {
    throw new Response('', {
      status: 404,
      statusText: `That quiz could not be found.`,
    });
  }

  return json(staticQuizResponse);
};

const StaticQuizRound = (props: {
  round: LiveQuizStaticRoundResponse;
  showAnswers: boolean;
}) => {
  const showAnswers = props.showAnswers;

  return (
    <div>
      <h2>{props.round.title}</h2>
      <p>{props.round.description}</p>
      {props.round.questions.map((q, i) => {
        const answers = q.answers;

        let isRadio = false;
        if (isLegacyAnswerBoxType(q.answerType)) {
          if (q.answerType.includes('radio')) {
            isRadio = true;
          }
        } else {
          const [type] = extractAnswerBoxType(q.answerType);
          if (type === 'radio') {
            isRadio = true;
          }
        }

        return (
          <QuestionAnswerInputsStatic
            key={i}
            questionNumber={i + 1}
            question={q}
            dispatch={() => {}}
            answersSaved={{}}
            answersQuestion={isRadio || showAnswers ? answers : undefined}
            answersGraded={showAnswers ? {} : undefined}
            answersStats={showAnswers ? {} : undefined}
            disabled={false}
            numTeams={1}
            hideStatsForAnswers={true}
          />
        );
      })}
    </div>
  );
};

const StaticQuiz = (props: { error?: boolean }) => {
  const routeError = useRouteError() as LocalErrorResponse;
  const staticQuizResponse = useTypedLoaderData<
    FetchResponse<LiveQuizStaticResponse>
  >({
    isError: props.error,
  });
  const [showAnswers, setShowAnswers] = React.useState(false);

  return (
    <>
      <TopBar>
        <div />
        <CardTitle>
          <img
            src="/res/logo-text.png"
            alt="Trivivia"
            style={{
              height: '80%',
            }}
          />
        </CardTitle>
        <div />
      </TopBar>
      <MobileLayout topBar>
        {props.error ? (
          <div
            style={{
              textAlign: 'center',
              color: getColors().ERROR_TEXT,
            }}
          >
            {' '}
            {routeError?.statusText}{' '}
          </div>
        ) : null}
        {staticQuizResponse?.data?.rounds.map(r => {
          return (
            <StaticQuizRound key={r.id} round={r} showAnswers={showAnswers} />
          );
        })}
        <Button
          onClick={() => {
            setShowAnswers(!showAnswers);
          }}
        >
          Toggle Answers
        </Button>
      </MobileLayout>
    </>
  );
};

export const StaticQuizRoute = {
  path: '/static-quiz/:userFriendlyQuizId',
  element: <StaticQuiz />,
  errorElement: <StaticQuiz error={true} />,
  action,
  loader,
};
