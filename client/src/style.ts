import { getSettingsFromLs } from 'utils';

export const colorsDark = {
  PRIMARY: '#005278',
  SECONDARY: '#202020',
  CANCEL: '#561616',
  BACKGROUND: '#111',
  BACKGROUND2: '#333',
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
  SECONDARY: '#202020',
  CANCEL: '#561616',
  BACKGROUND: '#FFF',
  BACKGROUND2: '#ededed',
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
