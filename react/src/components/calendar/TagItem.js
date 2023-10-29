import { useMutation } from '@apollo/client';
import classNames from 'classnames';
import React from 'react';
import { Button, Icon, Label, Popup } from 'semantic-ui-react';

import DateHelpers, { SQL_DATE_TIME_FORMAT } from '../../util/DateHelpers.js';
import { TASKS_UPDATE } from './mutations.js';

const TagItem = ({
  tag,
  tasksAllComplete,
  totalTaskCount,
  isExpanded,
  setIsExpanded,
  isDayMode,
  completedTaskCount,
  incompleteTasks,
}) => {
  const { title, displayColor } = tag;

  const [onUpdateTask] = useMutation(TASKS_UPDATE);

  const handleUpdateTasks = (taskIds, input) =>
    onUpdateTask({
      variables: {
        ids: taskIds,
        input,
      },
    });

  return (
    <Popup
      on="hover"
      hoverable
      disabled={!incompleteTasks.length}
      position={!isDayMode ? 'left center' : 'bottom right'}
      className="tag-item-container"
      style={{ minWidth: '15em' }}
      content={
        <Button
          primary
          onClick={() =>
            handleUpdateTasks(
              incompleteTasks.map((t) => t.id),
              {
                dueDatetime: DateHelpers.convertToDateTime(incompleteTasks[0].dueDatetime)
                  .set({ hour: 12 })
                  .plus({ days: 1 })
                  .toFormat(SQL_DATE_TIME_FORMAT),
              },
            )
          }
        >
          Move all incomplete <Icon name="arrow right" />
        </Button>
      }
      trigger={
        <div className="flex tag-item-header" onClick={() => setIsExpanded(!isExpanded)}>
          {tasksAllComplete && (
            <Icon
              name="check circle"
              color="green"
              size="large"
              style={{ margin: 'auto 0.5em auto 0px' }}
            />
          )}
          <Label
            size={isDayMode ? 'large' : 'small'}
            className="flex tag-item-label protected-text"
            style={{ backgroundColor: displayColor, margin: 1 }}
          >
            <span className="flex-grow text-white">{title}</span>
            <div className="flex text-white" style={{ marginRight: '0.75em' }}>
              <span style={{ margin: 'auto 0 auto auto' }}>
                {completedTaskCount} / {totalTaskCount}
              </span>
            </div>
            <Icon
              className={classNames('text-white expand-icon', { open: isExpanded })}
              name="chevron right"
              style={{ marginRight: 0 }}
            />
          </Label>
        </div>
      }
    />
  );
};

export default TagItem;
