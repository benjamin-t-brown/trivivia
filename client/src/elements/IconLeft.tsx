import React from 'react';
import Img from './Img';

const IconLeft = (props: { src: string; style?: Record<string, string> }) => {
  return (
    <Img
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
