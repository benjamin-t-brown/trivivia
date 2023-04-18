import React from 'react';
import { getColors } from 'style';

const InputLabel = (
  props: React.PropsWithChildren & {
    htmlFor?: string;
    style?: Record<string, string>;
  }
) => {
  return (
    <div
      style={{
        color: getColors().TEXT_DESCRIPTION,
        fontSize: '0.75rem',
        ...(props.style ?? {}),
      }}
    >
      <label htmlFor={props.htmlFor}>{props.children}</label>
    </div>
  );
};

export default InputLabel;
