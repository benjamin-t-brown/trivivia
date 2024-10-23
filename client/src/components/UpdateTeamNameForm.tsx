import Input from 'elements/Input';
import InputLabel from 'elements/InputLabel';
import React from 'react';
import FormErrorText from './FormErrorText';
import Button from 'elements/Button';
import IconLeft from 'elements/IconLeft';
import { useFetcher, useParams } from 'react-router-dom';

export const UpdateTeamNameForm = () => {
  const fetcher = useFetcher();
  const params = useParams();
  const formId = 'update-team-name-form';
  const [teamName, setTeamName] = React.useState('');

  const handleSubmitClick = (ev: React.MouseEvent) => {
    ev.preventDefault();

    const formData = new FormData();
    formData.set('teamName', teamName);
    fetcher.submit(formData, {
      method: 'post',
      action: `/live/${params.userFriendlyQuizId}/update`,
    });
    setTeamName('');
  };

  const isLoading = fetcher.state === 'submitting';

  return (
    <fetcher.Form method="post" id={formId}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '50%',
            minWidth: '164px',
          }}
        >
          <InputLabel htmlFor="code">Update Team Name</InputLabel>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <Input
              placeholder="Team Name"
              aria-label="Team Name"
              type="text"
              name="teamName"
              fullWidth
              value={teamName}
              onChange={ev => setTeamName(ev.target.value)}
            />
          )}
        </div>
      </div>
      <div
        style={{
          textAlign: 'center',
        }}
      >
        <FormErrorText />
      </div>
      <div style={{ height: '16px' }}></div>
      <Button
        flex
        center
        color="secondary"
        style={{
          width: '100%',
        }}
        disabled={teamName.length <= 0 || isLoading}
        type="submit"
        onClick={handleSubmitClick}
      >
        <IconLeft src="/res/edit.svg" />
        Update Team Name
      </Button>
    </fetcher.Form>
  );
};
