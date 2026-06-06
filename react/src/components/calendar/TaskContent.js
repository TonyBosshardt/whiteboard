import classNames from 'classnames';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { hexToRGBA } from '../../util/ColorUtils.js';
import DateHelpers from '../../util/DateHelpers.js';
import WithLocalStorage from '../../util/WithLocalStorage.js';
import { KEYBOARD_CODES, TASK_STATUS } from '../../util/constants.js';
import SubTaskContainer from './SubTaskContainer.js';
import TagItem from './TagItem.js';
import NewTaskModal from './taskCreate/NewTaskModal.js';

const makeLocalStorageKey = (isoDate, tagId) => `${isoDate}_${tagId}`;
const resolveTaskISODate = (task) =>
  task?.dueDatetime ? DateHelpers.convertToDateTime(task.dueDatetime).toISODate() : null;

const TaskContent = ({
  keyedTags,
  tagId,
  tags,
  handleUpdateTasks,
  tasks,
  isDayMode,
  isoDate,
  getLocalValue,
  setLocalValue,
  effectiveCurrentDatetime,
  selectedMode,
  initialDueDatetime,
  initialIsUnscheduled = false,
}) => {
  const effectiveInitialDueDatetime =
    initialDueDatetime === undefined ? DateHelpers.convertToDateTime(isoDate) : initialDueDatetime;
  const { [TASK_STATUS.COMPLETE]: completeTasks, [TASK_STATUS.INCOMPLETE]: incompleteTasks } =
    _.groupBy(tasks, (t) => t.status);

  const totalTaskCount = tasks.length;
  const tasksAllComplete = (completeTasks || []).length === totalTaskCount;

  const keyedTasks = _.keyBy(tasks, (t) => t.id);
  const allTasksByParentTaskId = _.groupBy(tasks, (t) => t.parentTaskId);

  const allSubTasksByIdForTodayCurrentDay = _.keyBy(
    tasks.filter(
      (t) =>
        t.parentTaskId && resolveTaskISODate(keyedTasks[t.parentTaskId]) === resolveTaskISODate(t),
    ),
    (t) => t.id,
  );

  Object.keys(keyedTasks).forEach((id) => {
    const childrenTasks = allTasksByParentTaskId[id];

    if (childrenTasks) {
      keyedTasks[id] = { ...keyedTasks[id], subtasks: childrenTasks };
    }
  });

  const childrenTaskIds = new Set(Object.keys(allSubTasksByIdForTodayCurrentDay));

  const selectedTag = keyedTags[tagId];

  const localStorageTagId = makeLocalStorageKey(isoDate, tagId);

  const [isExpanded, _setIsExpanded] = useState(
    getLocalValue(localStorageTagId, {
      defaultValue: !tasksAllComplete ? 1 : 0,
      isNumeric: true,
    }),
  );
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    const elem = document.getElementById(localStorageTagId);
    if (!elem) return;

    if (isExpanded && window.currentHoverTagSection === localStorageTagId) {
      elem.style.border = `2px solid ${selectedTag.displayColor}`;
    } else if (window.currentHoverTagSection === localStorageTagId) {
      elem.style.border = `2px solid ${selectedTag.displayColor}`;
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
    <>
      {isCreateModalOpen && (
        <NewTaskModal
          onClose={() => setCreateModalOpen(false)}
          initialDueDatetime={effectiveInitialDueDatetime}
          initialTagId={tagId}
          initialIsUnscheduled={initialIsUnscheduled}
          allowUnscheduled={initialIsUnscheduled}
          tags={tags}
          selectedMode={selectedMode}
          effectiveCurrentDatetime={effectiveCurrentDatetime}
        />
      )}
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
          completedTaskCount={(completeTasks || []).length}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          isDayMode={isDayMode}
          incompleteTasks={incompleteTasks || []}
          allTasks={tasks}
          onDoubleClickHeader={() => setCreateModalOpen(true)}
        />
        {isExpanded ? (
          <div className="flex flex-col" style={{ marginBottom: '0.5em' }}>
            {_.sortBy(
              tasks.filter((t) => !childrenTaskIds.has(t.id)),
              [(t) => t.status === TASK_STATUS.COMPLETE, (t) => -t.isUrgent],
            ).map((task, idx) => {
              const subTasks = _.sortBy(
                allTasksByParentTaskId[task.id] || [],
                (t) => t.status === TASK_STATUS.COMPLETE,
              );
              const key = `${task.id}-${idx}`; // yeah, i know

              return (
                <SubTaskContainer
                  key={key}
                  className="task-item"
                  task={task}
                  subTasks={subTasks}
                  isDayMode={isDayMode}
                  tags={tags}
                  selectedMode={selectedMode}
                  effectiveCurrentDatetime={effectiveCurrentDatetime}
                  handleUpdateTasks={handleUpdateTasks}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </>
  );
};

export default WithLocalStorage(TaskContent);
