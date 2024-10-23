import styled from 'styled-components';

export const VSpace = styled.div<{ width?: string }>(props => {
  return {
    height: props.width ?? '16px',
  };
});
