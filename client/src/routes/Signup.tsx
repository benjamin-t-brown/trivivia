import { createAction, fetchAsync } from 'actions';
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
} from 'react-router-dom';
import { getColors } from 'style';
import styled from 'styled-components';

type LocalErrorResponse = Response | undefined;

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

export interface ISignupAction {
  email: string;
  password: string;
}
const action = createAction(async (values: ISignupAction) => {
  if (!values.email || !values.password) {
    throw new Response('', {
      status: 400,
      statusText: 'Please fill out the form.',
    });
  }

  const result = await fetchAsync('post', '/api/account', values);
  if (result.error) {
    throw new Response('', {
      status: result.status,
      statusText: result.message,
    });
  }
  return redirect(`/account-created`);
});

const Signup = (props: { error?: boolean }) => {
  const routeError = useRouteError() as LocalErrorResponse;
  const navigation = useNavigation();
  const navigate = useNavigate();

  const handleToLogin = (ev: React.MouseEvent) => {
    ev.preventDefault();
    navigate('/login');
  };

  return (
    <>
      <TopBar>
        <div />
        <CardTitle>Signup</CardTitle>
        <div />
      </TopBar>
      <MobileLayout topBar>
        <Form method="post" id="signup-form">
          <InnerRoot>
            <p>Signup for a new Trivivia account.</p>
            <Input
              placeholder="Email"
              aria-label="Email"
              type="text"
              name="email"
            />
            <Input
              placeholder="Password"
              aria-label="Password"
              type="password"
              name="password"
            />
            {navigation.state === 'idle' ? (
              <Button type="submit">Signup</Button>
            ) : (
              <div>Loading...</div>
            )}
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
            <p>{'Already have an account? Login instead!'}</p>
            <Button
              color="secondary"
              style={{
                width: '100%',
              }}
              onClick={handleToLogin}
            >
              Go to Login
            </Button>
          </InnerRoot>
        </Form>
      </MobileLayout>
    </>
  );
};

export const SignupRoute = {
  path: '/signup',
  element: <Signup />,
  errorElement: <Signup error={true} />,
  action,
};
