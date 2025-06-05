import React from 'react';
import PaginatedList, { PaginatedListProps } from './PaginatedList';
import Input from './Input';
import InputLabel from './InputLabel';
import { debounce, updateUrlParams } from 'utils';
import { useSearchParams } from 'react-router-dom';
import { ButtonAction } from './ButtonAction';
import IconLeft from './IconLeft';
import Button from './Button';
import Img from './Img';

const debounceUpdateUrlParams = debounce((filter: string, page: string) => {
  updateUrlParams({ filter, page });
}, 500);

export interface ListAction {
  label: string;
  icon: string;
  onClick: (ev?: React.MouseEvent) => void;
}

function PaginatedListFiltered<T>(
  props: PaginatedListProps<T> & {
    id: string;
    filterLabel?: string;
    isFiltered: (item: T, filter: string) => boolean;
    actions: ListAction[];
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 'calc(100% - 4px)',
        }}
      >
        <div
          style={{
            width: '75%',
          }}
        >
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
              width: '100%',
              minWidth: '160px',
              maxWidth: '400px',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
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
