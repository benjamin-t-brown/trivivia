import { createAction, fetchAsync, LocalErrorResponse } from 'actions';
import TopBar from 'elements/TopBar';
import Button from 'elements/Button';
import CardTitle from 'elements/CardTitle';
import Input from 'elements/Input';
import MobileLayout from 'elements/MobileLayout';
import React from 'react';
import { Form, useRouteError, useNavigation, redirect } from 'react-router-dom';
import { getColors } from 'style';
import styled from 'styled-components';

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

const Login = (props: { error?: boolean }) => {
  const routeError = useRouteError() as LocalErrorResponse;
  const navigation = useNavigation();

  return (
    <>
      <TopBar>
        <div />
        <CardTitle>Login</CardTitle>
        <div />
      </TopBar>
      <MobileLayout topBar>
        <Form method="post" id="login-form">
          <InnerRoot>
            <img
              src="/res/sign-in.avif"
              alt="Sign In Banner"
              style={{
                width: '25%',
                margin: '48px',
                minWidth: '300px',
              }}
            />
            <p>Login to a Trivivia quiz admin account.</p>
            <Input
              placeholder="Email"
              aria-label="Email"
              type="text"
              name="email"
              fullWidth
            />
            <Input
              placeholder="Password"
              aria-label="Password"
              type="password"
              name="password"
              fullWidth
            />
            {navigation.state === 'idle' ? (
              <Button
                type="submit"
                style={{
                  width: '100%',
                  maxWidth: '500px',
                }}
              >
                Login
              </Button>
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
            <p>
              <span>
                {"Don't"} have an account? <a href="/signup">Signup</a> instead!
              </span>
            </p>
            <p>
              <span>
                Looking to join a quiz? <a href="/join">Head here!</a>
              </span>
            </p>
          </InnerRoot>
        </Form>
      </MobileLayout>
    </>
  );
};

export const LoginRoute = {
  path: 'login',
  element: <Login />,
  errorElement: <Login error={true} />,
  action,
};
