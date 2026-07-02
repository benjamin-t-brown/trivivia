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
import { getColors, LAYOUT_MAX_WIDTH } from 'style';
import InlineIconButton from 'elements/InlineIconButton';
import IconLeft from 'elements/IconLeft';
import HiddenTextField from 'components/HiddenTextField';
import { updateCacheQuizTemplate } from 'cache';
import Img from 'elements/Img';
import { TitleWithActions } from 'elements/TitleWithActions';

const ExportDropdownRoot = styled.div`
  position: relative;
  display: inline-block;
`;

const ExportDropdownMenu = styled.div<{ open: boolean }>`
  display: ${p => (p.open ? 'block' : 'none')};
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 180px;
  background: ${() => getColors().BACKGROUND2};
  border: 1px solid ${() => getColors().PRIMARY};
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
  overflow: hidden;
`;

const ExportDropdownItem = styled.a`
  display: block;
  padding: 10px 14px;
  color: ${() => getColors().TEXT_DEFAULT};
  text-decoration: none;
  font-size: 14px;
  cursor: pointer;
  &:hover {
    background: ${() => getColors().PRIMARY};
    color: white;
  }
  &:link {
    color: ${() => getColors().TEXT_DEFAULT};
  }
  &:visited {
    color: ${() => getColors().TEXT_DEFAULT};
  }
`;

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

  const drag = useDnDListHandlers({
    itemHeight: ITEM_HEIGHT,
    arr: orderedRoundTemplates,
    setArr: setOrderedRoundTemplates,
    clickOffset: 50,
    dragPlaceholderId: 'drag-placeholder',
  });
  const { dragWasEdited, dragState, handleDragStart, resetDragState } = {
    dragWasEdited: drag.dragWasEdited,
    dragState: drag.dragState,
    handleDragStart: drag.handleDragStart,
    resetDragState: drag.resetDragState,
  };

  const confirmDialog = useConfirmNav(dragWasEdited);

  const [exportDropdownOpen, setExportDropdownOpen] = React.useState(false);
  const exportDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!exportDropdownOpen) return;
    const handleClickOutside = (ev: MouseEvent) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(ev.target as Node)
      ) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [exportDropdownOpen]);

  const handleCreateRoundTemplateClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    navigate(`/quiz-template/${params.quizTemplateId}/round-template-new`);
  };

  const handlePickExistingRoundTemplateClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    // /quiz-template/:quizTemplateId/round/all
    navigate(`/quiz-template/${params.quizTemplateId}/round/all`);
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
          <div
            style={{
              margin: '1em 0',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '4px',
            }}
          >
            <InlineIconButton
              imgSrc="/res/edit.svg"
              onClick={handleEditQuizTemplateClick}
            />
            <ExportDropdownRoot ref={exportDropdownRef}>
              <InlineIconButton
                imgSrc="/res/cloud-download.svg"
                onClick={ev => {
                  ev.preventDefault();
                  setExportDropdownOpen(o => !o);
                }}
              />
              <ExportDropdownMenu open={exportDropdownOpen}>
                <ExportDropdownItem
                  href={
                    '/api/template/export/quiz/' +
                    loaderResponse?.data?.quizTemplate.id +
                    '/html'
                  }
                  onClick={() => setExportDropdownOpen(false)}
                >
                  Download as HTML
                </ExportDropdownItem>
                <ExportDropdownItem
                  href={
                    '/api/template/export/quiz/' +
                    loaderResponse?.data?.quizTemplate.id +
                    '/json'
                  }
                  onClick={() => setExportDropdownOpen(false)}
                >
                  Download as JSON
                </ExportDropdownItem>
                <ExportDropdownItem
                  href={
                    '/api/template/export/quiz/' +
                    loaderResponse?.data?.quizTemplate.id +
                    '/pptx'
                  }
                  onClick={() => setExportDropdownOpen(false)}
                >
                  Download as Slides
                </ExportDropdownItem>
                {loaderResponse?.data?.quizTemplate.allowStaticRender ? (
                  <ExportDropdownItem
                    href={
                      '/api/static/render-html/template/' +
                      loaderResponse?.data?.quizTemplate.id
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setExportDropdownOpen(false)}
                  >
                    Public Link To Html
                  </ExportDropdownItem>
                ) : null}
              </ExportDropdownMenu>
            </ExportDropdownRoot>
            <span
              style={{
                color: getColors().TEXT_DESCRIPTION,
              }}
            >
              Quiz:
            </span>{' '}
            {loaderResponse?.data.quizTemplate.name}
          </div>
          {loaderResponse?.data.roundTemplates.length === 0 ? (
            <div style={{ margin: '16px 0' }}>
              <TextCenter>(none)</TextCenter>
            </div>
          ) : null}
          <TitleWithActions
            title="Round Templates"
            actions={[
              {
                label: 'New Round Template',
                icon: '/res/plus.svg',
                onClick: handleCreateRoundTemplateClick,
              },
              {
                label: 'Pick Round Template',
                icon: '/res/search.svg',
                onClick: handlePickExistingRoundTemplateClick,
              },
            ]}
          ></TitleWithActions>
          {orderedRoundTemplates?.map((templateId, i) => {
            const t = loaderResponse?.data.roundTemplates.find(
              t => t.id === templateId
            );
            if (!t) {
              return null;
            }

            // const isDraggingThis = dragState.dragging && t.id === dragState.id;
            // const isDraggingThis = false;
            const isDraggingThis = dragState.dragging && t.id === dragState.id;
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
                    maxWidth: LAYOUT_MAX_WIDTH,
                    position: isDraggingThis ? 'absolute' : 'unset',
                    filter: isHoveredOverThis ? 'brightness(1.3)' : 'unset',
                    zIndex: isDraggingThis ? 100 : 0,
                  }}
                  onClick={
                    dragState.dragging
                      ? () => void 0
                      : handleRoundTemplateClick(t.id)
                  }
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                      }}
                    >
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
                          marginTop: '2px',
                        }}
                      >
                        {i + 1}.
                      </span>
                      <div
                        style={{
                          marginTop: '2px',
                          width: 'calc(100% - 100px)',
                          overflow: 'hidden',
                          whiteSpace: 'pre',
                          marginRight: '8px',
                          textOverflow: 'ellipsis',
                          textAlign: 'left',
                        }}
                      >
                        <span>{t.title}</span>
                      </div>
                      <div
                        style={{
                          width: '22px',
                          flexShrink: 0,
                        }}
                        onClick={handleEditRoundTemplateClick(t.id)}
                      >
                        <Img alt="Edit" src="/res/edit.svg" />
                      </div>
                    </div>
                  </div>
                </Button>
              </div>
            );
          })}
          <Form method="post" id="reorder-rounds-form">
            {dragWasEdited ? (
              <div
                style={{
                  margin: '16px 0',
                  display: 'flex',
                }}
              >
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
                    setOrderedRoundTemplates(
                      loaderResponse?.data?.quizTemplate?.roundOrder ?? []
                    );
                  }}
                >
                  <IconLeft src="/res/cancel.svg" /> Cancel
                </Button>
              </div>
            ) : null}
          </Form>
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
