export const standardSetSelection = (selectionSet, item) => {
  const newSetObj = new Set(selectionSet);
  if (newSetObj.has(item)) {
    newSetObj.delete(item);
  } else {
    newSetObj.add(item);
  }
  return newSetObj;
};
