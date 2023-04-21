import Img from 'elements/Img';
import Input from 'elements/Input';
import InputLabel from 'elements/InputLabel';
import React, { useState } from 'react';
import { QuestionTemplateResponse } from 'shared/responses';
import { getColors } from 'style';

const EditImageLink = (props: {
  questionTemplate?: QuestionTemplateResponse;
}) => {
  const [imgSrc, setImgSrc] = useState(props.questionTemplate?.imageLink ?? '');
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = ev => {
    setImgSrc(ev.target.value);
  };

  return (
    <>
      <InputLabel htmlFor="imgSrc">Question Image (optional)</InputLabel>
      <Input
        fullWidth={true}
        type="text"
        placeholder="Question Image"
        aria-label="Question Image"
        name="imageLink"
        defaultValue={imgSrc}
        onChange={handleChange}
      />
      {imgSrc ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            margin: '16px 0px',
            border: '1px solid ' + getColors().TEXT_DESCRIPTION,
          }}
        >
          <Img
            style={{
              maxWidth: '100%',
            }}
            src={imgSrc}
            alt="Image"
          />
        </div>
      ) : null}
    </>
  );
};

export default EditImageLink;
