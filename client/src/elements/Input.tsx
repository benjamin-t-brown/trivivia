import styled from 'styled-components';

const Input = styled.input<{ fullWidth?: boolean }>(props => {
  return {
    margin: '4px 0px',
    padding: '8px',
    width: props.fullWidth ? '100%' : undefined,
  };
});

export default Input;
