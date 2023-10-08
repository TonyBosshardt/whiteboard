import React, { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import WithLocalStorage from '../../util/WithLocalStorage.js';
import { KEYBOARD_CODES } from '../../util/constants.js';
import TagItem from './TagItem.js';
import TaskItem from './TaskItem.js';

const makeLocalStorageKey = (isoDate, tagId) => `${isoDate}_${tagId}`;

const TaskContent = ({
  keyedTags,
  tagId,
  tags,
  completeTasks,
  incompleteTasks,
  isDayMode,
  isoDate,
  getLocalValue,
  setLocalValue,
}) => {
  const totalTaskCount = completeTasks.length + incompleteTasks.length;
  const tasksAllComplete = completeTasks.length === totalTaskCount;

  const localStorageTagId = makeLocalStorageKey(isoDate, tagId);

  const [isExpanded, _setIsExpanded] = useState(
    getLocalValue(localStorageTagId, {
      defaultValue: !tasksAllComplete ? 1 : 0,
      isNumeric: true,
    }),
  );

  const setIsExpanded = (nextState) => {
    _setIsExpanded(nextState);

    setLocalValue(localStorageTagId, nextState ? 1 : 0);
  };

  useHotkeys([KEYBOARD_CODES.E], () => {
    if (localStorageTagId === window.currentHoverTagSection) {
      setIsExpanded(!isExpanded);
    }
  });

  return (
    <div
      className="flex flex-col"
      onMouseEnter={() => (window.currentHoverTagSection = localStorageTagId)}
      onMouseLeave={() => (window.currentHoverTagSection = null)}
    >
      <TagItem
        tag={keyedTags[tagId]}
        tasksAllComplete={tasksAllComplete}
        totalTaskCount={totalTaskCount}
        completedTaskCount={completeTasks.length}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        isDayMode={isDayMode}
        incompleteTasks={incompleteTasks}
      />
      {isExpanded ? (
        <div className="flex flex-col" style={{ marginBottom: '0.5em' }}>
          {incompleteTasks.map((task) => (
            <TaskItem key={task.id} task={task} isDayMode={isDayMode} tags={tags} />
          ))}
          {completeTasks.map((task) => (
            <TaskItem key={task.id} task={task} isDayMode={isDayMode} tags={tags} />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default WithLocalStorage(TaskContent);
