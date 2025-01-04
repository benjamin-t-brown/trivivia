import React from 'react';
import InputLabel from './InputLabel';
import Input from './Input';
import { getColors } from 'style';
import { useKeyboardEventListener } from 'hooks';

interface SearchSelectProps<T> {
  id: string;
  value?: T;
  setValue: (value: T) => void;
  label: string;
  inputStyle?: React.CSSProperties;
  getSuggestions: (filter: string) => SearchSelectOption<T>[];
}

interface SearchSelectOption<T> {
  value: T;
  label: string;
}

interface SearchSelectState {
  filter: string;
  suggestionsVisible: boolean;
  selIndex: number;
}

type SearchSelectActionType =
  | 'showSuggestions'
  | 'hideSuggestions'
  | 'setFilter'
  | 'confirmSuggestion'
  | 'selectSuggestion';

export function SearchSelect<T>(props: SearchSelectProps<T>) {
  const [state, dispatch] = React.useReducer(
    (
      state: SearchSelectState,
      action: {
        type: SearchSelectActionType;
        filter?: string;
        suggestionIndex?: number;
        suggestionValue?: T;
      }
    ) => {
      const nextState = { ...state };
      switch (action.type) {
        case 'showSuggestions':
          nextState.suggestionsVisible = true;
          const ind = props
            .getSuggestions(state.filter)
            .findIndex(s => s.value === props.value);
          if (ind > -1) {
            nextState.selIndex = ind;
          } else {
            nextState.selIndex = 0;
          }
          const elem = document.getElementById(props.id + '-suggestions');
          if (elem) {
            elem.scrollTop = 32 * (nextState.selIndex - 1);
          }
          break;
        case 'hideSuggestions': {
          nextState.suggestionsVisible = false;
          nextState.filter = '';
          nextState.selIndex = 0;
          const elem = document.getElementById(props.id + '-suggestions');
          if (elem) {
            elem.scrollTop = 0;
          }
          break;
        }
        case 'setFilter':
          nextState.filter = action.filter ?? '';
          break;
        case 'confirmSuggestion':
          setTimeout(() => {
            if (
              state.suggestionsVisible &&
              action.suggestionValue !== undefined
            ) {
              props.setValue(action.suggestionValue);
            }
          }, 20);
          nextState.suggestionsVisible = false;
          nextState.filter = '';
          nextState.selIndex = 0;

          break;
        case 'selectSuggestion': {
          nextState.selIndex = action.suggestionIndex ?? 0;
          const elem = document.getElementById(props.id + '-suggestions');
          if (elem) {
            elem.scrollTop = 32 * (nextState.selIndex - 1);
          }
          break;
        }
      }

      return nextState;
    },
    {
      filter: '',
      suggestionsVisible: false,
      selIndex: 0,
    }
  );

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch({ type: 'showSuggestions' });
  };
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
    e.preventDefault();
    dispatch({ type: 'showSuggestions' });
  };

  const closeSuggestionBox = () => {
    dispatch({ type: 'hideSuggestions' });
  };

  const handleBlur = () => {
    closeSuggestionBox();
  };

  const handleSuggestionClick = (i: number) => {
    dispatch({
      type: 'confirmSuggestion',
      suggestionIndex: i,
      suggestionValue: suggestions[i].value,
    });
  };

  useKeyboardEventListener(
    e => {
      if (!state.suggestionsVisible) {
        return;
      }

      let nextSelIndex = state.selIndex;
      if (e.key === 'ArrowDown') {
        nextSelIndex = Math.min(state.selIndex + 1, suggestions.length - 1);
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === 'ArrowUp') {
        nextSelIndex = Math.max(state.selIndex - 1, 0);
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === 'Enter') {
        props.setValue(suggestions[state.selIndex].value);
        e.preventDefault();
        e.stopPropagation();
        dispatch({
          type: 'confirmSuggestion',
          suggestionIndex: state.selIndex,
          suggestionValue: suggestions[state.selIndex].value,
        });
        return;
      }
      dispatch({ type: 'selectSuggestion', suggestionIndex: nextSelIndex });
    },
    [state, dispatch]
  );

  const suggestions = props.getSuggestions(state.filter);
  const obj = suggestions.find(s => s.value === props.value);

  return (
    <div>
      <div>
        <InputLabel htmlFor={props.id + '-filter'}>
          {props.label ?? 'Search'}
        </InputLabel>
        <Input
          value={state.suggestionsVisible ? state.filter : String(obj?.label)}
          id={props.id}
          name={props.id}
          onChange={e =>
            dispatch({ type: 'setFilter', filter: e.target.value })
          }
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={handleInputClick}
          style={props.inputStyle}
          autoComplete="off"
        />
      </div>
      <div
        id={props.id + '-suggestions'}
        style={{
          display: state.suggestionsVisible ? 'block' : 'none',
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
                i === state.selIndex
                  ? getColors().PRIMARY
                  : getColors().BACKGROUND2,
              alignItems: 'center',
              border:
                '1px solid ' +
                (i === state.selIndex
                  ? getColors().PRIMARY
                  : getColors().BACKGROUND),
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
