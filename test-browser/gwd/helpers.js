export const removeUnnecessaryWhitespace = text => {
  return text.replace(/\s+/g, ' ').trim();
};
