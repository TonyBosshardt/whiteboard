import { useMutation } from '@apollo/client';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Checkbox, Icon, Popup } from 'semantic-ui-react';

import DateHelpers from '../../util/DateHelpers.js';
import { KEYBOARD_CODES, TASK_STATUS } from '../../util/constants.js';
import { TASK_UPDATE } from './mutations.js';
import TaskItemPopupContent from './task/TaskItemPopupContent.js';

const CompletionTimeBadge = ({ estimatedCompletionTimeMinutes, size }) => (
  <span
    className="round-corner"
    style={{
      padding: '0.25em',
      fontSize: size || '0.8em',
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
    }}
  >
    <Icon name="clock outline" />
    {estimatedCompletionTimeMinutes}m
  </span>
);

const TaskItem = ({ task, isDayMode, tags }) => {
  const { id, title, estimatedCompletionTimeMinutes, status } = task;

  const [isLoading, setIsLoading] = useState(false);
  const [isQuickEditTitle, setIsQuickEditTitle] = useState(false);

  useHotkeys([KEYBOARD_CODES.ENTER], (e) => {
    e.preventDefault();

    if (window.currentHoverTaskId === id && document.activeElement === document.body) {
      setIsQuickEditTitle(true);
    }
  });

  const isComplete = status === TASK_STATUS.COMPLETE;

  const [onUpdateTask] = useMutation(TASK_UPDATE);

  const handleUpdateTask = async (input, mutationProps = {}) => {
    setIsLoading(true);

    await onUpdateTask({
      variables: {
        id,
        input,
      },
      ...mutationProps,
    });

    setIsLoading(false);
  };

  return (
    <Popup
      position={!isDayMode ? 'left center' : 'bottom right'}
      on="hover"
      hoverable
      onClose={() => setIsQuickEditTitle(false)}
      trigger={
        <div
          id={id}
          className={classNames('flex task-item', { 'day-mode': isDayMode })}
          style={{
            textDecoration: isComplete ? 'line-through' : 'none',
          }}
          onClick={() => setIsQuickEditTitle(true)}
          onMouseEnter={() => (window.currentHoverTaskId = id)}
          onMouseLeave={() => (window.currentHoverTaskId = null)}
        >
          <div className="flex flex-col" style={{ margin: '0 0.5em auto 0' }}>
            <Checkbox
              checked={isComplete}
              onChange={(e) => {
                e.stopPropagation();
                const payload = {};
                if (!isComplete) {
                  payload.status = TASK_STATUS.COMPLETE;
                  payload.completeDatetime = DateHelpers.dateTimeToSQLFormat(
                    DateHelpers.getCurrentDatetime(),
                  );
                } else {
                  payload.status = TASK_STATUS.INCOMPLETE;
                  payload.completeDatetime = null;
                }
                handleUpdateTask(payload);
              }}
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col flex-grow">
            <span className="flex" style={{ margin: 'auto auto auto 0' }}>
              <span>{title}</span>
              {estimatedCompletionTimeMinutes && isDayMode && (
                <div style={{ marginLeft: '0.5em' }}>
                  <CompletionTimeBadge
                    size="1em"
                    estimatedCompletionTimeMinutes={estimatedCompletionTimeMinutes}
                  />
                </div>
              )}
            </span>
            {estimatedCompletionTimeMinutes && !isDayMode && !isComplete ? (
              <div className="flex" style={{ marginTop: '0.25em' }}>
                <div className="flex-grow" />
                <CompletionTimeBadge
                  estimatedCompletionTimeMinutes={estimatedCompletionTimeMinutes}
                />
              </div>
            ) : null}
          </div>
        </div>
      }
      content={
        <TaskItemPopupContent
          isQuickEditTitle={isQuickEditTitle}
          handleUpdateTask={handleUpdateTask}
          setIsQuickEditTitle={setIsQuickEditTitle}
          isLoading={isLoading}
          task={task}
          tags={tags}
        />
      }
    />
  );
};

export default TaskItem;
