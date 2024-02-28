import classNames from 'classnames';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { hexToRGBA } from '../../util/ColorUtils.js';
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
  effectiveCurrentDatetime,
  selectedMode,
}) => {
  const totalTaskCount = completeTasks.length + incompleteTasks.length;
  const tasksAllComplete = completeTasks.length === totalTaskCount;

  const selectedTag = keyedTags[tagId];

  const localStorageTagId = makeLocalStorageKey(isoDate, tagId);

  const [isExpanded, _setIsExpanded] = useState(
    getLocalValue(localStorageTagId, {
      defaultValue: !tasksAllComplete ? 1 : 0,
      isNumeric: true,
    }),
  );

  useEffect(() => {
    const elem = document.getElementById(localStorageTagId);
    if (!elem) return;

    if (isExpanded && window.currentHoverTagSection === localStorageTagId) {
      elem.style.border = `2px solid ${selectedMode.displayColor}`;
    } else if (window.currentHoverTagSection === localStorageTagId) {
      elem.style.border = `2px solid ${selectedMode.displayColor}`;
    } else {
      elem.style.border = `2px solid ${hexToRGBA(selectedTag.displayColor, 0.5)}`;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const setIsExpanded = (nextState) => {
    setLocalValue(localStorageTagId, nextState ? 1 : 0);
    _setIsExpanded(nextState);
  };

  useHotkeys([KEYBOARD_CODES.E], () => {
    if (localStorageTagId === window.currentHoverTagSection) {
      setIsExpanded(!isExpanded);
    }
  });

  return (
    <div
      className={classNames('flex flex-col task-content-outer', { expanded: isExpanded })}
      id={localStorageTagId}
      onMouseEnter={() => {
        window.currentHoverTagSection = localStorageTagId;
        const elem = document.getElementById(localStorageTagId);

        if (!elem) return;

        elem.style.border = `2px solid ${selectedTag.displayColor}`;
      }}
      onMouseLeave={() => {
        window.currentHoverTagSection = null;
        const elem = document.getElementById(localStorageTagId);
        if (!elem) return;

        elem.style.border = `2px solid ${hexToRGBA(selectedTag.displayColor, 0.5)}`;
      }}
    >
      <TagItem
        tag={selectedTag}
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
          {_.sortBy(incompleteTasks, (ic) => -ic.isUrgent).map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isDayMode={isDayMode}
              tags={tags}
              selectedMode={selectedMode}
              effectiveCurrentDatetime={effectiveCurrentDatetime}
            />
          ))}
          {completeTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isDayMode={isDayMode}
              tags={tags}
              selectedMode={selectedMode}
              effectiveCurrentDatetime={effectiveCurrentDatetime}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default WithLocalStorage(TaskContent);
