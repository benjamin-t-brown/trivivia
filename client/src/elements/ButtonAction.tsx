import React, { PropsWithChildren } from 'react';
import Button from 'elements/Button';
import { JustifyContentDiv } from './JustifyContentDiv';

export const ButtonAction = (
  props: {
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    onClick?: (ev: React.MouseEvent) => void;
    color?: 'primary' | 'secondary' | 'cancel';
    style?: Record<string, string>;
  } & PropsWithChildren
) => {
  return (
    <JustifyContentDiv justifyContent="left">
      <Button
        type={props.type}
        disabled={props.disabled}
        color={props.color ?? 'primary'}
        style={{
          padding: '16px',
          ...(props.style ?? {}),
        }}
        onClick={props.onClick}
      >
        {props.children}
      </Button>
    </JustifyContentDiv>
  );
};
