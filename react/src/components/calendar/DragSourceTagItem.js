import classNames from 'classnames';
import React from 'react';
import { useDrag } from 'react-dnd';
import { Icon, Label } from 'semantic-ui-react';

import { DRAG_ITEM_TYPES } from '../../util/constants.js';

const DragSourceTagItem = ({
  isDayMode,
  setIsExpanded,
  isExpanded,
  tasksAllComplete,
  displayColor,
  title,
  completedTaskCount,
  totalTaskCount,
  incompleteTasks,
}) => {
  const incompleteTaskIds = incompleteTasks.map((t) => t.id);

  const [, dragRef] = useDrag(
    () => ({
      type: DRAG_ITEM_TYPES.TAG_DAY,
      canDrag: () => !tasksAllComplete,
      item: { ids: incompleteTaskIds },
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    }),
    [incompleteTaskIds],
  );

  return (
    <div className="flex tag-item-header" onClick={() => setIsExpanded(!isExpanded)} ref={dragRef}>
      <Label
        size={isDayMode ? 'large' : 'small'}
        className={classNames('flex protected-text tag-item-label', {
          expanded: isExpanded,
          complete: isExpanded && tasksAllComplete,
        })}
        style={{ backgroundColor: displayColor }}
      >
        <span className="flex-grow text-white">{title}</span>
        <div className="flex text-white" style={{ marginRight: '0.75em' }}>
          {tasksAllComplete ? (
            <Icon name="check circle" style={{ fontSize: '1em' }} />
          ) : (
            <span style={{ margin: 'auto 0 auto auto' }}>
              {completedTaskCount} / {totalTaskCount}
            </span>
          )}
        </div>
        <Icon
          className={classNames('text-white expand-icon', { open: isExpanded })}
          name="chevron right"
          style={{ marginRight: 0 }}
        />
      </Label>
    </div>
  );
};

export default DragSourceTagItem;
