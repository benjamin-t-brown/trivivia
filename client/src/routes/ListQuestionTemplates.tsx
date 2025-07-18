import { createAction, fetchAsync, FetchResponse } from 'actions';
import Button from 'elements/Button';
import MobileLayout from 'elements/MobileLayout';
import React from 'react';
import {
  Form,
  json,
  redirect,
  useFetcher,
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
import { getColors, LAYOUT_MAX_WIDTH } from 'style';
import InlineIconButton from 'elements/InlineIconButton';
import IconLeft from 'elements/IconLeft';
import HiddenTextField from 'components/HiddenTextField';
import { updateCacheQuestionTemplate, updateCacheRoundTemplate } from 'cache';
import { ButtonAction } from 'elements/ButtonAction';
import { TitleWithActions } from 'elements/TitleWithActions';

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
    // whiteSpace: props.isDragging ? 'pre' : 'unset',
    // overflow: props.isDragging ? 'hidden' : 'unset',
    width: '100%',
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

const duplicateAction = createAction(
  async (values: { questionTemplateId: string }, params) => {
    const result = await fetchAsync<QuestionTemplateResponse>(
      'post',
      `/api/template/question/${values.questionTemplateId}/duplicate`,
      {}
    );

    if (result.error) {
      throwValidationError(result.message, values);
    }

    updateCacheQuestionTemplate(params.roundTemplateId, result.data.id, result);

    return redirect(
      `/quiz-template/${params.quizTemplateId}/round-template/${params.roundTemplateId}/question-template/${result.data.id}/edit`
    );
  }
);

const getQuestionButtonText = (t: QuestionTemplateResponse) => {
  const ret = (t.text ?? '').replace(/\n/g, '');
  // HACK the stupid way:
  if (ret.toLowerCase() === '(audio)') {
    const answers = Object.values(t.answers).join(', ');
    // return 'Notes: ' + t.notes || 'Audio Question';
    return 'Audio: ' + answers || 'Question';
  }
  if (ret.toLowerCase() === '(video)') {
    const answers = Object.values(t.answers).join(', ');
    // return 'Notes: ' + t.notes || 'Video Question';
    return 'Video: ' + answers || 'Question';
  }
  if (ret.toLowerCase() === '(visual)') {
    const answers = Object.values(t.answers).join(', ');
    // return 'Notes: ' + t.notes || 'Visual Question';
    return 'Visual: ' + answers || 'Question';
  }
  if (ret.length < 2) {
    return 'Notes: ' + t.notes || 'Image question';
  }
  return ret;
};

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
  const fetcher = useFetcher();

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
      dragPlaceholderId: 'drag-placeholder',
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

  const handleDuplicateQuestionTemplateClick =
    (id: string) => (ev: React.MouseEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      const formData = new FormData();
      formData.append('questionTemplateId', id);
      fetcher.submit(formData, {
        method: 'post',
        action: `/quiz-template/${params.quizTemplateId}/round-template/${params.roundTemplateId}/question-templates/${id}/duplicate`,
      });
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
            Round: {loaderResponse?.data.roundTemplate.title}
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
          {/* <ButtonAction
            color="primary"
            onClick={handleCreateQuestionTemplateClick}
          >
            + New Question Template
          </ButtonAction> */}
          <div
            style={{
              margin: '16px 0',
            }}
          >
            {loaderResponse?.data.questionTemplates.length === 0 ? (
              <TextCenter>(none)</TextCenter>
            ) : (
              <a
                href={
                  '/api/template/export/round/' +
                  loaderResponse?.data?.roundTemplate?.id
                }
              >
                Download as JSON
              </a>
            )}
          </div>
          {/* <p>
            Question Templates ({loaderResponse?.data.questionTemplates?.length}
            )
          </p> */}
          <TitleWithActions
            title={`Question Templates (${loaderResponse?.data.questionTemplates?.length})`}
            actions={[
              {
                label: 'New Question Template',
                icon: '/res/plus.svg',
                onClick: handleCreateQuestionTemplateClick,
              },
            ]}
          ></TitleWithActions>
          <fetcher.Form
            style={{
              margin: '0px',
            }}
          >
            {orderedQuestionTemplates.slice().map(questionId => {
              const t = loaderResponse?.data.questionTemplates.find(
                t => t.id === questionId
              );
              if (!t) {
                return <div key={questionId}></div>;
              }

              const isDraggingThis =
                dragState.dragging && t.id === dragState.id;
              const isHoveredOverThis =
                dragState.dragging &&
                t.id === dragState.hoveredId &&
                !isDraggingThis;

              return (
                <div key={t.id}>
                  {isDraggingThis ? (
                    <div
                      id="drag-placeholder"
                      style={{
                        width: '100%',
                        height:
                          document.getElementById(t.id)?.getBoundingClientRect()
                            .height ?? '52px',
                        border: '1px solid ' + getColors().PRIMARY,
                        boxSizing: 'border-box',
                      }}
                    ></div>
                  ) : null}

                  <Button
                    id={t.id}
                    color="secondary"
                    style={{
                      width: isDraggingThis ? 'calc(100% - 64px)' : '100%',
                      maxWidth: LAYOUT_MAX_WIDTH,
                      position: isDraggingThis ? 'absolute' : 'unset',
                      filter: isHoveredOverThis ? 'brightness(1.3)' : 'unset',
                      zIndex: isDraggingThis ? 100 : 0,
                      opacity: isDraggingThis ? 0.25 : 1,
                      border: t.isBonus
                        ? '1px solid ' + getColors().SUCCESS_BACKGROUND
                        : 'unset',
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
                        alignItems: 'center',
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
                        <div
                          style={{
                            marginRight: '16px',
                            width: 'calc(100% - 64px)',
                          }}
                        >
                          {getQuestionButtonText(t)}
                        </div>
                        <InlineIconButton
                          imgSrc="/res/clone.svg"
                          onClick={handleDuplicateQuestionTemplateClick(t.id)}
                        ></InlineIconButton>
                      </InnerButton>
                    </div>
                  </Button>
                </div>
              );
            })}
          </fetcher.Form>
          <Form method="post" id="reorder-questions-form">
            {dragWasEdited ? (
              <div>
                <HiddenTextField
                  name="questionOrder"
                  value={orderedQuestionTemplates.join(',')}
                />
                <div
                  style={{
                    margin: '16px 0',
                    display: 'flex',
                  }}
                >
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
                  <Button
                    color="cancel"
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
                      setOrderedQuestionTemplates(
                        loaderResponse?.data?.roundTemplate?.questionOrder ?? []
                      );
                    }}
                  >
                    <IconLeft src="/res/cancel.svg" /> Cancel
                  </Button>
                </div>
              </div>
            ) : null}
          </Form>
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

export const DuplicateQuestionRoute = {
  path: '/quiz-template/:quizTemplateId/round-template/:roundTemplateId/question-templates/:questionTemplateId/duplicate',
  action: duplicateAction,
};
