import { getColors } from 'style';
import styled from 'styled-components';

const SectionTitle = styled.p<Object>(() => {
  return {
    textTransform: 'uppercase',
    textDecoration: 'underline',
    color: getColors().TEXT_DEFAULT,
  };
});

export default SectionTitle;
