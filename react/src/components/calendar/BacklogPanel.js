import { useMutation } from '@apollo/client';
import classNames from 'classnames';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import { Button, Icon } from 'semantic-ui-react';

import { DRAG_ITEM_TYPES } from '../../util/constants.js';
import { resolveBacklogQueryVariables, resolveQueryVariables } from '../navbar/NavBar.js';
import TaskContent from './TaskContent.js';
import { TASKS_UPDATE } from './mutations.js';
import { GET_TASKS } from './queries.js';
import NewTaskModal from './taskCreate/NewTaskModal.js';
import { registerTaskUpdateUndo } from './taskUndoManager.js';

const BACKLOG_STORAGE_KEY = 'backlog-panel-expanded';
const BACKLOG_HEIGHT_STORAGE_KEY = 'backlog-panel-height';
const DEFAULT_BACKLOG_HEIGHT_PX = 240;
const MIN_BACKLOG_HEIGHT_PX = 120;
const MAX_BACKLOG_HEIGHT_RATIO = 0.65;

const BacklogPanel = ({
  tasks,
  keyedTags,
  tags,
  isDayMode,
  selectedMode,
  effectiveCurrentDatetime,
  getLocalValue,
  setLocalValue,
}) => {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(
    !!getLocalValue(BACKLOG_STORAGE_KEY, { defaultValue: 1, isNumeric: true }),
  );
  const [backlogHeight, setBacklogHeight] = useState(
    getLocalValue(BACKLOG_HEIGHT_STORAGE_KEY, {
      defaultValue: DEFAULT_BACKLOG_HEIGHT_PX,
      isNumeric: true,
    }) || DEFAULT_BACKLOG_HEIGHT_PX,
  );
  const resizeStateRef = useRef(null);

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

  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: [DRAG_ITEM_TYPES.TASK, DRAG_ITEM_TYPES.TAG_DAY],
    drop: (item) => {
      const ids = item.allTaskIds || item.ids;
      const input = {
        dueDatetime: null,
      };

      registerTaskUpdateUndo({ ids, input });

      return onUpdateTasks({
        variables: {
          ids,
          input,
        },
      });
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const groupedTaskIds = useMemo(
    () =>
      Object.keys(_.groupBy(tasks, (task) => task.tag?.id))
        .filter((tagId) => keyedTags[tagId])
        .sort((a, b) => keyedTags[a].title.localeCompare(keyedTags[b].title)),
    [keyedTags, tasks],
  );

  const toggleExpanded = () => {
    const next = !isExpanded;
    setLocalValue(BACKLOG_STORAGE_KEY, next ? 1 : 0);
    setIsExpanded(next);
  };

  useEffect(() => {
    setLocalValue(BACKLOG_HEIGHT_STORAGE_KEY, backlogHeight);
  }, [backlogHeight, setLocalValue]);

  useEffect(() => {
    const onMouseMove = (event) => {
      const state = resizeStateRef.current;

      if (!state) return;

      const deltaY = state.startY - event.clientY;
      const maxHeight = Math.floor(window.innerHeight * MAX_BACKLOG_HEIGHT_RATIO);
      const nextHeight = Math.max(
        MIN_BACKLOG_HEIGHT_PX,
        Math.min(maxHeight, state.startHeight + deltaY),
      );

      setBacklogHeight(nextHeight);
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

  const startResize = (event) => {
    event.preventDefault();

    resizeStateRef.current = {
      startY: event.clientY,
      startHeight: backlogHeight,
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'row-resize';
  };

  return (
    <>
      {isCreateModalOpen ? (
        <NewTaskModal
          onClose={() => setCreateModalOpen(false)}
          initialIsUnscheduled
          allowUnscheduled
          tags={tags}
          selectedMode={selectedMode}
          effectiveCurrentDatetime={effectiveCurrentDatetime}
        />
      ) : null}
      <div
        className={classNames('backlog-panel', { collapsed: !isExpanded, active: isOver })}
        style={isExpanded ? { height: `${backlogHeight}px` } : undefined}
      >
        {isExpanded ? <div className="backlog-resize-handle" onMouseDown={startResize} /> : null}
        <div className="flex backlog-panel-header">
          <div
            className="flex backlog-panel-title"
            role="button"
            tabIndex={0}
            onClick={toggleExpanded}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleExpanded();
              }
            }}
          >
            <span>Backlog</span>
            <span className="backlog-count">{tasks.length}</span>
          </div>
          <Button basic inverted size="mini" icon onClick={() => setCreateModalOpen(true)}>
            <Icon name="plus" />
          </Button>
          <Button basic inverted size="mini" icon onClick={toggleExpanded}>
            <Icon name={isExpanded ? 'chevron down' : 'chevron up'} />
          </Button>
        </div>
        {isExpanded ? (
          <div ref={dropRef} className="backlog-panel-body">
            {groupedTaskIds.length ? (
              groupedTaskIds.map((tagId) => (
                <TaskContent
                  key={`backlog-${tagId}`}
                  keyedTags={keyedTags}
                  tagId={tagId}
                  tags={tags}
                  tasks={tasks.filter((task) => task.tag?.id === tagId)}
                  isDayMode={isDayMode}
                  isoDate="backlog"
                  selectedMode={selectedMode}
                  effectiveCurrentDatetime={effectiveCurrentDatetime}
                  handleUpdateTasks={(ids, input) => {
                    registerTaskUpdateUndo({ ids, input });

                    return onUpdateTasks({
                      variables: {
                        ids,
                        input,
                      },
                    });
                  }}
                  initialDueDatetime={null}
                  initialIsUnscheduled
                />
              ))
            ) : (
              <div className="backlog-empty-state">
                <Icon name="inbox" />
                <span>Drop tasks here or add a new unscheduled task.</span>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
};

export default BacklogPanel;
