import React from 'react';
import Input from 'elements/Input';

const HiddenTextField = (props: { value: string; name: string }) => {
  return (
    <Input
      type="text"
      name={props.name}
      defaultValue={props.value}
      style={{
        display: 'none',
      }}
    />
  );
};

export default HiddenTextField;
