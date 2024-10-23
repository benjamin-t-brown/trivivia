import { createAction, fetchAsync, LocalErrorResponse } from 'actions';
import TopBar from 'elements/TopBar';
import Button from 'elements/Button';
import Input from 'elements/Input';
import MobileLayout from 'elements/MobileLayout';
import React from 'react';
import {
  Form,
  useRouteError,
  useNavigation,
  useNavigate,
  redirect,
  useFetcher,
  json,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { getColors } from 'style';
import styled from 'styled-components';
import DefaultTopBar from 'components/DefaultTopBar';
import { getSettingsFromLs, saveSettingsToLs } from 'utils';
import SectionTitle from 'elements/SectionTitle';
import { throwValidationError } from 'hooks';
import { AccountResponse } from 'shared/responses';
import FormErrorText from 'components/FormErrorText';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

const updatePwAction = createAction(
  async (values: { password: string }, params) => {
    if (!values.password) {
      throwValidationError('Please fill out the form.', values);
    }
    if (values.password.length < 3 || values.password.length > 50) {
      throwValidationError('Invalid password.', values);
    }

    const result = await fetchAsync<any>('put', `/api/account/pw`, {
      password: values.password,
    });

    if (result.error) {
      throwValidationError(result.message, values);
    }

    return redirect('/admin-settings?success=true');
  }
);

const loader = async () => {
  const accountResponse = await fetchAsync<AccountResponse>(
    'get',
    '/api/account'
  );

  if (accountResponse.error) {
    return redirect('/login');
  }

  return json(accountResponse);
};

const Settings = (props: { error?: boolean; admin?: boolean }) => {
  const [settings, setSettings] = React.useState(getSettingsFromLs());
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [params] = useSearchParams();
  const fetcher = useFetcher();

  const handleUpdatePasswordChange: React.ChangeEventHandler<
    HTMLInputElement
  > = ev => {
    setPassword(ev.target.value);
  };

  const handleUpdatePasswordSubmitClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    const formData = new FormData();
    formData.append('password', password);
    fetcher.submit(formData, {
      method: 'put',
    });
    setPassword('');
  };

  const handleLogoutClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    window.location.href = '/logout';
  };

  if (loading && fetcher.state === 'submitting') {
    setLoading(false);
    setPassword('');
  }

  console.log('PARAMS', params);

  return (
    <>
      <DefaultTopBar useBackConfirm={false} disableHome={!props.admin} />
      <MobileLayout topBar>
        <InnerRoot>
          <SectionTitle>Settings</SectionTitle>
          <div>
            <input
              type="checkbox"
              name="lightMode"
              id="lightMode"
              checked={settings.lightMode}
              onChange={ev => {
                const newSettings = {
                  ...settings,
                  lightMode: ev.target.checked,
                };
                setSettings(newSettings);
                saveSettingsToLs(newSettings);
                window.location.reload();
              }}
              style={{
                transform: 'scale(1.5)',
                marginRight: '16px',
              }}
            ></input>
            <label htmlFor="lightMode">Light Mode</label>

            {props.admin ? (
              <fetcher.Form id="update-pw-form">
                <div
                  style={{
                    width: '50%',
                    marginTop: '16px',
                  }}
                >
                  <label htmlFor="updatePw">Update Password</label>
                  <Input
                    fullWidth={true}
                    type="password"
                    placeholder="New Password"
                    aria-label="password"
                    name="updatePw"
                    maxLength={50}
                    minLength={3}
                    value={password}
                    onChange={handleUpdatePasswordChange}
                  />
                  <Button
                    disabled={loading}
                    color="primary"
                    style={{ marginTop: '8px' }}
                    onClick={handleUpdatePasswordSubmitClick}
                  >
                    {loading ? 'Loading...' : 'Update Password'}
                  </Button>
                  {params.get('success') ? (
                    <div style={{ color: getColors().SUCCESS_TEXT }}>
                      Password saved successfully.
                    </div>
                  ) : null}
                </div>
                <div
                  style={{
                    marginTop: '16px',
                  }}
                >
                  <Button
                    disabled={loading}
                    color="secondary"
                    // style={{ marginTop: '8px' }}
                    onClick={handleLogoutClick}
                  >
                    Logout
                  </Button>
                </div>
              </fetcher.Form>
            ) : null}
            <FormErrorText />
          </div>
        </InnerRoot>
      </MobileLayout>
    </>
  );
};

export const SettingsRoute = {
  path: 'settings',
  element: <Settings />,
};

export const SettingsAdminRoute = {
  path: 'admin-settings',
  element: <Settings admin={true} />,
  errorElement: <Settings error={true} admin={true} />,
  action: updatePwAction,
  loader,
};
