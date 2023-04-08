import Button, { IButtonProps } from 'elements/Button';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface NavButtonProps {
  route: string;
  color?: IButtonProps['color'];
  style?: Record<string, string>;
}

const NavButton = (props: NavButtonProps & React.PropsWithChildren) => {
  const navigate = useNavigate();

  const handleClick = (ev: React.MouseEvent) => {
    ev.preventDefault();
    navigate(props.route);
  };
  return (
    <Button
      color={props.color ?? 'primary'}
      style={
        props.style ?? {
          width: '100%',
        }
      }
      onClick={handleClick}
    >
      {props.children}
    </Button>
  );
};

export default NavButton;
