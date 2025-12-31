import React from 'react';
import Img from './Img';

const IconRight = (props: {
  src: string;
  verticalAdjust?: number;
  style?: Record<string, string>;
  title?: string;
}) => {
  return (
    <Img
      alt="icon"
      style={{
        width: '20px',
        transform: `translateY(${props.verticalAdjust ?? 0}px)`,
        float: 'right',
        marginLeft: '8px',
        ...(props.style ?? {}),
      }}
      title={props.title}
      src={props.src}
    />
  );
};

export default IconRight;
