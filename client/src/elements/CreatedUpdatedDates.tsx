import React from 'react';
import RelativeTime from 'react-relative-time';
import { getColors } from 'style';

const DateRow = (props: {
  label: string;
  value: string;
  labelWidth: number;
}) => (
  <div
    style={{
      display: 'flex',
      padding: '4px 0',
    }}
  >
    <span
      style={{
        fontWeight: 'bold',
        width: `${props.labelWidth}px`,
        flexShrink: 0,
      }}
    >
      {props.label}
    </span>
    <RelativeTime value={props.value} titleformat="iso8601" />
  </div>
);

const CreatedUpdatedDates = (props: {
  creationDate?: string;
  updatedOn?: string;
  labelWidth?: number;
  style?: React.CSSProperties;
}) => {
  const { creationDate, updatedOn, labelWidth = 100, style } = props;

  if (!creationDate && !updatedOn) {
    return null;
  }

  return (
    <div
      style={{
        width: '100%',
        boxSizing: 'border-box',
        fontSize: '14px',
        color: getColors().TEXT_DESCRIPTION,
        ...style,
      }}
    >
      {creationDate ? (
        <DateRow label="Created" value={creationDate} labelWidth={labelWidth} />
      ) : null}
      {updatedOn ? (
        <DateRow label="Updated" value={updatedOn} labelWidth={labelWidth} />
      ) : null}
    </div>
  );
};

export default CreatedUpdatedDates;
