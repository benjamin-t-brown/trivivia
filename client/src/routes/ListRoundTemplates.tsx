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
import { QuizTemplateResponse, RoundTemplateResponse } from 'shared/responses';
import TextCenter from 'elements/TextCenter';
import { getColors } from 'style';
import InlineIconButton from 'elements/InlineIconButton';
import IconLeft from 'elements/IconLeft';
import HiddenTextField from 'components/HiddenTextField';
import { updateCacheQuizTemplate } from 'cache';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

const ITEM_HEIGHT = 52;

interface ReorderRoundsValues {
  roundOrder: string;
}
const action = createAction(async (values: ReorderRoundsValues, params) => {
  if (!values.roundOrder) {
    throwValidationError('Please fill out the form.', values);
  }

  const result = await fetchAsync<QuizTemplateResponse>(
    'put',
    `/api/template/quiz/${params.quizTemplateId}/reorder`,
    {
      roundOrder: values.roundOrder.split(','),
    }
  );

  if (result.error) {
    throwValidationError(result.message, values);
  }

  updateCacheQuizTemplate(result.data.id, result);

  return null;
});

interface ListRoundTemplatesLoaderResponse {
  roundTemplates: RoundTemplateResponse[];
  quizTemplate: QuizTemplateResponse;
}
const loader = async ({ params }) => {
  console.log('loader params', params);

  const roundTemplatesResponse = await fetchAsync<
    FetchResponse<RoundTemplateResponse[]>
  >('get', '/api/template/all/round/' + params.quizTemplateId);

  if (roundTemplatesResponse.error) {
    if (roundTemplatesResponse.status === 403) {
      return redirect('/login');
    }

    throw new Response('', {
      status: roundTemplatesResponse.status,
      statusText: roundTemplatesResponse.message,
    });
  }

  const quizTemplateResponse = await fetchAsync<QuizTemplateResponse>(
    'get',
    '/api/template/quiz/' + params.quizTemplateId
  );

  if (quizTemplateResponse.error) {
    if (quizTemplateResponse.status === 403) {
      return redirect('/login');
    }

    throw new Response('', {
      status: quizTemplateResponse.status,
      statusText: quizTemplateResponse.message,
    });
  }

  return json({
    ...roundTemplatesResponse,
    data: {
      roundTemplates: roundTemplatesResponse.data,
      quizTemplate: quizTemplateResponse.data,
    },
  });
};

const ListRoundTemplates = () => {
  const navigate = useNavigate();
  const params = useParams();
  const submit = useSubmit();

  const loaderResponse = useTypedLoaderData<
    FetchResponse<ListRoundTemplatesLoaderResponse>
  >({
    isError: false,
  });

  const [orderedRoundTemplates, setOrderedRoundTemplates] = React.useState(
    loaderResponse?.data?.quizTemplate?.roundOrder ?? []
  );

  const { dragWasEdited, dragState, handleDragStart, resetDragState } =
    useDnDListHandlers({
      itemHeight: ITEM_HEIGHT,
      arr: orderedRoundTemplates,
      setArr: setOrderedRoundTemplates,
    });

  const confirmDialog = useConfirmNav(dragWasEdited);

  const handleCreateRoundTemplateClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    navigate(`/quiz-template/${params.quizTemplateId}/round-template-new`);
  };

  const handleEditRoundTemplateClick =
    (id: string) => (ev: React.MouseEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      navigate(
        `/quiz-template/${params.quizTemplateId}/round-template/${id}/edit`
      );
    };

  const handleRoundTemplateClick = (id: string) => (ev: React.MouseEvent) => {
    ev.preventDefault();
    navigate(
      `/quiz-template/${params.quizTemplateId}/round-template/${id}/question-templates`
    );
  };

  const handleEditQuizTemplateClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    navigate('/quiz-template/' + params.quizTemplateId + '/edit');
  };

  return (
    <>
      <DefaultTopBar upTo="/quiz-templates" />
      <MobileLayout topBar>
        <InnerRoot>
          <p
            style={{
              width: '80%',
            }}
          >
            <InlineIconButton
              imgSrc="/res/edit.svg"
              onClick={handleEditQuizTemplateClick}
            ></InlineIconButton>
            Now editing quiz: {loaderResponse?.data.quizTemplate.name}
          </p>

          <Button
            disabled={
              (loaderResponse?.data.roundTemplates.length ?? 0) >=
              (loaderResponse?.data.quizTemplate.numRounds ?? 0)
            }
            color="primary"
            style={{
              width: '100%',
            }}
            onClick={handleCreateRoundTemplateClick}
          >
            + Create New Round Template
          </Button>
          <p>
            Round Templates ({loaderResponse?.data.roundTemplates?.length}/
            {loaderResponse?.data.quizTemplate.numRounds})
          </p>
          {orderedRoundTemplates?.map((templateId, i) => {
            const t = loaderResponse?.data.roundTemplates.find(
              t => t.id === templateId
            );
            if (!t) {
              return null;
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
                  onClick={handleRoundTemplateClick(t.id)}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <InlineIconButton
                        imgSrc="/res/drag-handle.svg"
                        onMouseDown={handleDragStart(t.id)}
                        onTouchStart={handleDragStart(t.id)}
                      ></InlineIconButton>
                      {i + 1}. {t.title}
                    </div>
                    <div
                      style={{
                        width: '22px',
                      }}
                      onClick={handleEditRoundTemplateClick(t.id)}
                    >
                      <img alt="Edit" src="/res/edit.svg" />
                    </div>
                  </div>
                </Button>
              </div>
            );
          })}
          <Form method="post" id="reorder-rounds-form">
            {dragWasEdited ? (
              <p>
                <HiddenTextField
                  name="roundOrder"
                  value={orderedRoundTemplates.join(',')}
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
                      'reorder-rounds-form'
                    ) as any;
                    if (form) {
                      form.elements['roundOrder'].value =
                        orderedRoundTemplates.join(',');
                      submit(form);
                    }
                  }}
                >
                  <IconLeft src="/res/check-mark.svg" /> Save
                </Button>
              </p>
            ) : null}
          </Form>
          {loaderResponse?.data.roundTemplates.length === 0 ? (
            <TextCenter>(none)</TextCenter>
          ) : null}
        </InnerRoot>
      </MobileLayout>
      {confirmDialog}
    </>
  );
};

export const ListRoundTemplatesRoute = {
  path: '/quiz-template/:quizTemplateId/round-templates',
  element: <ListRoundTemplates />,
  action,
  loader,
};
