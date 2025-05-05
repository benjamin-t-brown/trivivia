import React from 'react';
import PaginatedList, { PaginatedListProps } from './PaginatedList';
import Input from './Input';
import InputLabel from './InputLabel';
import { debounce, updateUrlParams } from 'utils';
import { useSearchParams } from 'react-router-dom';

const debounceUpdateUrlParams = debounce((filter: string, page: string) => {
  updateUrlParams({ filter, page });
}, 500);

function PaginatedListFiltered<T>(
  props: PaginatedListProps<T> & {
    id: string;
    filterLabel?: string;
    isFiltered: (item: T, filter: string) => boolean;
  }
) {
  const [searchParams] = useSearchParams();
  const paramsFilter = searchParams.get('filter') ?? '';
  let paramsPage = parseInt(searchParams.get('page') ?? '0');
  if (isNaN(paramsPage)) {
    paramsPage = 0;
  }
  const [filter, setFilter] = React.useState(paramsFilter);
  const [defaultPage, setDefaultPage] = React.useState(paramsPage);

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
          onChange={e => {
            setFilter(e.target.value);
            debounceUpdateUrlParams(e.target.value, String(defaultPage));
          }}
          style={{
            width: '75%',
            minWidth: '160px',
            maxWidth: '400px',
          }}
        />
      </div>
      <PaginatedList
        items={props.items.filter(item => props.isFiltered(item, filter))}
        renderItem={props.renderItem}
        maxItemsPerPage={props.maxItemsPerPage}
        startingPage={defaultPage}
        onPageChange={page => {
          setDefaultPage(page);
          updateUrlParams({ filter, page: String(page) });
        }}
      />
    </div>
  );
}

export default PaginatedListFiltered;
