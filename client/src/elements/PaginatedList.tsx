import React, { useEffect } from 'react';
import Button from './Button';
import styled from 'styled-components';

const HSpace = styled.div<Object>(() => {
  return {
    display: 'inline-block',
    width: '8px',
  };
});

const NextPrevArea = (props: {
  setPage: (page: number) => void;
  page: number;
  items: any[];
  maxItemsPerPage: number;
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Button
        color="plain"
        onClick={ev => {
          ev.preventDefault();
          props.setPage(props.page - 1);
        }}
        disabled={props.page === 0}
        style={{
          marginLeft: '8px',
        }}
      >
        Prev
      </Button>
      <HSpace />
      <div>
        Page {props.page + 1} of{' '}
        {Math.ceil(props.items.length / props.maxItemsPerPage)}
      </div>
      <HSpace />
      <Button
        color="plain"
        onClick={ev => {
          ev.preventDefault();
          props.setPage(props.page + 1);
        }}
        disabled={
          (props.page + 1) * props.maxItemsPerPage >= props.items.length
        }
        style={{
          marginRight: '16px',
        }}
      >
        Next
      </Button>
    </div>
  );
};

export interface PaginatedListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  maxItemsPerPage: number;
}

function PaginatedList<T>(props: PaginatedListProps<T>) {
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
        padding: '4px',
      }}
    >
      <NextPrevArea
        setPage={setPage}
        page={page}
        items={props.items}
        maxItemsPerPage={props.maxItemsPerPage}
      />
      <div>{items.map(props.renderItem)}</div>
      <NextPrevArea
        setPage={setPage}
        page={page}
        items={props.items}
        maxItemsPerPage={props.maxItemsPerPage}
      />
    </div>
  );
}

export default PaginatedList;
