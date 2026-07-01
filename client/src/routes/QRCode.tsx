import DefaultTopBar from 'components/DefaultTopBar';
import MobileLayout from 'elements/MobileLayout';
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import qr from 'qrcode';
import { getTeamRejoinUrl } from 'utils';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

const QRCodeCmpt = (props: { teamId?: string; teamName?: string }) => {
  const params = useParams();

  const href = props.teamId
    ? getTeamRejoinUrl(params.userFriendlyQuizId ?? '', props.teamId)
    : `${window?.location?.origin ?? ''}/join/${params.userFriendlyQuizId}`;

  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      qr.toCanvas(
        ref.current,
        href,
        {
          scale: 8,
        },
        function (error) {
          if (error) console.error(error);
        }
      );
    }
  }, [href]);

  return (
    <>
      <DefaultTopBar />
      <MobileLayout topBar>
        <InnerRoot>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              padding: '0 16px',
            }}
          >
            {props.teamName ? (
              <>
                <br />
                <strong>Team: {props.teamName}</strong>
                <p style={{ fontSize: '14px' }}>
                  Share this link so the team can rejoin and submit answers.
                </p>
              </>
            ) : (
              <>
                <br />
                <p style={{ fontSize: '14px' }}>
                  Share this link so teams can join the quiz.
                </p>
              </>
            )}
            <br />
            <a href={href} style={{ wordBreak: 'break-all' }}>
              {href}
            </a>
            <br />
            <br />
            <div>
              <canvas ref={ref} id="qr-canvas" />
            </div>
          </div>
        </InnerRoot>
      </MobileLayout>
    </>
  );
};

const TeamQRCodeCmpt = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  return (
    <QRCodeCmpt
      teamId={params.teamId}
      teamName={searchParams.get('teamName') ?? undefined}
    />
  );
};

export const QRCodeRoute = {
  path: 'qr/:userFriendlyQuizId',
  element: <QRCodeCmpt />,
};

export const TeamQRCodeRoute = {
  path: 'qr/:userFriendlyQuizId/team/:teamId',
  element: <TeamQRCodeCmpt />,
};
