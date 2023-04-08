import React from 'react';
import { getColors } from 'style';

const InputLabel = (props: React.PropsWithChildren & { htmlFor?: string }) => {
  return (
    <div
      style={{
        color: getColors().TEXT_DESCRIPTION,
        fontSize: '0.75rem',
      }}
    >
      <label htmlFor={props.htmlFor}>{props.children}</label>
    </div>
  );
};

export default InputLabel;
