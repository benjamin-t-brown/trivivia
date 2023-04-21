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
} from 'react-router-dom';
import { getColors } from 'style';
import styled from 'styled-components';
import DefaultTopBar from 'components/DefaultTopBar';
import { getSettingsFromLs, saveSettingsToLs } from 'utils';
import SectionTitle from 'elements/SectionTitle';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

const Settings = (props: { error?: boolean }) => {
  const [settings, setSettings] = React.useState(getSettingsFromLs());

  console.log('SETTINGS!', settings);

  return (
    <>
      <DefaultTopBar useBackConfirm={false} />
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
                // window.location.reload();
              }}
              style={{
                transform: 'scale(1.5)',
                marginRight: '16px',
              }}
            ></input>
            <label htmlFor="lightMode">Light Mode</label>
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
