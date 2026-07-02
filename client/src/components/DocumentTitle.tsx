import React from 'react';
import { useLocation, useMatches } from 'react-router-dom';
import { resolvePageTitle } from 'pageTitle';

const DocumentTitle = () => {
  const { pathname } = useLocation();
  const matches = useMatches();
  const loaderData = matches[matches.length - 1]?.data;

  React.useEffect(() => {
    document.title = resolvePageTitle(pathname, loaderData);
  }, [pathname, loaderData]);

  return null;
};

export default DocumentTitle;
