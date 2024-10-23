import styled from 'styled-components';

interface IJustifyContentDivProps {
  justifyContent?: string;
  alignItems?: string;
  margin?: string;
}

export const JustifyContentDiv = styled.div<IJustifyContentDivProps>(props => {
  const ret: Record<string, string | undefined> = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: props.justifyContent ?? 'center',
    alignItems: props.alignItems ?? 'center',
    margin: props.margin ?? '0',
  };
  return ret;
});
