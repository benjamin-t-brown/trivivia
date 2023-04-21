import Button from 'elements/Button';
import Img from 'elements/Img';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomeButton = () => {
  const navigate = useNavigate();

  const handleClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    navigate('/landing');
  };

  return (
    <Button color="plain" onClick={handleClick}>
      <Img
        style={{
          width: '22px',
          background: 'unset',
        }}
        alt="Home"
        src="/res/house.svg"
      />
    </Button>
  );
};

export default HomeButton;
