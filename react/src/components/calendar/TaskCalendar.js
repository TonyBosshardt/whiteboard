import { gql, useMutation, useQuery } from '@apollo/client';
import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import DateHelpers, { SQL_DATE_TIME_FORMAT } from '../../util/DateHelpers.js';
import WithQueryStrings from '../../util/WithQueryStrings.js';
import { URL_PARAM_KEYS } from '../../util/constants.js';
import CalendarBody from './CalendarBody.js';
import { MODES, resolveCurrentEffectiveDatetime } from './CalendarHelpers.js';

import './TaskCalendar.scss';

export const GET_TASKS = gql`
  query GetTasks {
    tags {
      id
      title
      displayColor
    }
    tasks(userId: 1) {
      id
      user {
        id
        firstName
        lastName
      }
      title
      description
      tag {
        id
        title
        displayColor
      }
      dueDatetime
      status
      insertDatetime
      completeDatetime
    }
  }
`;

const TASK_UPDATE = gql`
  mutation TASK_UPDATE($input: TaskCreateInput!, $id: ID!) {
    taskUpdate(input: $input, id: $id) {
      id
      title
      description
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

  const { loading, error, data } = useQuery(GET_TASKS);

  const tasks = data?.tasks || [];
  const tags = data?.tags || [];

  useHotkeys(['shift+right'], () => {
    const foundTask = tasks.find((t) => t.id === window.currentHoverTaskId);
    if (!foundTask || foundTask?.status === 'complete') return null;

    return handleUpdateTask(foundTask.id, {
      dueDatetime: DateHelpers.convertToDateTime(foundTask.dueDatetime)
        .set({ hour: 12, minute: 0 })
        .plus({ days: 1 })
        .toFormat(SQL_DATE_TIME_FORMAT),
    });
  });

  useHotkeys(['shift+left'], () => {
    const foundTask = tasks.find((t) => t.id === window.currentHoverTaskId);
    if (!foundTask || foundTask?.status === 'complete') return null;

    return handleUpdateTask(foundTask.id, {
      dueDatetime: DateHelpers.convertToDateTime(foundTask.dueDatetime)
        .set({ hour: 12, minute: 0 })
        .plus({ days: -1 })
        .toFormat(SQL_DATE_TIME_FORMAT),
    });
  });

  return (
    <div
      className="flex flex-col task-calendar text-white"
      style={{ flex: 1, marginTop: '5em', overflowY: 'auto' }}
    >
      <CalendarBody
        selectedMode={selectedMode}
        effectiveCurrentDatetime={effectiveCurrentDatetime}
        tasks={tasks}
        tags={tags}
        effectiveWindowSize={effectiveWindowSize}
      />
    </div>
  );
};

export default WithQueryStrings(TaskCalendar);
