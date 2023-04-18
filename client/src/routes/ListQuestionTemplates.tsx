import { createAction, fetchAsync, FetchResponse } from 'actions';
import Button from 'elements/Button';
import MobileLayout from 'elements/MobileLayout';
import React from 'react';
import {
  Form,
  json,
  redirect,
  useNavigate,
  useParams,
  useSubmit,
} from 'react-router-dom';
import styled from 'styled-components';
import {
  throwValidationError,
  useConfirmNav,
  useDnDListHandlers,
  useTypedLoaderData,
} from 'hooks';
import DefaultTopBar from 'components/DefaultTopBar';
import {
  QuizTemplateResponse,
  QuestionTemplateResponse,
  RoundTemplateResponse,
} from 'shared/responses';
import TextCenter from 'elements/TextCenter';
import { getColors } from 'style';
import InlineIconButton from 'elements/InlineIconButton';
import IconLeft from 'elements/IconLeft';
import HiddenTextField from 'components/HiddenTextField';
import { updateCacheRoundTemplate } from 'cache';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

const InnerButton = styled.div<{ isDragging: boolean }>(props => {
  return {
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    whiteSpace: props.isDragging ? 'pre' : 'unset',
    overflow: props.isDragging ? 'hidden' : 'unset',
  };
});

const ITEM_HEIGHT = 42;

interface ReorderRoundsValues {
  questionOrder: string;
}
const action = createAction(async (values: ReorderRoundsValues, params) => {
  if (!values.questionOrder) {
    throwValidationError('Please fill out the form.', values);
  }

  const result = await fetchAsync<RoundTemplateResponse>(
    'put',
    `/api/template/round/${params.roundTemplateId}/reorder`,
    {
      questionOrder: values.questionOrder.split(','),
    }
  );

  if (result.error) {
    throwValidationError(result.message, values);
  }

  updateCacheRoundTemplate(params.quizTemplateId, result.data.id, result);

  return null;
});

interface ListQuestionTemplatesLoaderResponse {
  questionTemplates: QuestionTemplateResponse[];
  roundTemplate: RoundTemplateResponse;
}
const loader = async ({ params }) => {
  console.log('loader params', params);

  const questionTemplatesResponse = await fetchAsync<
    FetchResponse<QuestionTemplateResponse[]>
  >('get', '/api/template/all/question/' + params.roundTemplateId);

  if (questionTemplatesResponse.error) {
    if (questionTemplatesResponse.status === 403) {
      return redirect('/login');
    }

    throw new Response('', {
      status: questionTemplatesResponse.status,
      statusText: questionTemplatesResponse.message,
    });
  }

  const roundTemplateResponse = await fetchAsync<QuizTemplateResponse>(
    'get',
    '/api/template/round/' + params.roundTemplateId
  );

  if (roundTemplateResponse.error) {
    if (roundTemplateResponse.status === 403) {
      return redirect('/login');
    }

    throw new Response('', {
      status: roundTemplateResponse.status,
      statusText: roundTemplateResponse.message,
    });
  }

  return json({
    ...questionTemplatesResponse,
    data: {
      questionTemplates: questionTemplatesResponse.data,
      roundTemplate: roundTemplateResponse.data,
    },
  });
};

const ListQuestionTemplates = () => {
  const navigate = useNavigate();
  const params = useParams();
  const submit = useSubmit();

  const loaderResponse = useTypedLoaderData<
    FetchResponse<ListQuestionTemplatesLoaderResponse>
  >({
    isError: false,
  });

  const [orderedQuestionTemplates, setOrderedQuestionTemplates] =
    React.useState(loaderResponse?.data?.roundTemplate?.questionOrder ?? []);

  const { dragWasEdited, dragState, handleDragStart, resetDragState } =
    useDnDListHandlers({
      itemHeight: ITEM_HEIGHT,
      arr: orderedQuestionTemplates,
      setArr: setOrderedQuestionTemplates,
      clickOffset: 50,
    });

  const confirmDialog = useConfirmNav(dragWasEdited);

  const handleCreateQuestionTemplateClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    navigate(
      `/quiz-template/${params.quizTemplateId}/round-template/${params.roundTemplateId}/question-template-new`
    );
  };

  // const handleEditQuestionTemplateClick =
  //   (id: string) => (ev: React.MouseEvent) => {
  //     ev.preventDefault();
  //     ev.stopPropagation();
  //     navigate(
  //       `/quiz-template/${params.roundTemplateId}/round-template/${params.roundTemplateResponse}/question-template/${id}/edit`
  //     );
  //   };

  const handleQuestionTemplateClick =
    (id: string) => (ev: React.MouseEvent) => {
      ev.preventDefault();
      navigate(
        `/quiz-template/${params.quizTemplateId}/round-template/${params.roundTemplateId}/question-template/${id}/edit`
      );
    };

  const handleEditRoundTemplateClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    navigate(
      '/quiz-template/' +
        params.quizTemplateId +
        '/round-template/' +
        params.roundTemplateId +
        '/edit'
    );
  };

  return (
    <>
      <DefaultTopBar
        upTo={`/quiz-template/${params.quizTemplateId}/round-templates`}
      />
      <MobileLayout topBar>
        <InnerRoot>
          <p>
            <InlineIconButton
              imgSrc="/res/edit.svg"
              onClick={handleEditRoundTemplateClick}
            ></InlineIconButton>
            Now editing round: {loaderResponse?.data.roundTemplate.title}
          </p>
          {loaderResponse?.data.roundTemplate.description ? (
            <p
              style={{
                marginTop: '0',
                color: getColors().TEXT_DESCRIPTION,
              }}
            >
              {loaderResponse?.data.roundTemplate.description}
            </p>
          ) : null}
          <Button
            color="primary"
            style={{
              width: '100%',
            }}
            onClick={handleCreateQuestionTemplateClick}
          >
            + Create New Question Template
          </Button>
          <p>
            Question Templates ({loaderResponse?.data.questionTemplates?.length}
            )
          </p>
          {orderedQuestionTemplates.map((questionId, i) => {
            const t = loaderResponse?.data.questionTemplates.find(
              t => t.id === questionId
            );
            if (!t) {
              return <div key={questionId}></div>;
            }

            const isDraggingThis = dragState.dragging && t.id === dragState.id;

            return (
              <div key={t.id}>
                {isDraggingThis ? (
                  <div
                    style={{
                      width: '100%',
                      height: '52px',
                      border: '1px solid ' + getColors().PRIMARY,
                      boxSizing: 'border-box',
                    }}
                  ></div>
                ) : null}
                <Button
                  id={t.id}
                  color="secondary"
                  style={{
                    width: '100%',
                    maxWidth: '800px',
                    position: isDraggingThis ? 'absolute' : 'unset',
                  }}
                  onClick={
                    dragState.dragging
                      ? () => void 0
                      : handleQuestionTemplateClick(t.id)
                  }
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      width: '100%',
                    }}
                  >
                    <InnerButton isDragging={true}>
                      <InlineIconButton
                        imgSrc="/res/drag-handle.svg"
                        onMouseDown={ev => handleDragStart(t.id)(ev)}
                        onTouchStart={ev => handleDragStart(t.id)(ev)}
                        onClick={ev => {
                          ev.stopPropagation();
                          ev.preventDefault();
                        }}
                      ></InlineIconButton>
                      <span
                        style={{
                          marginRight: '16px',
                        }}
                      >
                        {i + 1}.
                      </span>
                      <div
                        style={{
                          width: 'calc(100% - 100px)',
                          overflow: 'hidden',
                          whiteSpace: 'pre',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {t.text}
                      </div>
                    </InnerButton>
                  </div>
                </Button>
              </div>
            );
          })}
          <Form method="post" id="reorder-questions-form">
            {dragWasEdited ? (
              <p>
                <HiddenTextField
                  name="questionOrder"
                  value={orderedQuestionTemplates.join(',')}
                />
                <Button
                  type="submit"
                  color="primary"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={ev => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    resetDragState();
                    const form = document.getElementById(
                      'reorder-questions-form'
                    ) as any;
                    if (form) {
                      form.elements['questionOrder'].value =
                        orderedQuestionTemplates.join(',');
                      submit(form);
                    }
                  }}
                >
                  <IconLeft src="/res/check-mark.svg" /> Save
                </Button>
              </p>
            ) : null}
          </Form>
          {loaderResponse?.data.questionTemplates.length === 0 ? (
            <TextCenter>(none)</TextCenter>
          ) : null}
        </InnerRoot>
      </MobileLayout>
      {confirmDialog}
    </>
  );
};

export const ListQuestionTemplatesRoute = {
  path: '/quiz-template/:quizTemplateId/round-template/:roundTemplateId/question-templates',
  element: <ListQuestionTemplates />,
  loader,
  action,
};
