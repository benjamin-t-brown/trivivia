import React from 'react';
import { colorsDark, getColors, LAYOUT_MAX_WIDTH } from 'style';
import styled from 'styled-components';

const Root = styled.div<Object>(() => {
  return {
    width: '100%',
    height: '54px',
    background: getColors().TOP_BAR_BACKGROUND,
    color: colorsDark.TEXT_DEFAULT,
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
  };
});

const InnerRoot = styled.div<Object>(() => {
  return {
    // maxWidth: LAYOUT_MAX_WIDTH,
    margin: '0 4px',
    boxSizing: 'border-box',
    width: LAYOUT_MAX_WIDTH,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: '43px',
  };
});

const TopBar = (props: React.PropsWithChildren) => {
  return (
    <Root id="top-bar">
      <InnerRoot>{props.children}</InnerRoot>
    </Root>
  );
};

export default TopBar;
