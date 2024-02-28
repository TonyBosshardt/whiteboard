import { useMutation, useQuery } from '@apollo/client';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useHotkeys } from 'react-hotkeys-hook';

import DateHelpers, { SQL_DATE_TIME_FORMAT } from '../../util/DateHelpers.js';
import WithQueryStrings from '../../util/WithQueryStrings.js';
import { KEYBOARD_CODES, TASK_STATUS, URL_PARAM_KEYS } from '../../util/constants.js';
import CalendarBody from './CalendarBody.js';
import {
  MODES,
  loadEffectiveWeeks,
  resolveCurrentEffectiveDatetime,
  resolveFirstDate,
  resolveLastDate,
} from './CalendarHelpers.js';
import { TASK_UPDATE } from './mutations.js';
import { GET_TAGS, GET_TASKS } from './queries.js';

import './TaskCalendar.scss';

const TaskCalendar = ({ getQueryParamValue }) => {
  const selectedMode = getQueryParamValue(URL_PARAM_KEYS.VIEW_MODE, MODES.WEEK);
  const selectedIndexDifference = getQueryParamValue(URL_PARAM_KEYS.OFFSET_IDX, 0, {
    isNumeric: true,
  });

  const windowSize = getQueryParamValue(URL_PARAM_KEYS.WINDOW_SIZE);

  const effectiveWindowSize = windowSize ? +windowSize : null;

  const effectiveCurrentDatetime = resolveCurrentEffectiveDatetime({
    selectedMode,
    selectedIndexDifference,
  });

  const [onUpdateTask] = useMutation(TASK_UPDATE);

  const handleUpdateTask = async (taskId, input) =>
    onUpdateTask({
      variables: {
        id: taskId,
        input,
      },
    });

  const isDayMode = selectedMode === MODES.DAY;

  const chunkedByWeek = loadEffectiveWeeks({
    selectedMode,
    isDayMode,
    effectiveCurrentDatetime,
    effectiveWindowSize,
  });

  const mainQueryVariables = {
    userId: '1',
    fromDate: resolveFirstDate(chunkedByWeek).isoDate,
    toDate: resolveLastDate(chunkedByWeek).dateTime.plus({ days: 1 }).toISODate(),
  };

  const { data: taskData } = useQuery(GET_TASKS, {
    variables: mainQueryVariables,
    fetchPolicy: 'cache-and-network' /** always hit the API for new data, rather than the cache */,
  });
  const { data: tagData } = useQuery(GET_TAGS);

  const tasks = taskData?.tasks || [];
  const tags = tagData?.tags || [];

  const pushTask = async ({ direction }) => {
    const foundTask = tasks.find((t) => t.id === window.currentHoverTaskId);

    if (!foundTask || foundTask?.status === TASK_STATUS.COMPLETE) return null;

    window.currentHoverTaskId = null;

    return handleUpdateTask(foundTask.id, {
      dueDatetime: DateHelpers.convertToDateTime(foundTask.dueDatetime)
        .set({ hour: 12, minute: 0 })
        .plus({ days: direction })
        .toFormat(SQL_DATE_TIME_FORMAT),
    });
  };

  useHotkeys([`${KEYBOARD_CODES.SHIFT}+${KEYBOARD_CODES.RIGHT_ARROW}`], () =>
    pushTask({ direction: 1 }),
  );

  useHotkeys([`${KEYBOARD_CODES.SHIFT}+${KEYBOARD_CODES.LEFT_ARROW}`], () =>
    pushTask({ direction: -1 }),
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className="flex flex-col task-calendar text-white"
        style={{ flex: 1, marginTop: '5em', overflowY: 'auto' }}
      >
        <CalendarBody
          effectiveCurrentDatetime={effectiveCurrentDatetime}
          tasks={tasks}
          tags={tags}
          effectiveWindowSize={effectiveWindowSize}
          isDayMode={isDayMode}
          chunkedByWeek={chunkedByWeek}
          selectedMode={selectedMode}
        />
      </div>
    </DndProvider>
  );
};

export default WithQueryStrings(TaskCalendar);
