import _ from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import DateHelpers from '../../util/DateHelpers.js';
import TaskDay from './TaskDay.js';
import WeekdayHeader from './WeekdayHeader.js';

const MIN_WEEK_HEIGHT_PX = 80;
const MIN_DAY_WIDTH_PX = 120;
const CALENDAR_SIZING_STORAGE_KEY = 'task-calendar-sizing';

const buildDefaultWeights = (count) => Array(count).fill(1);

const sanitizeWeights = (weights, count) => {
  if (!Array.isArray(weights) || weights.length !== count) {
    return buildDefaultWeights(count);
  }

  if (!weights.every((w) => Number.isFinite(w) && w > 0)) {
    return buildDefaultWeights(count);
  }

  return weights;
};

const CalendarBody = ({
  effectiveCurrentDatetime,
  tasks,
  tags,
  keyedTagsOverride = null,
  effectiveWindowSize,
  isDayMode,
  chunkedByWeek,
  selectedMode,
}) => {
  const tasksByISODate = _.groupBy(tasks, (t) =>
    DateHelpers.convertToDateTime(t.dueDatetime).toISODate(),
  );

  const keyedTags = keyedTagsOverride || _.keyBy(tags, (t) => t.id);
  const weekCount = chunkedByWeek.length;
  const dayCount = chunkedByWeek[0]?.length || 0;
  const sizingStorageKey = `${CALENDAR_SIZING_STORAGE_KEY}-${selectedMode}-${weekCount}-${dayCount}`;

  const [weekWeights, setWeekWeights] = useState([]);
  const [dayWeights, setDayWeights] = useState([]);

  const weeksContainerRef = useRef(null);
  const resizeStateRef = useRef(null);

  useEffect(() => {
    const defaultWeekWeights = buildDefaultWeights(weekCount);
    const defaultDayWeights = buildDefaultWeights(dayCount);

    if (typeof window === 'undefined') {
      setWeekWeights(defaultWeekWeights);
      setDayWeights(defaultDayWeights);
      return;
    }

    try {
      const raw = window.localStorage.getItem(sizingStorageKey);

      if (!raw) {
        setWeekWeights(defaultWeekWeights);
        setDayWeights(defaultDayWeights);
        return;
      }

      const parsed = JSON.parse(raw);

      setWeekWeights(sanitizeWeights(parsed?.weekWeights, weekCount));
      setDayWeights(sanitizeWeights(parsed?.dayWeights, dayCount));
    } catch {
      setWeekWeights(defaultWeekWeights);
      setDayWeights(defaultDayWeights);
    }
  }, [sizingStorageKey, weekCount, dayCount]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!weekCount || !dayCount) return;
    if (weekWeights.length !== weekCount || dayWeights.length !== dayCount) return;

    window.localStorage.setItem(
      sizingStorageKey,
      JSON.stringify({
        weekWeights,
        dayWeights,
      }),
    );
  }, [sizingStorageKey, weekWeights, dayWeights, weekCount, dayCount]);

  const totalWeekWeight = useMemo(
    () => weekWeights.reduce((sum, w) => sum + w, 0) || 1,
    [weekWeights],
  );
  const totalDayWeight = useMemo(
    () => dayWeights.reduce((sum, w) => sum + w, 0) || 1,
    [dayWeights],
  );

  useEffect(() => {
    const onMouseMove = (event) => {
      const state = resizeStateRef.current;

      if (!state || !weeksContainerRef.current) return;

      if (state.type === 'week') {
        const containerHeight = weeksContainerRef.current.clientHeight || 1;
        const deltaPx = event.clientY - state.startPointerPos;
        const deltaWeight = (deltaPx / containerHeight) * state.totalWeight;
        const minWeight = (MIN_WEEK_HEIGHT_PX / containerHeight) * state.totalWeight;

        const nextA = Math.max(state.startA + deltaWeight, minWeight);
        const pairSum = state.startA + state.startB;
        const normalizedA = Math.min(nextA, pairSum - minWeight);
        const normalizedB = pairSum - normalizedA;

        setWeekWeights((prev) => {
          const next = [...prev];
          next[state.index] = normalizedA;
          next[state.index + 1] = normalizedB;
          return next;
        });
      } else if (state.type === 'day') {
        const containerWidth = weeksContainerRef.current.clientWidth || 1;
        const deltaPx = event.clientX - state.startPointerPos;
        const deltaWeight = (deltaPx / containerWidth) * state.totalWeight;
        const minWeight = (MIN_DAY_WIDTH_PX / containerWidth) * state.totalWeight;

        const nextA = Math.max(state.startA + deltaWeight, minWeight);
        const pairSum = state.startA + state.startB;
        const normalizedA = Math.min(nextA, pairSum - minWeight);
        const normalizedB = pairSum - normalizedA;

        setDayWeights((prev) => {
          const next = [...prev];
          next[state.index] = normalizedA;
          next[state.index + 1] = normalizedB;
          return next;
        });
      }
    };

    const onMouseUp = () => {
      if (!resizeStateRef.current) return;

      resizeStateRef.current = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const startResize = ({ type, index, pointerPos }) => {
    if (type === 'week') {
      if (!weekWeights[index] || !weekWeights[index + 1]) return;

      resizeStateRef.current = {
        type,
        index,
        startPointerPos: pointerPos,
        startA: weekWeights[index],
        startB: weekWeights[index + 1],
        totalWeight: totalWeekWeight,
      };
      document.body.style.cursor = 'row-resize';
    } else {
      if (!dayWeights[index] || !dayWeights[index + 1]) return;

      resizeStateRef.current = {
        type,
        index,
        startPointerPos: pointerPos,
        startA: dayWeights[index],
        startB: dayWeights[index + 1],
        totalWeight: totalDayWeight,
      };
      document.body.style.cursor = 'col-resize';
    }

    document.body.style.userSelect = 'none';
  };

  const resetDaySizing = () => {
    setDayWeights(buildDefaultWeights(dayCount));
    resizeStateRef.current = null;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  };

  const resetCalendarSizing = () => {
    setWeekWeights(buildDefaultWeights(weekCount));
    resetDaySizing();
    resizeStateRef.current = null;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  };

  useHotkeys('r', resetCalendarSizing, [weekCount, dayCount]);

  return (
    <div
      className="flex flex-col flex-grow"
      style={{ flex: 1, minHeight: 0, margin: '0 2px 2px 2px' }}
    >
      {!isDayMode && (
        <WeekdayHeader
          effectiveWindowSize={effectiveWindowSize}
          effectiveCurrentDatetime={effectiveCurrentDatetime}
          dayWeights={dayWeights}
        />
      )}
      <div ref={weeksContainerRef} className="calendar-weeks-container">
        {chunkedByWeek.map((weekChunk, weekIdx) => (
          <div
            className="flex calendar-week"
            key={`${weekChunk[0].isoDate}-week-start`}
            style={{ flex: `${weekWeights[weekIdx] || 1} 1 0` }}
          >
            {weekChunk.map((dateObj, dayIdx) => {
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
                  dayFlex={dayWeights[dayIdx]}
                />
              );
            })}
          </div>
        ))}
        {!isDayMode &&
          weekWeights.length > 1 &&
          weekWeights.slice(0, -1).map((weight, idx) => {
            const usedWeight = weekWeights.slice(0, idx + 1).reduce((sum, w) => sum + w, 0);

            return (
              <div
                className="week-resize-handle"
                key={`week-handle-${weight}-${usedWeight}`}
                style={{ top: `${(usedWeight / totalWeekWeight) * 100}%` }}
                onMouseDown={(event) => {
                  event.preventDefault();
                  startResize({ type: 'week', index: idx, pointerPos: event.clientY });
                }}
              />
            );
          })}
        {!isDayMode &&
          dayWeights.length > 1 &&
          dayWeights.slice(0, -1).map((weight, idx) => {
            const usedWeight = dayWeights.slice(0, idx + 1).reduce((sum, w) => sum + w, 0);

            return (
              <div
                className="day-resize-handle"
                key={`day-handle-${weight}-${usedWeight}`}
                style={{ left: `${(usedWeight / totalDayWeight) * 100}%` }}
                onMouseDown={(event) => {
                  event.preventDefault();
                  startResize({ type: 'day', index: idx, pointerPos: event.clientX });
                }}
                onDoubleClick={(event) => {
                  event.preventDefault();
                  resetDaySizing();
                }}
              />
            );
          })}
      </div>
    </div>
  );
};

export default CalendarBody;
