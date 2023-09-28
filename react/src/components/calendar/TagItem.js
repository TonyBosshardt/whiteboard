import classNames from 'classnames';
import React from 'react';
import { Icon, Label, Popup } from 'semantic-ui-react';

const TagItem = ({
  tag,
  tasksAllComplete,
  totalTaskCount,
  isExpanded,
  setIsExpanded,
  isDayMode,
  completedTaskCount,
}) => {
  const { title, displayColor } = tag;

  return (
    <Popup
      on="hover"
      hoverable
      position={!isDayMode ? 'left center' : 'bottom right'}
      className="tag-item-container"
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
            size="small"
            className="flex tag-item-label"
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
