import { useMutation } from '@apollo/client';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { useHotkeys } from 'react-hotkeys-hook';
import { Checkbox, Icon, Popup } from 'semantic-ui-react';

import DateHelpers from '../../util/DateHelpers.js';
import { DRAG_ITEM_TYPES, KEYBOARD_CODES, TASK_STATUS } from '../../util/constants.js';
import { resolveQueryVariables } from '../navbar/NavBar.js';
import { CREATE_TASK, TASK_UPDATE } from './mutations.js';
import { GET_TASKS } from './queries.js';
import TaskItemPopupContent from './task/TaskItemPopupContent.js';

const CompletionTimeBadge = ({ estimatedCompletionTimeMinutes, size }) => (
  <span
    className="round-corner"
    style={{
      padding: '0.25em',
      fontSize: size || '0.8em', // default to `smaller`
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      whiteSpace: 'pre',
    }}
  >
    <Icon name="clock outline" />
    {estimatedCompletionTimeMinutes}m
  </span>
);

const POPUP_POSITIONS = {
  TOP_LEFT: 'top left',
  LEFT_CENTER: 'left center',
};

const MIN_HEIGHT_FOR_POPUP_PX = 150;

const _resolveEffectivePopupPosition = ({ id }) => {
  const elem = document.getElementById(id);
  const rect = elem.getBoundingClientRect();

  if (window.innerHeight - rect.bottom < MIN_HEIGHT_FOR_POPUP_PX) {
    return POPUP_POSITIONS.TOP_LEFT;
  }

  return POPUP_POSITIONS.LEFT_CENTER;
};

const TaskItem = ({ task, isDayMode, tags, effectiveCurrentDatetime, selectedMode }) => {
  const { id, title, estimatedCompletionTimeMinutes, status, isUrgent } = task;
  const isComplete = status === TASK_STATUS.COMPLETE;

  const [onUpdateTask] = useMutation(TASK_UPDATE);
  const [onCreateTask] = useMutation(CREATE_TASK);

  const [isLoading, setIsLoading] = useState(false);
  const [isQuickEditTitle, setIsQuickEditTitle] = useState(false);
  const [effectivePopupPosition, setEffectivePopupPosition] = useState(POPUP_POSITIONS.LEFT_CENTER);
  const [popupOpen, _setPopupOpen] = useState(false);

  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: DRAG_ITEM_TYPES.TASK,
    canDrag: () => !isComplete,
    item: { id },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));

  const setPopupOpen = (nextState) => {
    if (nextState) {
      setEffectivePopupPosition(_resolveEffectivePopupPosition({ id }));
      _setPopupOpen(true);
    } else {
      _setPopupOpen(false);
    }
  };

  useHotkeys([KEYBOARD_CODES.ENTER], (e) => {
    e.preventDefault();

    if (window.currentHoverTaskId === id && document.activeElement === document.body) {
      setPopupOpen(true);
      setIsQuickEditTitle(true);
    }
  });

  const _wrapMutation = async (mutation) => {
    setIsLoading(true);

    await mutation;

    setIsLoading(false);
  };

  const handleUpdateTask = async (input, mutationProps = {}) => {
    _wrapMutation(
      onUpdateTask({
        variables: {
          id,
          input,
        },
        ...mutationProps,
      }),
    );
  };

  const handleDuplicateTask = () => {
    const dueDatetime = DateHelpers.dateTimeToSQLFormat(DateHelpers.getCurrentDatetime());

    return _wrapMutation(
      onCreateTask({
        variables: {
          input: [
            {
              title,
              originalDueDatetime: dueDatetime,
              dueDatetime,
              tagId: task.tag.id,
              userId: '1',
            },
          ],
        },
        refetchQueries: [
          {
            query: GET_TASKS,
            variables: resolveQueryVariables({
              selectedMode,
              effectiveCurrentDatetime,
              isDayMode,
            }),
          },
        ],
      }),
    );
  };

  return (
    <Popup
      position={isDayMode ? 'bottom right' : effectivePopupPosition}
      on="hover"
      hoverable
      open={popupOpen}
      onClose={() => {
        setPopupOpen(false);
        setIsQuickEditTitle(false);
      }}
      trigger={
        <div
          id={id}
          ref={dragRef}
          onDragStart={() => {
            setPopupOpen(false);
          }}
          onDragEnd={() => {}}
          className={classNames('flex task-item', {
            'day-mode': isDayMode,
            dragging: isDragging,
            complete: isComplete,
            open: popupOpen,
          })}
          style={{ cursor: isDragging && 'grabbing' }}
          onClick={() => {
            setPopupOpen(true);
            setIsQuickEditTitle(true);
          }}
          onMouseEnter={() => (window.currentHoverTaskId = id)}
          onMouseLeave={() => (window.currentHoverTaskId = null)}
        >
          <div className="flex" style={{ margin: '0 0.5em auto 0' }}>
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
              {estimatedCompletionTimeMinutes && isDayMode && !isComplete ? (
                <div style={{ marginLeft: '0.5em' }}>
                  <CompletionTimeBadge
                    size="1em"
                    estimatedCompletionTimeMinutes={estimatedCompletionTimeMinutes}
                  />
                </div>
              ) : null}
              {isUrgent && !isComplete && isDayMode ? (
                <Icon
                  name="exclamation triangle"
                  color="yellow"
                  style={{ margin: 'auto 0 auto 0.25em', fontSize: '1.2em' }}
                />
              ) : null}
            </span>
            {(estimatedCompletionTimeMinutes || isUrgent) && !isComplete && !isDayMode ? (
              <div className="flex" style={{ marginTop: '0.25em' }}>
                <div className="flex-grow" />
                {estimatedCompletionTimeMinutes ? (
                  <CompletionTimeBadge
                    estimatedCompletionTimeMinutes={estimatedCompletionTimeMinutes}
                  />
                ) : null}
                {isUrgent ? (
                  <Icon
                    name="exclamation triangle"
                    color="yellow"
                    style={{ margin: 'auto 0 auto 0.25em', fontSize: '1.2em' }}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      }
      content={
        <TaskItemPopupContent
          isQuickEditTitle={isQuickEditTitle}
          handleUpdateTask={handleUpdateTask}
          handleDuplicateTask={handleDuplicateTask}
          setIsQuickEditTitle={setIsQuickEditTitle}
          isLoading={isLoading}
          task={task}
          tags={tags}
          setPopupOpen={setPopupOpen}
        />
      }
    />
  );
};

export default TaskItem;
