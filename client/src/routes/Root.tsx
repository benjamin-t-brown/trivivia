import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Root = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/join');
  }, []);

  return <div>This is the Root page.</div>;
};

export const RootRoute = {
  path: '',
  element: <Root />,
};
