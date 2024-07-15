import React, { useEffect } from 'react';
import Button from './Button';
import styled from 'styled-components';
// import HSpace from './HSpace';
// import { getColors } from 'style';

const HSpace = styled.div<Object>(() => {
  return {
    display: 'inline-block',
    width: '8px',
  };
});

function PaginatedList<T>(props: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  maxItemsPerPage: number;
}) {
  const [page, setPage] = React.useState(0);
  const items = props.items.slice(
    page * props.maxItemsPerPage,
    (page + 1) * props.maxItemsPerPage
  );

  useEffect(() => {
    if (page > Math.ceil(props.items.length / props.maxItemsPerPage)) {
      setPage(0);
    }
  }, [page, props.items]);

  return (
    <div
      style={{
        // background: getColors().BACKGROUND2,
        // border: '1px solid ' + getColors().TEXT_DESCRIPTION,
        padding: '4px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Button
          color="plain"
          onClick={() => setPage(page - 1)}
          disabled={page === 0}
          style={{
            marginLeft: '8px',
          }}
        >
          Prev
        </Button>
        <HSpace />
        <div>
          Page {page + 1} of{' '}
          {Math.ceil(props.items.length / props.maxItemsPerPage)}
        </div>
        <HSpace />
        <Button
          color="plain"
          onClick={() => setPage(page + 1)}
          disabled={(page + 1) * props.maxItemsPerPage >= props.items.length}
          style={{
            marginRight: '16px',
          }}
        >
          Next
        </Button>
      </div>
      <div
        style={
          {
            // display: 'flex',
            // flexWrap: window.innerWidth < 600 ? 'nowrap' : 'wrap',
            // flexDirection: window.innerWidth < 600 ? 'column' : 'row',
            // alignItems: window.innerWidth < 600 ? 'center' : 'unset',
          }
        }
      >
        {items.map(props.renderItem)}
      </div>
    </div>
  );
}

export default PaginatedList;
