import { getColors } from 'style';
import styled from 'styled-components';

const Input = styled.input<{ fullWidth?: boolean; disabled?: boolean }>(
  props => {
    return {
      margin: '4px 0px',
      padding: '8px',
      width: props.fullWidth ? '100%' : undefined,
      color: props.disabled ? '#111' : undefined,
      // background: props.disabled ? getColors().BACKGROUND2 : undefined,
    };
  }
);

export default Input;
