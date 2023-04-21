import DefaultTopBar from 'components/DefaultTopBar';
import MobileLayout from 'elements/MobileLayout';
import React from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import qr from 'qrcode';

const InnerRoot = styled.div<Object>(() => {
  return {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  };
});

const QRCodeCmpt = () => {
  const params = useParams();

  const href = `${window?.location?.origin ?? ''}/live/${
    params.userFriendlyQuizId
  }`;

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
          console.log('success!');
        }
      );
    }
  }, []);

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
            }}
          >
            <br />
            <br />
            <a href={href}>{href}</a>
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

export const QRCodeRoute = {
  path: 'qr/:userFriendlyQuizId',
  element: <QRCodeCmpt />,
};
