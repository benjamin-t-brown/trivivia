import React from 'react';
import Button from './Button';
import Img from './Img';

interface TitleAction {
  label: string;
  icon: string;
  onClick: (ev?: React.MouseEvent) => void;
}

interface TitleWithActionsProps {
  title: string;
  actions: TitleAction[];
}

export const TitleWithActions = (props: TitleWithActionsProps) => {
  return (
    <p
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 'calc(100% - 4px)',
      }}
    >
      <div
        style={{
          width: '60%',
        }}
      >
        <span>{props.title}</span>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          width: '40%',
        }}
      >
        {props.actions.map(actionDef => {
          return (
            <Button
              flex
              key={actionDef.label}
              onClick={actionDef.onClick}
              style={{
                marginLeft: '8px',
                padding: '16px',
              }}
            >
              {actionDef.icon && (
                <Img
                  alt="action"
                  src={actionDef.icon}
                  draggable={false}
                  style={{
                    width: '16px',
                    height: '16px',
                  }}
                />
              )}
              <span
                className="hide-on-narrow-screen"
                style={{
                  marginLeft: '16px',
                }}
              >
                {actionDef.label}
              </span>
            </Button>
          );
        })}
      </div>
    </p>
  );
};
