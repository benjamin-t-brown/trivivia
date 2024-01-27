import React from 'react';
import Img from './Img';

const IconLeft = (props: {
  src: string;
  verticalAdjust?: number;
  style?: Record<string, string>;
}) => {
  return (
    <Img
      alt="icon"
      style={{
        width: '20px',
        margin: '-8px 16px',
        transform: `translateY(${props.verticalAdjust ?? 0}px)`,
        ...(props.style ?? {}),
      }}
      src={props.src}
    />
  );
};

export default IconLeft;
