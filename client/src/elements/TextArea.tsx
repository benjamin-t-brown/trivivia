import styled from 'styled-components';

const TextArea = styled.textarea<{ fullWidth?: boolean }>(props => {
  return {
    margin: '4px 0px',
    padding: '8px',
    width: props.fullWidth ? '100%' : undefined,
    minHeight: '120px',
    resize: 'none',
  };
});

export default TextArea;
