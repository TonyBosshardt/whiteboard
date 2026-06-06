import classNames from 'classnames';
import React from 'react';
import { Button, Checkbox, Icon } from 'semantic-ui-react';

import DateHelpers from '../../util/DateHelpers.js';
import { TASK_STATUS } from '../../util/constants.js';

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

const TaskItemContent = ({
  dragRef,
  setPopupOpen,
  isDayMode,
  isDragging,
  isComplete,
  popupOpen,
  handleDuplicateTask,
  setIsQuickEditTitle,
  taskId,
  isSubTask,
  handleUpdateTask,
  isLoading,
  title,
  estimatedCompletionTimeMinutes,
  parentTaskId,
  isUrgent,
  subTaskCount,
  isExpanded,
  setIsExpanded,
  isValidOver,
  onToggleComplete,
}) => (
  <div
    id={taskId}
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
      'can-drop': isValidOver,
    })}
    style={{ cursor: isDragging && 'grabbing' }}
    onClick={async (event) => {
      const {
        nativeEvent: { metaKey, ctrlKey, altKey },
      } = event;

      if (metaKey || ctrlKey) {
        await handleDuplicateTask();
      } else if (altKey && parentTaskId) {
        await handleUpdateTask({ parentTaskId: null });
      } else if (event.no) {
        /** */
      } else {
        setPopupOpen(true);
        setIsQuickEditTitle(true);
      }
    }}
    onMouseEnter={() => (window.currentHoverTaskId = taskId)}
    onMouseLeave={() => (window.currentHoverTaskId = null)}
  >
    {isSubTask && (
      <div
        style={{
          outline: '1px solid #767676',
          margin: '0 0.75em 0 0.7em',
        }}
      />
    )}
    <div className="flex" style={{ margin: 'auto 0.5em auto 0' }}>
      <Checkbox
        checked={isComplete}
        onChange={(e) => {
          e.stopPropagation();
          const nextIsComplete = !isComplete;

          if (onToggleComplete) {
            onToggleComplete(nextIsComplete);
            return;
          }

          const payload = {};

          if (nextIsComplete) {
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
            <CompletionTimeBadge estimatedCompletionTimeMinutes={estimatedCompletionTimeMinutes} />
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
    {subTaskCount ? (
      <div className="flex expand-button" style={{ margin: 'auto 0 auto 0' }}>
        <span style={{ margin: 'auto 0.25em auto 0' }} className="text-secondary">
          {subTaskCount}
        </span>
        <Button
          className={classNames('text-white', { open: isExpanded })}
          icon="chevron right"
          circular
          onClick={(e) => {
            setIsExpanded();
            e.stopPropagation();
          }}
          style={{
            margin: 'auto 0 auto 0',
            fontSize: '0.6em',
          }}
        />
      </div>
    ) : null}
    {parentTaskId ? (
      <div className="flex expand-button">
        <Icon name="fork" color="grey" />
        {/* <Button
          className={classNames('text-white', { open: isExpanded })}
          icon="fork"
          circular
          onClick={(e) => {
            setIsExpanded();
            e.stopPropagation();
          }}
          style={{
            margin: 'auto 0 auto 0',
            fontSize: '0.6em',
          }}
        /> */}
      </div>
    ) : null}
  </div>
);

export default TaskItemContent;
