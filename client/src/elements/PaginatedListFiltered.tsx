import React from 'react';
import PaginatedList, { PaginatedListProps } from './PaginatedList';
import Input from './Input';
import InputLabel from './InputLabel';

function PaginatedListFiltered<T>(
  props: PaginatedListProps<T> & {
    id: string;
    filterLabel?: string;
    isFiltered: (item: T, filter: string) => boolean;
  }
) {
  const [filter, setFilter] = React.useState('');
  return (
    <div>
      <div>
        <InputLabel htmlFor={props.id + '-filter'}>
          {props.filterLabel ?? 'Filter'}
        </InputLabel>
        <Input
          value={filter}
          id={props.id + '-filter'}
          name={props.id + '-filter'}
          onChange={e => setFilter(e.target.value)}
          style={{
            width: '33%',
            minWidth: '100px',
          }}
        />
      </div>
      <PaginatedList
        items={props.items.filter(item => props.isFiltered(item, filter))}
        renderItem={props.renderItem}
        maxItemsPerPage={props.maxItemsPerPage}
      />
    </div>
  );
}

export default PaginatedListFiltered;
