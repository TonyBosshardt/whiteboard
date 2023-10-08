import _ from 'lodash';
import React from 'react';

import DateHelpers from '../../util/DateHelpers.js';
import TaskDay from './TaskDay.js';
import WeekdayHeader from './WeekdayHeader.js';

const ROOT_DIV_HEIGHT = '100vh';
const TOP_MARGIN = '5em';
const DAY_HEADER_HEIGHT_PX = '24.1';

const CalendarBody = ({
  effectiveCurrentDatetime,
  tasks,
  tags,
  effectiveWindowSize,
  isDayMode,
  chunkedByWeek,
  selectedMode,
}) => {
  const weekHeight = `calc((${ROOT_DIV_HEIGHT} - ${TOP_MARGIN} - ${
    isDayMode ? 0 : DAY_HEADER_HEIGHT_PX
  }px) / ${chunkedByWeek.length})`;

  const tasksByISODate = _.groupBy(tasks, (t) =>
    DateHelpers.convertToDateTime(t.dueDatetime).toISODate(),
  );

  const keyedTags = _.keyBy(tags, (t) => t.id);

  return (
    <div className="flex flex-col" style={{ flex: 1 }}>
      {!isDayMode && (
        <WeekdayHeader
          effectiveWindowSize={effectiveWindowSize}
          effectiveCurrentDatetime={effectiveCurrentDatetime}
        />
      )}
      {chunkedByWeek.map((weekChunk) => (
        <div
          className="flex calendar-week"
          key={`${weekChunk[0].isoDate}-week-start`}
          style={{ maxHeight: weekHeight }}
        >
          {weekChunk.map((dateObj) => {
            const { isoDate, isToday, dateTime, inactive } = dateObj;

            const tasksForDate = tasksByISODate[isoDate] || [];

            return (
              <TaskDay
                isoDate={isoDate}
                key={isoDate}
                isToday={isToday}
                dateTime={dateTime}
                inactive={inactive}
                isDayMode={isDayMode}
                chunkCount={chunkedByWeek.length}
                tasksForDate={tasksForDate}
                keyedTags={keyedTags}
                tags={tags}
                selectedMode={selectedMode}
                effectiveCurrentDatetime={effectiveCurrentDatetime}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default CalendarBody;
