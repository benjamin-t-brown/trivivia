import React, { useEffect } from 'react';
import { useRouteError } from 'react-router-dom';
import { getColors } from 'style';
import StatusTextError from './StatusTextError';

export interface FormError {
  message: string;
  values: Record<string, any>;
}

const FormErrorText = (props: {
  style?: Record<string, string>;
  message?: string;
}) => {
  const routeError = useRouteError() as FormError;

  if (!routeError) {
    return <div></div>;
  }

  return props.message ?? routeError.message ? (
    <p
      style={{
        color: getColors().ERROR_TEXT,
        ...(props.style ?? {}),
      }}
    >
      {props.message ?? routeError.message}
    </p>
  ) : (
    <StatusTextError />
  );
};

export default FormErrorText;
