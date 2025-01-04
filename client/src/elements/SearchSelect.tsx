import React from 'react';
import InputLabel from './InputLabel';
import Input from './Input';
import { getColors } from 'style';
import { useKeyboardEventListener } from 'hooks';

interface SearchSelectProps<T> {
  // options: SearchSelectOption<T>[];
  id: string;
  value?: T;
  setValue: (value: T) => void;
  label: string;
  inputStyle?: React.CSSProperties;
  // defaultValues?: T[];
  getSuggestions: (filter: string) => SearchSelectOption<T>[];
}

interface SearchSelectOption<T> {
  value: T;
  label: string;
}

export function SearchSelect<T>(props: SearchSelectProps<T>) {
  const [filter, setFilter] = React.useState('');
  const [suggestionsVisible, setSuggestionsVisible] = React.useState(false);
  const [selIndex, setSelIndex] = React.useState(0);

  console.log('re');

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setSuggestionsVisible(true);
  };
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    setSuggestionsVisible(true);
  };

  const closeSuggestionBox = () => {
    setFilter('');
    setSelIndex(0);
    setSuggestionsVisible(false);
    const elem = document.getElementById(props.id + '-suggestions');
    if (elem) {
      elem.scrollTop = 0;
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    closeSuggestionBox();
  };

  const handleSuggestionClick = (i: number) => {
    setSelIndex(i);
    props.setValue(suggestions[i].value);
    setTimeout(() => {
      closeSuggestionBox();
    }, 100);
  };

  useKeyboardEventListener(
    e => {
      if (!suggestionsVisible) {
        return;
      }

      let nextSelIndex = selIndex;
      if (e.key === 'ArrowDown') {
        nextSelIndex = Math.min(selIndex + 1, suggestions.length - 1);
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === 'ArrowUp') {
        nextSelIndex = Math.max(selIndex - 1, 0);
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === 'Enter') {
        props.setValue(suggestions[selIndex].value);
        closeSuggestionBox();
        e.preventDefault();
        e.stopPropagation();
      }

      const elem = document.getElementById(props.id + '-suggestions');
      if (elem) {
        elem.scrollTop = 32 * nextSelIndex;
      }
      setSelIndex(nextSelIndex);
    },
    [selIndex, setSelIndex, suggestionsVisible]
  );

  const suggestions = props.getSuggestions(filter);
  const obj = suggestions.find(s => s.value === props.value);

  return (
    <div>
      <div>
        <InputLabel htmlFor={props.id + '-filter'}>
          {props.label ?? 'Search'}
        </InputLabel>
        <Input
          value={suggestionsVisible ? filter : String(obj?.label)}
          id={props.id}
          name={props.id}
          onChange={e => setFilter(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={handleInputClick}
          style={props.inputStyle}
        />
      </div>
      <div
        id={props.id + '-suggestions'}
        style={{
          display: suggestionsVisible ? 'block' : 'none',
          width: '100%',
          background: getColors().BACKGROUND2,
          maxHeight: '124px',
          overflow: 'auto',
        }}
      >
        {suggestions.map((suggestion, i) => (
          <div
            key={suggestion.label}
            style={{
              cursor: 'pointer',
              padding: '8px',
              height: '32px',
              boxSizing: 'border-box',
              display: 'flex',
              justifyContent: 'flex-start',
              background:
                i === selIndex ? getColors().PRIMARY : getColors().BACKGROUND2,
              alignItems: 'center',
              border:
                '1px solid ' +
                (i === selIndex ? getColors().PRIMARY : getColors().BACKGROUND),
            }}
            // onMouseDown={() => handleSuggestionClick(i)  () => {
            //   console.log('set suggestion', suggestion.label);
            //   props.setValue(suggestion.value);
            //   setSuggestionsVisible(false);
            // }}
            onMouseDown={e => {
              e.preventDefault();
              e.stopPropagation();
              handleSuggestionClick(i);
            }}
            // onTouchStart={e => {
            //   handleSuggestionClick(i);
            // }}
          >
            {suggestion.label}
          </div>
        ))}
      </div>
    </div>
  );
}
