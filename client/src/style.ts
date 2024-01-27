import { getSettingsFromLs } from 'utils';

export const colorsDark = {
  PRIMARY: '#005278',
  SECONDARY: '#303030',
  CANCEL: '#561616',
  BACKGROUND: '#111',
  BACKGROUND2: '#333',
  BODY_BACKGROUND:
    'linear-gradient(90deg,rgba(11, 11, 11, 1) 0%,rgba(31, 31, 31, 1) 3%,rgba(31, 31, 31, 1) 97%,rgba(11, 11, 11, 1) 100%)',
  TOP_BAR_BACKGROUND:
    'linear-gradient(90deg, rgba(0,82,120,0.25) 0%, rgba(0,82,120,1) 3%, rgba(0,82,120,1) 97%, rgba(0,82,120,0.25) 100%)',
  TEXT_DEFAULT: 'white',
  TEXT_DESCRIPTION: '#BBB',
  ERROR_TEXT: '#ff6a6a',
  ERROR_BACKGROUND: '#8f3333',
  SUCCESS_TEXT: '#5eed8a',
  SUCCESS_BACKGROUND: '#005f1b',
  PRIMARY_TEXT: '#8cdaff',
  WARNING_TEXT: '#dd9251',
};

export const colorsLight = {
  PRIMARY: '#005278',
  SECONDARY: '#303030',
  CANCEL: '#561616',
  BACKGROUND: '#FFF',
  BACKGROUND2: '#ededed',
  BODY_BACKGROUND: '#FFF',
  TOP_BAR_BACKGROUND: '#005278',
  TEXT_DEFAULT: 'black',
  TEXT_DESCRIPTION: 'rgba(0, 0, 0, 0.85)',
  ERROR_TEXT: '#aa0000',
  ERROR_BACKGROUND: '#8f3333',
  SUCCESS_TEXT: '#00aa00',
  SUCCESS_BACKGROUND: '#005f1b',
  PRIMARY_TEXT: '#005278',
  WARNING_TEXT: '#884312',
};

export const getColors = () => {
  return getSettingsFromLs().lightMode ? colorsLight : colorsDark;
};

export const MEDIA_QUERY_PHONE_WIDTH = '@media (max-width: 800px)';
