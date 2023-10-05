import { gql, useMutation, useQuery } from '@apollo/client';
import _ from 'lodash';
import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import DateHelpers, { SQL_DATE_TIME_FORMAT } from '../../util/DateHelpers.js';
import WithQueryStrings from '../../util/WithQueryStrings.js';
import { KEYBOARD_CODES, TASK_STATUS, URL_PARAM_KEYS } from '../../util/constants.js';
import CalendarBody from './CalendarBody.js';
import { MODES, loadEffectiveWeeks, resolveCurrentEffectiveDatetime } from './CalendarHelpers.js';
import { GET_TAGS, GET_TASKS } from './queries.js';

import './TaskCalendar.scss';

const TASK_UPDATE = gql`
  mutation TASK_UPDATE($input: TaskCreateInput!, $id: ID!) {
    taskUpdate(input: $input, id: $id) {
      id
      title
      daysPutOff
      description
      originalDueDatetime
      dueDatetime
      insertDatetime
      completeDatetime
      status
      tag {
        id
      }
    }
  }
`;

const resolveFirstDate = (chunkedByWeek) => _.first(_.first(chunkedByWeek));
const resolveLastDate = (chunkedByWeek) => _.last(_.last(chunkedByWeek));

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

  const { data: taskData } = useQuery(GET_TASKS, { variables: mainQueryVariables });
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
      />
    </div>
  );
};

export default WithQueryStrings(TaskCalendar);
