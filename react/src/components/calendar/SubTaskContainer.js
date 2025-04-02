import React, { useState } from 'react';

import WithLocalStorage from '../../util/WithLocalStorage.js';
import TaskItem from './TaskItem.js';

const makeLocalStorageKey = (taskId) => `sub_task_expand_${taskId}`;

const SubTaskContainer = ({
  task,
  subTasks,
  isDayMode,
  tags,
  selectedMode,
  effectiveCurrentDatetime,
  getLocalValue,
  setLocalValue,
  handleUpdateTasks,
}) => {
  const localStorageTagId = makeLocalStorageKey(task.id);

  const [isExpanded, _setIsExpanded] = useState(
    getLocalValue(localStorageTagId, {
      defaultValue: 1,
      isNumeric: true,
    }),
  );

  const setIsExpanded = () => {
    if (isExpanded) {
      _setIsExpanded(false);
      setLocalValue(localStorageTagId, 0);
    } else {
      _setIsExpanded(true);
      setLocalValue(localStorageTagId, 1);
    }
  };

  return (
    <>
      <TaskItem
        key={task.id}
        task={task}
        isDayMode={isDayMode}
        tags={tags}
        selectedMode={selectedMode}
        effectiveCurrentDatetime={effectiveCurrentDatetime}
        subTaskCount={subTasks.length}
        setIsExpanded={setIsExpanded}
        isExpanded={isExpanded}
        handleUpdateTasks={handleUpdateTasks}
      />
      {!!isExpanded &&
        subTasks.map((subTask) => (
          <TaskItem
            key={subTask.id}
            isSubTask
            task={subTask}
            isDayMode={isDayMode}
            tags={tags}
            selectedMode={selectedMode}
            handleUpdateTasks={handleUpdateTasks}
            effectiveCurrentDatetime={effectiveCurrentDatetime}
          />
        ))}
    </>
  );
};

export default WithLocalStorage(SubTaskContainer);
