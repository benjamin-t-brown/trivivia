import React from 'react';
import { getColors, LAYOUT_MAX_WIDTH } from 'style';
import styled from 'styled-components';
import Button from './Button';

export interface DialogBoxProps {
  type: 'info' | 'confirm';
  body: React.FC;
  open: boolean;
  title?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

const Root = styled.div<{ visible: boolean }>(props => {
  return {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    display: props.visible ? 'flex' : 'none',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.25)',
    zIndex: '99',
  };
});

const InnerRoot = styled.div<Object>(() => {
  return {
    maxWidth: LAYOUT_MAX_WIDTH,
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 16px',
    background: getColors().BACKGROUND2,
    boxShadow: '0px 0px 16px 0px rgba(0,0,0,0.75)',
  };
});

const Title = styled.div<Object>(() => {
  return {
    margin: '16px 0px',
    fontSize: '2rem',
    textTransform: 'uppercase',
    color: getColors().TEXT_DESCRIPTION,
  };
});

const ActionButtonsContainer = styled.div<Object>(() => {
  return {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
    margin: '16px 0px',
  };
});

const DialogBox = (props: DialogBoxProps) => {
  const Body = props.body;

  const handleConfirm = () => {
    if (props.onConfirm) {
      props.onConfirm();
    }
  };

  const handleCancel = () => {
    if (props.onCancel) {
      props.onCancel();
    }
  };

  return (
    <Root visible={props.open}>
      <InnerRoot>
        <Title>
          {props.title ?? (props.type === 'confirm' ? 'Confirm' : 'Info')}
        </Title>
        <div>
          <Body />
        </div>
        <ActionButtonsContainer>
          <Button
            color="primary"
            onClick={handleConfirm}
            style={{
              width: '100px',
            }}
          >
            {props.confirmLabel ?? 'Yes'}
          </Button>
          {props.type === 'confirm' ? (
            <Button
              color="cancel"
              onClick={handleCancel}
              style={{
                width: '100px',
                marginLeft: '16px',
              }}
            >
              {props.cancelLabel ?? 'Cancel'}
            </Button>
          ) : null}
        </ActionButtonsContainer>
      </InnerRoot>
    </Root>
  );
};

export default DialogBox;
