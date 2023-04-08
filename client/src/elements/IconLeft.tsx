import React from 'react';

const IconLeft = (props: { src: string; style?: Record<string, string> }) => {
  return (
    <img
      alt="icon"
      style={{
        width: '20px',
        margin: '-8px 16px',
        ...(props.style ?? {}),
      }}
      src={props.src}
    />
  );
};

export default IconLeft;
