import deepRename from 'deep-rename-keys';
import _ from 'lodash';

const simpleSnakeCase = _.memoize((camel) => {
  let snake = '';
  let previousCharIsA2 = false; // this adds a super crappy hack that does with our "2" tables that have weird rules
  // cellLine2Document => cell_line2document NOT cell_line2_document
  if (!camel) return camel;

  for (let ii = 0; ii < camel.length || 0; ii += 1) {
    const char = camel.charAt(ii);
    const charCode = camel.charCodeAt(ii);
    if (charCode >= 65 && charCode <= 90) {
      // guess at the fastest way to test if uppercase
      if (previousCharIsA2) {
        previousCharIsA2 = false;
        snake += char.toLowerCase();
      } else {
        snake += `_${char.toLowerCase()}`;
      }
    } else {
      previousCharIsA2 = char === '2';
      snake += char;
    }
  }
  return snake;
});

const simpleCamelCase = _.memoize((snake) => {
  let camel = '';
  let capNext = false;
  if (!snake) return snake;

  for (let ii = 0; ii < snake.length || 0; ii += 1) {
    const char = snake.charAt(ii);
    if (char === '_') {
      capNext = true;
    } else if (capNext) {
      camel += char.toUpperCase();
      capNext = false;
    } else {
      camel += char;
    }
  }
  return camel;
});

const toCase = (input, changeF) => {
  if (_.isArray(input)) {
    const retVal = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const val of input) {
      retVal.push(toCase(val, changeF));
    }
    return retVal;
  }
  if (_.isObject(input)) {
    const retVal = {};
    // eslint-disable-next-line no-restricted-syntax
    for (const [k, v] of Object.entries(input)) {
      retVal[changeF(k)] = v;
    }
    return retVal;
  }
  return changeF(input);
};

export default class CaseUtils {
  static toCamelCaseDeep(input) {
    return _.isObject(input)
      ? deepRename(input, (k) => simpleCamelCase(k))
      : simpleCamelCase(input);
  }

  static toSnakeCaseDeep(input) {
    return _.isObject(input)
      ? deepRename(input, (k) => simpleSnakeCase(k))
      : simpleSnakeCase(input);
  }

  static toSnakeCase(input) {
    return toCase(input, simpleSnakeCase);
  }

  static toCamelCase(input) {
    return toCase(input, simpleCamelCase);
  }
}
