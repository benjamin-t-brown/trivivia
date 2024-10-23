import styled from 'styled-components';

export const HSpace = styled.div<{ width?: string }>(props => {
  return {
    width: props.width ?? '16px',
    display: 'inline-block',
  };
});
