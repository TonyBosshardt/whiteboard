import { useMutation } from '@apollo/client';
import React, { useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useHotkeys } from 'react-hotkeys-hook';
import { Popup } from 'semantic-ui-react';

import DateHelpers from '../../util/DateHelpers.js';
import { DRAG_ITEM_TYPES, KEYBOARD_CODES, TASK_STATUS } from '../../util/constants.js';
import { resolveQueryVariables } from '../navbar/NavBar.js';
import TaskItemContent from './TaskItemContent.js';
import { CREATE_TASK, TASK_UPDATE } from './mutations.js';
import { GET_TASKS } from './queries.js';
import TaskItemPopupContent from './task/TaskItemPopupContent.js';

const POPUP_POSITIONS = {
  TOP_LEFT: 'top left',
  LEFT_CENTER: 'left center',
};

const MIN_HEIGHT_FOR_POPUP_PX = 150;

const _resolveEffectivePopupPosition = ({ id }) => {
  const elem = document.getElementById(id);
  const rect = elem.getBoundingClientRect();

  if (window.innerHeight - rect.bottom < MIN_HEIGHT_FOR_POPUP_PX) {
    return POPUP_POSITIONS.TOP_LEFT;
  }

  return POPUP_POSITIONS.LEFT_CENTER;
};

const canDropIncomingItem = ({
  dropParentTaskId,
  incomingTagId,
  dropTagId,
  incomingTaskId,
  dropTaskId,
}) => !dropParentTaskId && incomingTagId === dropTagId && incomingTaskId !== dropTaskId;

const TaskItem = ({
  task,
  isDayMode,
  tags,
  effectiveCurrentDatetime,
  selectedMode,
  isSubTask,
  subTaskCount,
  setIsExpanded,
  isExpanded,
  handleUpdateTasks,
}) => {
  const { id, title, estimatedCompletionTimeMinutes, status, isUrgent, parentTaskId } = task;
  const isComplete = status === TASK_STATUS.COMPLETE;

  const ref = useRef(null);

  const [onUpdateTask] = useMutation(TASK_UPDATE);
  const [onCreateTask] = useMutation(CREATE_TASK);

  const [isLoading, setIsLoading] = useState(false);
  const [isQuickEditTitle, setIsQuickEditTitle] = useState(false);
  const [effectivePopupPosition, setEffectivePopupPosition] = useState(POPUP_POSITIONS.LEFT_CENTER);
  const [popupOpen, _setPopupOpen] = useState(false);

  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: DRAG_ITEM_TYPES.TASK,
    canDrag: () => !isComplete,
    item: { ids: [id], parentTaskId, tagId: task.tag.id },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));

  const [currentHoveringState, dropRef] = useDrop(() => ({
    accept: [DRAG_ITEM_TYPES.TASK],
    drop: async (incomingItem) => {
      const { ids, tagId } = incomingItem;

      if (
        canDropIncomingItem({
          dropParentTaskId: parentTaskId,
          incomingTagId: tagId,
          dropTagId: task.tag.id,
          incomingTaskId: ids[0],
          dropTaskId: id,
        })
      ) {
        await handleUpdateTasks(ids, {
          parentTaskId: id,
        });
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      hoveringItems: monitor.getItem(),
    }),
  }));

  dragRef(dropRef(ref));

  const setPopupOpen = (nextState) => {
    if (nextState) {
      setEffectivePopupPosition(_resolveEffectivePopupPosition({ id }));
      _setPopupOpen(true);
    } else {
      _setPopupOpen(false);
    }
  };

  useHotkeys([KEYBOARD_CODES.ENTER], (e) => {
    e.preventDefault();

    if (window.currentHoverTaskId === id && document.activeElement === document.body) {
      setPopupOpen(true);
      setIsQuickEditTitle(true);
    }
  });

  const _wrapMutation = async (mutation) => {
    setIsLoading(true);

    await mutation;

    setIsLoading(false);
  };

  const handleUpdateTask = async (input, mutationProps = {}) => {
    _wrapMutation(
      onUpdateTask({
        variables: {
          id,
          input,
        },
        ...mutationProps,
      }),
    );
  };

  const handleDuplicateTask = () => {
    const dueDatetime = DateHelpers.dateTimeToSQLFormat(DateHelpers.getCurrentDatetime());

    return _wrapMutation(
      onCreateTask({
        variables: {
          input: [
            {
              title,
              originalDueDatetime: dueDatetime,
              dueDatetime,
              tagId: task.tag.id,
              parentTaskId,
              userId: '1',
            },
          ],
        },
        refetchQueries: [
          {
            query: GET_TASKS,
            variables: resolveQueryVariables({
              selectedMode,
              effectiveCurrentDatetime,
              isDayMode,
            }),
          },
        ],
      }),
    );
  };

  return (
    <Popup
      position={isDayMode ? 'bottom right' : effectivePopupPosition}
      on="hover"
      hoverable
      open={popupOpen}
      onClose={() => {
        setPopupOpen(false);
        setIsQuickEditTitle(false);
      }}
      trigger={
        <TaskItemContent
          dragRef={ref}
          setPopupOpen={setPopupOpen}
          isDayMode={isDayMode}
          isDragging={isDragging}
          isComplete={isComplete}
          popupOpen={popupOpen}
          handleDuplicateTask={handleDuplicateTask}
          setIsQuickEditTitle={setIsQuickEditTitle}
          taskId={task.id}
          isSubTask={isSubTask}
          handleUpdateTask={handleUpdateTask}
          isLoading={isLoading}
          title={title}
          estimatedCompletionTimeMinutes={estimatedCompletionTimeMinutes}
          parentTaskId={parentTaskId}
          isUrgent={isUrgent}
          subTaskCount={subTaskCount}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          isValidOver={
            currentHoveringState.isOver &&
            canDropIncomingItem({
              dropParentTaskId: parentTaskId,
              incomingTagId: currentHoveringState.hoveringItems?.tagId,
              dropTagId: task.tag.id,
              incomingTaskId: currentHoveringState.hoveringItems?.ids[0],
              dropTaskId: id,
            })
          }
        />
      }
      content={
        <TaskItemPopupContent
          isQuickEditTitle={isQuickEditTitle}
          handleUpdateTask={handleUpdateTask}
          handleDuplicateTask={handleDuplicateTask}
          setIsQuickEditTitle={setIsQuickEditTitle}
          isLoading={isLoading}
          task={task}
          tags={tags}
          setPopupOpen={setPopupOpen}
        />
      }
    />
  );
};

// TaskItem.propTypes = {
//     task: PropTypes.shape({
//         id: PropTypes.string.isRequired,
//         title: PropTypes.string.isRequired,
//         estimatedCompletionTimeMinutes: PropTypes.number,
//         status: PropTypes.string.isRequired,
//         isUrgent: PropTypes.bool,
//     }).isRequired,
//     isDayMode: PropTypes.bool.isRequired,
//     tags: PropTypes.object.isRequired,
//     effectiveCurrentDatetime: PropTypes.string.isRequired,
//     selectedMode: PropTypes.string.isRequired,
//     isSubTask: PropTypes.bool,
// };

export default TaskItem;
