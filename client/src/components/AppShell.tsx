import React from 'react';
import { Outlet } from 'react-router-dom';
import DocumentTitle from './DocumentTitle';

const AppShell = () => {
  return (
    <>
      <DocumentTitle />
      <Outlet />
    </>
  );
};

export default AppShell;
