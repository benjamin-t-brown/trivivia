import React from 'react';
import Img from './Img';

export const IconButton = (props: {
  src: string;
  verticalAdjust?: number;
  style?: Record<string, string>;
}) => {
  return (
    <Img
      alt="icon"
      style={{
        width: '20px',
        marginTop: '-8px',
        marginRight: '12px',
        transform: `translateY(${props.verticalAdjust ?? 4}px)`,
        ...(props.style ?? {}),
      }}
      src={props.src}
    />
  );
};
