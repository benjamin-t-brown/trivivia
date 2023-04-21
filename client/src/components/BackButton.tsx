import Button from 'elements/Button';
import Img from 'elements/Img';
import { useConfirmDialog } from 'hooks';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
  useConfirm?: boolean;
}

const BackButton = (props: BackButtonProps) => {
  const navigate = useNavigate();

  const { confirmDialog, setOpen } = useConfirmDialog({
    title: 'Back',
    body: () => {
      return (
        <div>
          Are you sure you wish to go back? Changes on this page will be lost.
        </div>
      );
    },
    onConfirm: () => {
      navigate(-1);
    },
    cancelLabel: 'Cancel',
  });

  const handleClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    if (props.useConfirm) {
      setOpen(true);
    } else {
      navigate(-1);
    }
  };

  return (
    <>
      <Button color="plain" onClick={handleClick}>
        <Img
          style={{
            width: '22px',
            transform: 'rotate(90deg)',
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

export default BackButton;
