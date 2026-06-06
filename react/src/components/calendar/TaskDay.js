import { useMutation } from '@apollo/client';
import classNames from 'classnames';
import _ from 'lodash';
import React from 'react';
import { useDrop } from 'react-dnd';

import { SQL_DATE_TIME_FORMAT } from '../../util/DateHelpers.js';
import { DRAG_ITEM_TYPES } from '../../util/constants.js';
import { resolveBacklogQueryVariables, resolveQueryVariables } from '../navbar/NavBar.js';
import TaskContent from './TaskContent.js';
import TaskDayHeader from './TaskDayHeader.js';
import { TASKS_UPDATE } from './mutations.js';
import { GET_TASKS } from './queries.js';
import { registerTaskUpdateUndo } from './taskUndoManager.js';

const TaskDay = ({
  dateTime,
  isToday,
  inactive,
  isDayMode,
  tasksForDate,
  keyedTags,
  tags,
  isoDate,
  selectedMode,
  effectiveCurrentDatetime,
  onClickToday = () => {},
  dayFlex = 1,
}) => {
  const dayOfMonth = dateTime.toFormat('d');
  const dayStr = dateTime.toFormat('cccc');

  const hasTasksForToday = !!tasksForDate.length;

  const tasksByTagId = _.groupBy(tasksForDate, (t) => t.tag?.id || 'NONE');
  const resolveTagSortLabel = (tagId) => keyedTags[tagId]?.title || '';
  const [onUpdateTasks] = useMutation(TASKS_UPDATE, {
    refetchQueries: [
      {
        query: GET_TASKS,
        variables: resolveQueryVariables({
          selectedMode,
          effectiveCurrentDatetime,
          isDayMode,
        }),
      },
      {
        query: GET_TASKS,
        variables: resolveBacklogQueryVariables(),
      },
    ],
    awaitRefetchQueries: true,
  });

  const handleUpdateTasks = (taskIds, input) => {
    registerTaskUpdateUndo({ ids: taskIds, input });

    return onUpdateTasks({
      variables: {
        ids: taskIds,
        input,
      },
    });
  };

  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: [DRAG_ITEM_TYPES.TASK, DRAG_ITEM_TYPES.TAG_DAY],
    drop: (item) => {
      const { ids } = item;

      return handleUpdateTasks(ids, {
        dueDatetime: dateTime.set({ hour: 12, minute: 0 }).toFormat(SQL_DATE_TIME_FORMAT),
      });
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={dropRef}
      className={classNames('flex flex-col activity-day', {
        inactive,
        day: isDayMode,
        'has-activities': hasTasksForToday,
      })}
      style={{
        outline: isOver && '2px solid white',
        borderRadius: isOver && '0.28em',
        flex: `${dayFlex || 1} 1 0`,
        width: 'auto',
      }}
      onClick={() => {
        if (hasTasksForToday) {
          onClickToday();
        }
      }}
    >
      <div className="flex" style={{ position: 'relative', marginBottom: '0.5em' }}>
        {isDayMode && <strong style={{ margin: 'auto 5em auto 0' }}>{dayStr}</strong>}
        <TaskDayHeader
          dayOfMonth={dayOfMonth}
          dateTime={dateTime}
          isToday={isToday}
          isDayMode={isDayMode}
          tasksForDate={tasksForDate}
          tags={tags}
          selectedMode={selectedMode}
          effectiveCurrentDatetime={effectiveCurrentDatetime}
        />
      </div>
      <div
        className={classNames('flex flex-col task-day-container', {
          'day-mode': isDayMode,
        })}
      >
        {Object.keys(keyedTags)
          .filter((tagId) => tasksByTagId[tagId] && keyedTags[tagId])
          .sort((a, b) => resolveTagSortLabel(a).localeCompare(resolveTagSortLabel(b)))
          .map((tagId) => {
            const tasks = tasksByTagId[tagId];

            return (
              <TaskContent
                key={tagId}
                isoDate={isoDate}
                keyedTags={keyedTags}
                tagId={tagId}
                tasks={tasks}
                isDayMode={isDayMode}
                tags={tags}
                selectedMode={selectedMode}
                effectiveCurrentDatetime={effectiveCurrentDatetime}
                handleUpdateTasks={handleUpdateTasks}
              />
            );
          })}
      </div>
    </div>
  );
};

export default TaskDay;
