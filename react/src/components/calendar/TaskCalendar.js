import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef } from 'react';
import { DndProvider, useDragLayer } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useHotkeys } from 'react-hotkeys-hook';

import DateHelpers, { SQL_DATE_TIME_FORMAT } from '../../util/DateHelpers.js';
import WithLocalStorage from '../../util/WithLocalStorage.js';
import WithQueryStrings from '../../util/WithQueryStrings.js';
import {
  DRAG_ITEM_TYPES,
  KEYBOARD_CODES,
  SPECIAL_TAG_IDS,
  TASK_STATUS,
  URL_PARAM_KEYS,
} from '../../util/constants.js';
import { resolveBacklogQueryVariables } from '../navbar/NavBar.js';
import BacklogPanel from './BacklogPanel.js';
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
import {
  clearTaskUndoManager,
  configureTaskUndoManager,
  redoLastTaskAction,
  registerTaskUpdateUndo,
  undoLastTaskAction,
} from './taskUndoManager.js';

import './TaskCalendar.scss';

const EDGE_SCROLL_THRESHOLD_PX = 40;
const MAX_SCROLL_STEP_PX = 24;
const HORIZONTAL_NAVIGATION_INTERVAL_MS = 1100;

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const resolveEdgeVelocity = ({ pointerCoord, maxCoord }) => {
  if (pointerCoord < EDGE_SCROLL_THRESHOLD_PX) {
    const ratio = 1 - clamp(pointerCoord / EDGE_SCROLL_THRESHOLD_PX, 0, 1);
    return -ratio * MAX_SCROLL_STEP_PX;
  }

  const distanceToEnd = maxCoord - pointerCoord;

  if (distanceToEnd < EDGE_SCROLL_THRESHOLD_PX) {
    const ratio = 1 - clamp(distanceToEnd / EDGE_SCROLL_THRESHOLD_PX, 0, 1);
    return ratio * MAX_SCROLL_STEP_PX;
  }

  return 0;
};

const isOverflowScrollable = (overflowValue) =>
  overflowValue === 'auto' || overflowValue === 'scroll' || overflowValue === 'overlay';

const findScrollableAncestor = ({ startElement, axis }) => {
  let current = startElement;
  const sizeProp = axis === 'y' ? 'scrollHeight' : 'scrollWidth';
  const clientProp = axis === 'y' ? 'clientHeight' : 'clientWidth';
  const overflowProp = axis === 'y' ? 'overflowY' : 'overflowX';
  const scrollPosProp = axis === 'y' ? 'scrollTop' : 'scrollLeft';

  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const hasOverflow = current[sizeProp] > current[clientProp] + 1;
    const canScroll = isOverflowScrollable(style[overflowProp]);

    if (hasOverflow && canScroll) {
      const currentScroll = current[scrollPosProp];
      const maxScroll = current[sizeProp] - current[clientProp];

      if (maxScroll > 0 && currentScroll >= 0) {
        return current;
      }
    }

    current = current.parentElement;
  }

  const root = document.scrollingElement;
  if (!root) return null;

  if (root[sizeProp] > root[clientProp] + 1) {
    return root;
  }

  return null;
};

const canScrollElementInDirection = ({ elem, axis, delta }) => {
  if (!elem || delta === 0) return false;

  if (axis === 'y') {
    const maxScroll = elem.scrollHeight - elem.clientHeight;
    if (maxScroll <= 0) return false;
    return delta > 0 ? elem.scrollTop < maxScroll - 1 : elem.scrollTop > 1;
  }

  const maxScroll = elem.scrollWidth - elem.clientWidth;
  if (maxScroll <= 0) return false;
  return delta > 0 ? elem.scrollLeft < maxScroll - 1 : elem.scrollLeft > 1;
};

const AutoEdgeNavigator = ({
  selectedIndexDifference,
  replaceQueryParamValue,
  calendarRef,
  onEdgeNavigationZoneChange,
}) => {
  const selectedIndexDifferenceRef = useRef(selectedIndexDifference);
  const replaceQueryParamValueRef = useRef(replaceQueryParamValue);
  const pointerRef = useRef(null);
  const lastHorizontalNavigationMsRef = useRef(0);

  const { isDragging, clientOffset, itemType } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
    clientOffset: monitor.getClientOffset(),
    itemType: monitor.getItemType(),
  }));

  useEffect(() => {
    selectedIndexDifferenceRef.current = selectedIndexDifference;
  }, [selectedIndexDifference]);

  useEffect(() => {
    replaceQueryParamValueRef.current = replaceQueryParamValue;
  }, [replaceQueryParamValue]);

  useEffect(() => {
    pointerRef.current = clientOffset;
  }, [clientOffset]);

  useEffect(() => {
    const isSupportedDragType =
      itemType === DRAG_ITEM_TYPES.TASK || itemType === DRAG_ITEM_TYPES.TAG_DAY;

    if (!isDragging || !isSupportedDragType) {
      lastHorizontalNavigationMsRef.current = 0;
      onEdgeNavigationZoneChange(null);
      return undefined;
    }

    let animationFrameId = null;
    const tick = () => {
      const pointer = pointerRef.current;

      if (!pointer) {
        animationFrameId = window.requestAnimationFrame(tick);
        return;
      }

      const viewportWidth = window.innerWidth || 1;
      const viewportHeight = window.innerHeight || 1;
      const deltaY = resolveEdgeVelocity({
        pointerCoord: pointer.y,
        maxCoord: viewportHeight,
      });
      const deltaX = resolveEdgeVelocity({
        pointerCoord: pointer.x,
        maxCoord: viewportWidth,
      });

      if (deltaY !== 0 || deltaX !== 0) {
        const hoveredElement = document.elementFromPoint(pointer.x, pointer.y);
        const effectiveStartElement = hoveredElement || calendarRef.current;

        if (effectiveStartElement) {
          if (deltaY !== 0) {
            const verticalTarget = findScrollableAncestor({
              startElement: effectiveStartElement,
              axis: 'y',
            });
            if (canScrollElementInDirection({ elem: verticalTarget, axis: 'y', delta: deltaY })) {
              verticalTarget.scrollTop += deltaY;
            }
          }

          if (deltaX !== 0) {
            const horizontalTarget = findScrollableAncestor({
              startElement: effectiveStartElement,
              axis: 'x',
            });
            if (
              canScrollElementInDirection({
                elem: horizontalTarget,
                axis: 'x',
                delta: deltaX,
              })
            ) {
              onEdgeNavigationZoneChange(null);
              horizontalTarget.scrollLeft += deltaX;
            } else {
              onEdgeNavigationZoneChange(deltaX > 0 ? 'right' : 'left');
              const now = Date.now();

              if (now - lastHorizontalNavigationMsRef.current > HORIZONTAL_NAVIGATION_INTERVAL_MS) {
                lastHorizontalNavigationMsRef.current = now;
                replaceQueryParamValueRef.current(
                  URL_PARAM_KEYS.OFFSET_IDX,
                  selectedIndexDifferenceRef.current + (deltaX > 0 ? 1 : -1),
                );
              }
            }
          } else {
            onEdgeNavigationZoneChange(null);
          }
        }
      } else {
        onEdgeNavigationZoneChange(null);
      }

      animationFrameId = window.requestAnimationFrame(tick);
    };

    animationFrameId = window.requestAnimationFrame(tick);

    return () => {
      onEdgeNavigationZoneChange(null);
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [calendarRef, isDragging, itemType, onEdgeNavigationZoneChange]);

  return null;
};

const buildFallbackTag = (tag) =>
  tag || {
    id: SPECIAL_TAG_IDS.UNTAGGED,
    title: 'Untagged',
    displayColor: '#767676',
  };

const normalizeTasks = (items) =>
  (items || []).map((task) => ({
    ...task,
    tag: buildFallbackTag(task.tag),
  }));

const buildKeyedTags = ({ tags, tasks }) =>
  _.keyBy([...tasks.map((task) => task.tag), ...tags], (tag) => tag.id);

const TaskCalendar = ({
  getQueryParamValue,
  replaceQueryParamValue,
  getLocalValue,
  setLocalValue,
}) => {
  const CALENDAR_TOP_OFFSET = '5em';
  const client = useApolloClient();
  const calendarRef = useRef(null);
  const allTasksByIdRef = useRef({});
  const pointerRef = useRef(null);
  const [, setTodayRefreshCounter] = React.useState(0);
  const [activeEdgeNavigationZone, setActiveEdgeNavigationZone] = React.useState(null);
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

  useEffect(() => {
    const handleMouseMove = (event) => {
      pointerRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    let timeoutId = null;

    const scheduleNextMidnightRefresh = () => {
      const now = DateHelpers.getCurrentDatetime();
      const nextMidnight = now.plus({ days: 1 }).startOf('day');
      const msUntilNextMidnight = Math.max(0, Math.ceil(nextMidnight.diff(now).milliseconds));

      timeoutId = window.setTimeout(() => {
        setTodayRefreshCounter((count) => count + 1);
        scheduleNextMidnightRefresh();
      }, msUntilNextMidnight);
    };

    scheduleNextMidnightRefresh();

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  const isDayMode = selectedMode === MODES.DAY;

  const chunkedByWeek = loadEffectiveWeeks({
    selectedMode,
    isDayMode,
    effectiveCurrentDatetime,
    effectiveWindowSize,
  });

  const mainQueryVariables = useMemo(
    () => ({
      ...resolveBacklogQueryVariables(),
      fromDate: resolveFirstDate(chunkedByWeek).isoDate,
      toDate: resolveLastDate(chunkedByWeek).dateTime.plus({ days: 1 }).toISODate(),
    }),
    [chunkedByWeek],
  );

  const [onUpdateTask] = useMutation(TASK_UPDATE, {
    refetchQueries: [
      {
        query: GET_TASKS,
        variables: mainQueryVariables,
      },
      {
        query: GET_TASKS,
        variables: resolveBacklogQueryVariables(),
      },
    ],
    awaitRefetchQueries: true,
  });

  const handleUpdateTask = async (taskId, input) =>
    onUpdateTask({
      variables: {
        id: taskId,
        input,
      },
    });

  const { data: taskData } = useQuery(GET_TASKS, {
    variables: mainQueryVariables,
    fetchPolicy: 'cache-and-network' /** always hit the API for new data, rather than the cache */,
  });
  const { data: backlogData } = useQuery(GET_TASKS, {
    variables: resolveBacklogQueryVariables(),
    fetchPolicy: 'cache-and-network',
  });
  const { data: tagData } = useQuery(GET_TAGS);

  const tasks = normalizeTasks(taskData?.tasks);
  const backlogTasks = normalizeTasks(backlogData?.tasks).filter((task) => !task.dueDatetime);
  const tags = tagData?.tags || [];
  const calendarKeyedTags = buildKeyedTags({ tags, tasks });
  const backlogKeyedTags = buildKeyedTags({ tags, tasks: backlogTasks });

  useEffect(() => {
    allTasksByIdRef.current = _.keyBy([...tasks, ...backlogTasks], (task) => task.id);
  }, [tasks, backlogTasks]);

  useEffect(() => {
    configureTaskUndoManager({
      client,
      getTaskById: (id) => allTasksByIdRef.current[id],
      getRefetchQueries: () => [
        {
          query: GET_TASKS,
          variables: mainQueryVariables,
        },
        {
          query: GET_TASKS,
          variables: resolveBacklogQueryVariables(),
        },
      ],
    });

    return () => {
      clearTaskUndoManager();
    };
  }, [client, mainQueryVariables]);

  const resolveHoveredTaskId = () => {
    const pointer = pointerRef.current;

    if (pointer) {
      const hoveredElement = document.elementFromPoint(pointer.x, pointer.y);
      const hoveredTaskElement = hoveredElement?.closest?.('.task-item');
      const hoveredTaskId = hoveredTaskElement?.id;

      if (hoveredTaskId) {
        window.currentHoverTaskId = hoveredTaskId;
        return hoveredTaskId;
      }
    }

    return window.currentHoverTaskId;
  };

  const pushTask = async ({ direction }) => {
    const hoveredTaskId = resolveHoveredTaskId();
    const foundTask = tasks.find((t) => t.id === hoveredTaskId);

    if (!foundTask || foundTask?.status === TASK_STATUS.COMPLETE) return null;

    const input = {
      dueDatetime: DateHelpers.convertToDateTime(foundTask.dueDatetime)
        .set({ hour: 12, minute: 0 })
        .plus({ days: direction })
        .toFormat(SQL_DATE_TIME_FORMAT),
    };

    registerTaskUpdateUndo({ ids: [foundTask.id], input });

    return handleUpdateTask(foundTask.id, input);
  };

  useHotkeys([`${KEYBOARD_CODES.SHIFT}+${KEYBOARD_CODES.RIGHT_ARROW}`], () =>
    pushTask({ direction: 1 }),
  );

  useHotkeys([`${KEYBOARD_CODES.SHIFT}+${KEYBOARD_CODES.LEFT_ARROW}`], () =>
    pushTask({ direction: -1 }),
  );
  useHotkeys(['meta+z', 'ctrl+z'], async (event) => {
    if (document.activeElement && document.activeElement !== document.body) return;

    event.preventDefault();
    await undoLastTaskAction();
  });
  useHotkeys(['shift+meta+z', 'shift+ctrl+z'], async (event) => {
    if (document.activeElement && document.activeElement !== document.body) return;

    event.preventDefault();
    await redoLastTaskAction();
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <AutoEdgeNavigator
        selectedIndexDifference={selectedIndexDifference}
        replaceQueryParamValue={replaceQueryParamValue}
        calendarRef={calendarRef}
        onEdgeNavigationZoneChange={setActiveEdgeNavigationZone}
      />
      <div
        ref={calendarRef}
        className={`flex flex-col task-calendar text-white ${
          activeEdgeNavigationZone ? `edge-nav-active edge-nav-${activeEdgeNavigationZone}` : ''
        }`}
        style={{
          flex: '1 1 auto',
          marginTop: CALENDAR_TOP_OFFSET,
          height: `calc(100vh - ${CALENDAR_TOP_OFFSET})`,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <CalendarBody
          effectiveCurrentDatetime={effectiveCurrentDatetime}
          tasks={tasks}
          tags={tags}
          keyedTagsOverride={calendarKeyedTags}
          effectiveWindowSize={effectiveWindowSize}
          isDayMode={isDayMode}
          chunkedByWeek={chunkedByWeek}
          selectedMode={selectedMode}
        />
        <BacklogPanel
          tasks={backlogTasks}
          keyedTags={backlogKeyedTags}
          tags={tags}
          isDayMode={isDayMode}
          selectedMode={selectedMode}
          effectiveCurrentDatetime={effectiveCurrentDatetime}
          getLocalValue={getLocalValue}
          setLocalValue={setLocalValue}
        />
      </div>
    </DndProvider>
  );
};

export default WithQueryStrings(WithLocalStorage(TaskCalendar));
