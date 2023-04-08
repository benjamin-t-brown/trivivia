import { getColors } from 'style';
import styled from 'styled-components';

const CardTitle = styled.div<Object>(() => {
  return {
    textAlign: 'center',
    fontSize: '2rem',
    color: 'white',
    textTransform: 'uppercase',
    '-webkit-text-stroke': '1px',
    '-webkit-text-stroke-color': 'black',
  };
});
export default CardTitle;
