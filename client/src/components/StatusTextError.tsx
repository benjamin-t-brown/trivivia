import { LocalErrorResponse } from 'actions';
import React from 'react';
import { useRouteError } from 'react-router-dom';
import { getColors } from 'style';

const StatusTextError = (props: { style?: Record<string, string> }) => {
  const routeError = useRouteError() as LocalErrorResponse;

  return (
    <p
      style={{
        color: getColors().ERROR_TEXT,
        ...(props.style ?? {}),
      }}
    >
      {routeError?.statusText}
      <br />
      <br />
      {(routeError as any)?.data}
    </p>
  );
};

export default StatusTextError;
