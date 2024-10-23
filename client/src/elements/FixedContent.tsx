import { getColors } from 'style';
import styled from 'styled-components';

export const StickyContent = styled.div<any>(() => {
  return {
    position: 'sticky',
    top: -1,
    zIndex: 99,
    background: getColors().BODY_BACKGROUND_BASE,
  };
});
