import classNames from 'classnames';
import React, { useState } from 'react';
import { Button, Icon } from 'semantic-ui-react';

import { TASK_STATUS } from '../../util/constants.js';
import NewTaskModal from './NewTaskModal.js';

const TaskDayHeader = ({ dayOfMonth, isToday, isDayMode, tasksForDate, dateTime, tags }) => {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const { completeCount } = tasksForDate.reduce(
    (agg, task) => {
      if (task.status === TASK_STATUS.COMPLETE) {
        agg.completeCount += 1;
      } else {
        agg.incompleteCount += 1;
      }
      return agg;
    },
    { incompleteCount: 0, completeCount: 0 },
  );

  return (
    <>
      <NewTaskModal
        open={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        initialDueDatetime={dateTime}
        tags={tags}
      />
      <div
        className="flex day-header-tray flex-grow"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div
          style={{ margin: 'auto 0.5em auto 0' }}
          className={classNames('numerical-date', { today: isToday, day: isDayMode })}
        >
          {dayOfMonth}
        </div>
        {tasksForDate.length ? (
          <div className="complete-count-badge">
            {completeCount} / {tasksForDate.length}
          </div>
        ) : null}
        <Button
          style={{
            margin: 'auto 0 auto auto',
            padding: '0.5em',
            visibility: isHovering ? 'visible' : 'hidden',
          }}
          onClick={() => setCreateModalOpen(true)}
          primary
        >
          <Icon name="plus" />
          New
        </Button>
      </div>
    </>
  );
};

export default TaskDayHeader;
