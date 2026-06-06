import React from 'react';

import DragSourceTagItem from './DragSourceTagItem.js';

const TagItem = ({
  tag,
  tasksAllComplete,
  totalTaskCount,
  isExpanded,
  setIsExpanded,
  isDayMode,
  completedTaskCount,
  incompleteTasks,
  allTasks,
  onDoubleClickHeader,
}) => {
  const { title, displayColor } = tag;

  return (
    <DragSourceTagItem
      isDayMode={isDayMode}
      setIsExpanded={setIsExpanded}
      isExpanded={isExpanded}
      tasksAllComplete={tasksAllComplete}
      displayColor={displayColor}
      title={title}
      completedTaskCount={completedTaskCount}
      totalTaskCount={totalTaskCount}
      incompleteTasks={incompleteTasks}
      allTasks={allTasks}
      onDoubleClickHeader={onDoubleClickHeader}
    />
  );
};

export default TagItem;
