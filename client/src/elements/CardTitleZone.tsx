import React from 'react';
import styled from 'styled-components';

const CardTitleZone = styled.div<
  React.PropsWithChildren & { align: 'left' | 'right' }
>(props => {
  return {
    width: '100px',
    display: 'flex',
    justifyContent: props.align === 'right' ? 'flex-end' : 'flex-start',
  };
});

export default CardTitleZone;
