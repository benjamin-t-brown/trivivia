import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isNoRedirectSearch, setNoRedirect } from 'utils';

const Root = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const search = window.location.search;
    if (isNoRedirectSearch(search)) {
      setNoRedirect(true);
    }
    navigate('/join' + search);
  }, []);

  return <div>This is the Root page.</div>;
};

export const RootRoute = {
  path: '',
  element: <Root />,
};
