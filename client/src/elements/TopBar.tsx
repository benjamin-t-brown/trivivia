import React from 'react';
import { getColors } from 'style';
import styled from 'styled-components';

const Root = styled.div<Object>(() => {
  return {
    width: '100%',
    background: getColors().PRIMARY,
    color: getColors().TEXT_DEFAULT,
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
  };
});

const InnerRoot = styled.div<Object>(() => {
  return {
    maxWidth: '800px',
    margin: '4px',
    boxSizing: 'border-box',
    width: window.innerWidth,
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
