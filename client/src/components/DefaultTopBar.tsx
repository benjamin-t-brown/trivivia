import CardTitle from 'elements/CardTitle';
import CardTitleZone from 'elements/CardTitleZone';
import TopBar from 'elements/TopBar';
import React from 'react';
import BackButton from './BackButton';
import HomeButton from './HomeButton';
import UpButton from './UpButton';
import IconLeft from 'elements/IconLeft';

const DefaultTopBar = (props: {
  title?: string;
  useBackConfirm?: boolean;
  upTo?: string;
  disableHome?: boolean;
}) => {
  return (
    <TopBar>
      <CardTitleZone align="left">
        <BackButton useConfirm={props.useBackConfirm} />
        {props.upTo ? (
          <UpButton to={props.upTo} useConfirm={props.useBackConfirm} />
        ) : null}
      </CardTitleZone>
      <CardTitle
        style={{
          cursor: 'pointer',
        }}
        onClick={() => {
          window.location.href = '/login';
        }}
      >
        {props.title ?? (
          <>
            Trivivia
            {/* <IconLeft
              style={{
                verticalAlign: 'middle',
                visibility: 'hidden',
              }}
              verticalAdjust={-2}
              src="/res/favicon_c2.svg"
            /> */}
          </>
        )}
      </CardTitle>
      <CardTitleZone align="right">
        {!props.disableHome ? <HomeButton /> : <div></div>}
      </CardTitleZone>
    </TopBar>
  );
};

export default DefaultTopBar;
