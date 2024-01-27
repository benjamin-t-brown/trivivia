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
    '@media (max-width: 500px) ': {
      fontSize: '1.25rem',
      '-webkit-text-stroke-color': 'rgba(0, 0, 0, 0.5)',
    },
  };
});
export default CardTitle;
