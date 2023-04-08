import { fetchAsync } from 'actions';
import React, { useEffect } from 'react';
import { json, useLoaderData, useNavigate } from 'react-router-dom';

const loader = async () => {
  const result = await fetchAsync('delete', '/api/account/login');
  if (result.error) {
    throw new Response('', {
      status: result.status,
      statusText: result.message,
    });
  }
  return json(true);
};

const Logout = () => {
  const navigate = useNavigate();
  const didLogout = useLoaderData();

  useEffect(() => {
    if (didLogout) {
      navigate('/login');
    }
  }, [didLogout]);

  return <div>Logging out...</div>;
};

export const LogoutRoute = {
  path: 'logout',
  element: <Logout />,
  loader,
};
