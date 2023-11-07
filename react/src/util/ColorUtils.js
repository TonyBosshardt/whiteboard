import _ from 'lodash';

const _convertHexToRGBA = (hex, alpha = 1, defaultValue = null) => {
  if (!hex) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    return 'rgba(0,0,0,0)';
  }

  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const hexToRGBA = _.memoize(_convertHexToRGBA, (hex, alpha) => `${hex}-${alpha}`);
