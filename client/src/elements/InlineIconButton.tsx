import React, { MouseEvent } from 'react';
import { getColors } from 'style';
import styled from 'styled-components';
import Img from './Img';

const Root = styled.span(() => {
  return {
    width: '22px',
    height: '22px',
    display: 'inline-block',
    borderRadius: '24px',
    marginRight: '16px',
    verticalAlign: 'bottom',
    background: getColors().SECONDARY,
    cursor: 'pointer',
  };
});

interface InlineIconButtonProps {
  onClick?: (ev: MouseEvent) => void;
  onMouseDown?: (ev: any) => void;
  onTouchStart?: (ev: any) => void;
  imgSrc: string;
}

const InlineIconButton = (
  props: InlineIconButtonProps & React.PropsWithChildren
) => {
  return (
    <Root
      onClick={props.onClick}
      onMouseDown={props.onMouseDown}
      onTouchStart={props.onTouchStart}
    >
      <Img
        style={{
          width: '22px',
        }}
        alt="Icon"
        src={props.imgSrc}
      />
      {props.children}
    </Root>
  );
};

export default InlineIconButton;
