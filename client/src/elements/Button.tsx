import { colorsDark, colorsLight, getColors } from 'style';
import styled from 'styled-components';

export interface IButtonProps {
  color?: 'primary' | 'secondary' | 'tertiary' | 'plain' | 'cancel';
  flex?: boolean;
  center?: boolean;
  disabled?: boolean;
}

// export const isButtonDark = (color?: IButtonProps['color']) => {
//   const backgroundColor = getColors()[color ?? 'primary'];
//   if (backgroundColor && getContrastYIQ(backgroundColor) === 'light') {
//     return true;
//   }
//   return false;
// };

// function getContrastYIQ(hexColor: string): 'light' | 'dark' {
//   hexColor = hexColor.replace(/^#/, '');

//   const r = parseInt(hexColor.substr(0, 2), 16);
//   const g = parseInt(hexColor.substr(2, 2), 16);
//   const b = parseInt(hexColor.substr(4, 2), 16);

//   const yiq = (r * 299 + g * 587 + b * 114) / 1000;

//   return yiq >= 128 ? 'dark' : 'light';
// }

const Button = styled.button<IButtonProps>(props => {
  const obj = {
    primary: getColors().PRIMARY,
    secondary: getColors().SECONDARY,
    tertiary: getColors().TERTIARY,
    plain: 'transparent',
    cancel: getColors().CANCEL,
  };
  const ret: Record<string, string | undefined> = {
    margin: '4px 0px',
    padding: '8px',
    background: obj[props.color ?? 'primary'],
    color: colorsDark.TEXT_DEFAULT,
    fontSize: '16px',
    cursor: 'pointer',
    border:
      props.color === 'plain' ? '0' : '1px solid ' + getColors().BACKGROUND2,
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
    ret.cursor = 'default';
  }

  return ret;
});

export default Button;
