import classNames from 'classnames';
import React, { useState } from 'react';

import { TASK_STATUS } from '../../util/constants.js';
import NewTaskModal from './NewTaskModal.js';

const TaskDayHeader = ({ dayOfMonth, isToday, isDayMode, tasksForDate }) => {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

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
      <NewTaskModal open={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />
      <div className="flex day-header-tray flex-grow">
        <div
          style={{ margin: 'auto 1em auto 0' }}
          className={classNames('numerical-date', { today: isToday, day: isDayMode })}
        >
          {dayOfMonth}
        </div>
        {tasksForDate.length ? (
          <div className="complete-count-badge">
            {completeCount} / {tasksForDate.length}
          </div>
        ) : null}
      </div>
    </>
  );
};

export default TaskDayHeader;
