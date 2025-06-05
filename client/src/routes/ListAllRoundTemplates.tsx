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
  QuestionTemplateResponse,
  QuizTemplateResponse,
  RoundTemplateResponse,
} from 'shared/responses';
import TextCenter from 'elements/TextCenter';
import { getColors, LAYOUT_MAX_WIDTH } from 'style';
import InlineIconButton from 'elements/InlineIconButton';
import IconLeft from 'elements/IconLeft';
import HiddenTextField from 'components/HiddenTextField';
import {
  removeFromCache,
  updateCacheQuizTemplate,
  updateCacheRoundTemplate,
} from 'cache';
import Img from 'elements/Img';
import PaginatedList from 'elements/PaginatedList';
import FormErrorText, { FormError } from 'components/FormErrorText';
import AnimatedEllipsis from 'elements/AnimatedEllipsis';
import { LoadingPage } from 'components/LoadingPage';
import PaginatedListFiltered from 'elements/PaginatedListFiltered';
import { ButtonAction } from 'elements/ButtonAction';
import { IconButton } from 'elements/IconButton';
import { JustifyContentDiv } from 'elements/JustifyContentDiv';
import { HSpace } from 'elements/HSpace';
import { StickyContent } from 'elements/FixedContent';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

interface ReorderRoundsValues {
  selectedTemplatesJson: string;
}
const action = createAction(async (values: ReorderRoundsValues, params) => {
  if (!values.selectedTemplatesJson) {
    throwValidationError('Please fill out the form.', values);
  }

  const selectedTemplates = JSON.parse(values.selectedTemplatesJson);

  if (!selectedTemplates || selectedTemplates.length === 0) {
    throwValidationError('Please select at least one round template.', values);
  }

  for (const importedRoundTemplate of selectedTemplates) {
    const questionTemplatesResponse = await fetchAsync<
      QuestionTemplateResponse[]
    >('get', '/api/template/all/question/' + importedRoundTemplate.id);

    if (!questionTemplatesResponse) {
      throwValidationError(
        'Could not fetch question templates for ' + importedRoundTemplate.title,
        values
      );
    }

    const result = await fetchAsync<RoundTemplateResponse>(
      'post',
      '/api/template/round',
      { ...importedRoundTemplate, quizTemplateId: params.quizTemplateId }
    );

    if (result.error) {
      throwValidationError(result.message, values);
    }

    for (const questionId of importedRoundTemplate.questionOrder) {
      const question: Partial<QuestionTemplateResponse> | undefined =
        questionTemplatesResponse.data.find(q => q.id === questionId);
      if (question) {
        delete question.id;
        delete question.roundTemplateId;

        const response = await fetchAsync<RoundTemplateResponse>(
          'post',
          '/api/template/question',
          {
            ...question,
            answers: JSON.stringify(question.answers),
            roundTemplateId: result.data.id,
          }
        );
        if (response.error) {
          throw {
            message: response.message,
            values,
          } as FormError;
        }
      }
    }

    removeFromCache('get', '/api/template/round/' + result.data.id);
  }

  removeFromCache('get', '/api/template/all/round/' + params.quizTemplateId);
  removeFromCache('get', '/api/template/quiz/' + params.quizTemplateId);

  const upToUrl = `/quiz-template/${params.quizTemplateId}/round-templates`;
  return redirect(upToUrl);
});

interface ListAllRoundTemplatesLoaderResponse {
  roundTemplates: RoundTemplateResponse[];
  quizTemplate: QuizTemplateResponse;
}
const loader = async ({ params }) => {
  const roundTemplatesResponse = await fetchAsync<
    FetchResponse<RoundTemplateResponse[]>
  >('get', '/api/template/round/all');

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

const renderRoundTemplateButton = (props: {
  roundTemplate: RoundTemplateResponse;
  handleRoundTemplateClick: (id: string) => (ev: React.MouseEvent) => void;
  isSelected: boolean;
}) => {
  const t = props.roundTemplate;

  return (
    <div key={t.id}>
      <Button
        id={t.id}
        title={'Update on: ' + t.updatedOn}
        color="secondary"
        style={{
          width: '100%',
          maxWidth: LAYOUT_MAX_WIDTH,
          border: '1px solid',
          borderColor: props.isSelected
            ? getColors().SUCCESS_TEXT
            : 'transparent',
        }}
        onClick={props.handleRoundTemplateClick(t.id)}
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
            <div
              style={{
                marginTop: '2px',
                width: 'calc(100% - 20px)',
                overflow: 'hidden',
                whiteSpace: 'pre',
                marginRight: '8px',
                textOverflow: 'ellipsis',
                textAlign: 'left',
              }}
            >
              <span>
                <b>{t.quizTemplateName}:</b>
              </span>{' '}
              <span>{t.title}</span>
              <br />
              <span>{t.description}</span>
            </div>
          </div>
        </div>
      </Button>
    </div>
  );
};

const ListAllRoundTemplates = (props: { error?: boolean }) => {
  const navigate = useNavigate();
  const params = useParams();
  const fetcher = useFetcher();
  const [filter, setFilter] = React.useState('');
  const [selectedTemplateIds, setSelectedTemplateIds] = React.useState<
    string[]
  >([]);

  const isLoading = fetcher.state === 'submitting';

  const roundTemplateListResponse = useTypedLoaderData<
    FetchResponse<ListAllRoundTemplatesLoaderResponse>
  >({
    isError: props.error,
  });

  const quizTemplateId = params.quizTemplateId;
  const quizTemplate = roundTemplateListResponse?.data.quizTemplate;

  const handleSaveClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();

    const formData = new FormData();
    formData.set(
      'selectedTemplatesJson',
      JSON.stringify(
        selectedTemplateIds.map(id => {
          return roundTemplateListResponse?.data.roundTemplates.find(
            t => t.id === id
          );
        })
      )
    );
    fetcher.submit(formData, {
      method: 'post',
      action: `/quiz-template/${params.quizTemplateId}/round/all`,
    });
  };

  const handleCancelClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    navigate(-1);
  };

  const handleRoundTemplateClick = (id: string) => (ev: React.MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (selectedTemplateIds.includes(id)) {
      setSelectedTemplateIds(selectedTemplateIds.filter(t => t !== id));
    } else {
      setSelectedTemplateIds([...selectedTemplateIds, id]);
    }
  };

  const filteredItems = roundTemplateListResponse?.data.roundTemplates?.filter(
    t => {
      if (
        roundTemplateListResponse?.data.quizTemplate.roundOrder.includes(t.id)
      ) {
        return false;
      }

      return t.title.toLowerCase().includes(filter.toLowerCase());
    }
  );

  const upToUrl = `/quiz-template/${params.quizTemplateId}/round-templates`;

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!roundTemplateListResponse) {
    return (
      <>
        <DefaultTopBar upTo={upToUrl} />
        <MobileLayout topBar>
          <InnerRoot>
            <FormErrorText />
            <Button
              color="primary"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => {
                navigate(upToUrl);
              }}
            >
              Back
            </Button>
          </InnerRoot>
        </MobileLayout>
      </>
    );
  }

  return (
    <>
      <DefaultTopBar upTo={upToUrl} />
      <MobileLayout topBar>
        <InnerRoot>
          <p>Choose Round Templates</p>
          <StickyContent>
            <FormErrorText />
            <JustifyContentDiv justifyContent="left">
              <ButtonAction
                type="submit"
                color="primary"
                disabled={selectedTemplateIds.length === 0}
                onClick={handleSaveClick}
              >
                <IconButton src="/res/check-mark.svg" /> Save
              </ButtonAction>
              <HSpace />
              <ButtonAction
                type="submit"
                color="secondary"
                onClick={handleCancelClick}
              >
                <IconButton src="/res/cancel.svg" />
                Cancel
              </ButtonAction>
            </JustifyContentDiv>
          </StickyContent>
          <p></p>
          <Form method="post" id="choose-rounds-form">
            <PaginatedListFiltered
              actions={[]}
              maxItemsPerPage={20}
              items={filteredItems ?? []}
              renderItem={t =>
                renderRoundTemplateButton({
                  roundTemplate: t,
                  handleRoundTemplateClick: handleRoundTemplateClick,
                  isSelected: selectedTemplateIds.includes(t.id),
                })
              }
              isFiltered={(t, filter) =>
                Boolean(
                  t.title
                    .toLocaleLowerCase()
                    .includes(filter.toLocaleLowerCase()) ||
                    t.quizTemplateName
                      .toLocaleLowerCase()
                      .includes(filter.toLocaleLowerCase())
                )
              }
              filterLabel="Search"
              id="filter"
            ></PaginatedListFiltered>
            <p>
              <HiddenTextField name="selectedTemplatesJson" value={''} />
            </p>
          </Form>
        </InnerRoot>
      </MobileLayout>
    </>
  );
};

export const ListAllRoundTemplatesRoute = {
  path: '/quiz-template/:quizTemplateId/round/all',
  element: <ListAllRoundTemplates />,
  errorElement: <ListAllRoundTemplates error={true} />,
  action,
  loader,
};
