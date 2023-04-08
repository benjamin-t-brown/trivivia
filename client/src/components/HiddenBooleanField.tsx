import React from 'react';
import Input from 'elements/Input';

const HiddenBooleanField = (props: { value: boolean; name: string }) => {
  return (
    <Input
      type="checkbox"
      name={props.name}
      defaultChecked={Boolean(props.value)}
      style={{
        display: 'none',
      }}
    />
  );
};

export default HiddenBooleanField;
