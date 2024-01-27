import { colorsDark, getColors } from 'style';
import styled from 'styled-components';

export interface IButtonProps {
  color?: 'primary' | 'secondary' | 'plain' | 'cancel';
  flex?: boolean;
  center?: boolean;
  disabled?: boolean;
}
const Button = styled.button<IButtonProps>(props => {
  const obj = {
    primary: getColors().PRIMARY,
    secondary: getColors().SECONDARY,
    plain: 'transparent',
    cancel: getColors().CANCEL,
  };
  const ret: Record<string, string | undefined> = {
    margin: '4px 0px',
    padding: '8px',
    background: obj[props.color ?? 'primary'],
    color: colorsDark.TEXT_DEFAULT,
    fontFamily: 'monospace',
    fontSize: '18px',
    cursor: 'pointer',
    border:
      props.color === 'plain' ? '0' : '1px solid ' + getColors().BACKGROUND2,
    // I hate it
    // borderRadius: '12px',
  };
  if (props.flex) {
    ret.display = 'flex';
    ret.alignItems = 'center';
    if (props.center) {
      ret.justifyContent = 'center';
    }
  }
  if (props.disabled) {
    ret.color = colorsDark.TEXT_DESCRIPTION;
    ret.opacity = '0.8';
    ret.filter = 'grayscale(0.5)';
    ret.cursor = 'default';
  }

  return ret;
});

export default Button;
