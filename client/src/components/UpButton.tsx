import Button from 'elements/Button';
import Img from 'elements/Img';
import { useConfirmDialog } from 'hooks';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface UpButtonProps {
  useConfirm?: boolean;
  to: string;
}

const UpButton = (props: UpButtonProps) => {
  const navigate = useNavigate();

  const { confirmDialog, setOpen } = useConfirmDialog({
    title: 'Up',
    body: () => {
      return (
        <div>
          Are you sure you wish to go up? Changes on this page will be lost.
        </div>
      );
    },
    onConfirm: () => {
      navigate(props.to);
    },
    cancelLabel: 'Cancel',
  });

  const handleClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    if (props.useConfirm) {
      setOpen(true);
    } else {
      navigate(props.to);
    }
  };

  return (
    <>
      <Button color="plain" onClick={handleClick}>
        <Img
          style={{
            width: '22px',
            transform: 'rotate(180deg)',
            background: 'unset',
          }}
          alt="Home"
          src="/res/plain-arrow.svg"
        />
      </Button>
      {confirmDialog}
    </>
  );
};

export default UpButton;
