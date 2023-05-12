import React from 'react';
import styled from 'styled-components';
import { getSettingsFromLs } from 'utils';

const Img = styled.img<Object>(() => {
  return {
    background: getSettingsFromLs().lightMode
      ? 'rgba(0, 0, 0, 0.0)'
      : undefined,
  };
});

export default Img;
