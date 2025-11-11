export const fileToTitle = (str) => {
  return str
    .replace(/^\d+_/, '')
    .replace(/_/g, ' ')
    .replace(/\.(md|mdx)$/, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
