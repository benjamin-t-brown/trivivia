export const replaceInTemplate = (
  template: string,
  key: string,
  value: string | number
) => {
  const regex = new RegExp(`{${key}}`, 'g');
  return template.replace(regex, String(value));
};
