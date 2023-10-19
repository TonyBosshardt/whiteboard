import classNames from 'classnames';
import React from 'react';
import { Checkbox } from 'semantic-ui-react';

import DateHelpers, { SQL_DATE_TIME_FORMAT } from '../../../util/DateHelpers.js';

const TaskItemRow = ({
  isComplete,
  isDayMode,
  taskId,
  onClickRow,
  handleUpdateTask,
  isLoading,
  title,
}) => {
  return (
    <div
      className={classNames('flex task-item', { 'day-mode': isDayMode })}
      style={{
        textDecoration: isComplete ? 'line-through' : 'none',
      }}
      onClick={onClickRow}
      onMouseEnter={() => (window.currentHoverTaskId = taskId)}
      onMouseLeave={() => (window.currentHoverTaskId = null)}
    >
      <Checkbox
        style={{ margin: '0 0.5em auto 0' }}
        checked={isComplete}
        onChange={(e) => {
          e.stopPropagation();
          const payload = {};
          if (!isComplete) {
            payload.status = 'complete';
            payload.completeDatetime =
              DateHelpers.getCurrentDatetime().toFormat(SQL_DATE_TIME_FORMAT);
          } else {
            payload.status = 'incomplete';
            payload.completeDatetime = null;
          }
          handleUpdateTask(payload);
        }}
        disabled={isLoading}
      />
      <span style={{ margin: 'auto auto auto 0' }}>{title}</span>
    </div>
  );
};

export default TaskItemRow;
