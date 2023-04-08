import Button from 'elements/Button';
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
      <img
        style={{
          width: '22px',
        }}
        alt="Home"
        src="/res/house.svg"
      />
    </Button>
  );
};

export default HomeButton;
