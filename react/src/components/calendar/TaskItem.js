import { useMutation } from '@apollo/client';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Button, Checkbox, Header, Icon, Popup } from 'semantic-ui-react';

import DateHelpers, { SQL_DATE_TIME_FORMAT } from '../../util/DateHelpers.js';
import { KEYBOARD_CODES, TASK_STATUS } from '../../util/constants.js';
import EditableHeader from '../ui/EditableHeader.js';
import EditableTextArea from '../ui/EditableTextArea.js';
import InvertedDropdown from '../ui/InvertedDropdown.js';
import { TASK_UPDATE } from './mutations.js';

const TaskItem = ({ task, isDayMode, tags }) => {
  const {
    id,
    title,
    description,
    daysPutOff,
    originalDueDatetime,
    dueDatetime,
    completeDatetime,
    status,
    tag,
  } = task;

  const [isLoading, setIsLoading] = useState(false);
  const [isQuickEditTitle, setIsQuickEditTitle] = useState(false);

  useHotkeys([KEYBOARD_CODES.ENTER], (e) => {
    e.preventDefault();

    if (window.currentHoverTaskId === id && document.activeElement === document.body) {
      setIsQuickEditTitle(true);
    }
  });

  const isComplete = status === TASK_STATUS.COMPLETE;

  const [onUpdateTask] = useMutation(TASK_UPDATE);

  const handleUpdateTask = async (input, mutationProps = {}) => {
    setIsLoading(true);

    await onUpdateTask({
      variables: {
        id,
        input,
      },
      ...mutationProps,
    });

    setIsLoading(false);
  };

  return (
    <Popup
      position={!isDayMode ? 'left center' : 'bottom right'}
      on="hover"
      hoverable
      onClose={() => setIsQuickEditTitle(false)}
      trigger={
        <div
          id={id}
          className={classNames('flex task-item', { 'day-mode': isDayMode })}
          style={{
            textDecoration: isComplete ? 'line-through' : 'none',
          }}
          onClick={() => setIsQuickEditTitle(true)}
          onMouseEnter={() => (window.currentHoverTaskId = id)}
          onMouseLeave={() => (window.currentHoverTaskId = null)}
        >
          <Checkbox
            style={{ margin: '0 0.5em auto 0' }}
            checked={isComplete}
            onChange={(e) => {
              e.stopPropagation();
              const payload = {};
              if (!isComplete) {
                payload.status = 'complete';
                payload.completeDatetime =
                  DateHelpers.getCurrentDatetime().toFormat(SQL_DATE_TIME_FORMAT);
              } else {
                payload.status = 'incomplete';
                payload.completeDatetime = null;
              }
              handleUpdateTask(payload);
            }}
            disabled={isLoading}
          />
          <span style={{ margin: 'auto auto auto 0' }}>{title}</span>
        </div>
      }
      content={
        <div className="flex flex-col" style={{ color: 'whitesmoke' }}>
          <div className="flex flex-col">
            <span style={{ fontSize: '0.75rem' }}>Task</span>
            <EditableHeader
              inverted
              text={title}
              externallySetEdit={isQuickEditTitle}
              onAfterSubmitChange={() => setIsQuickEditTitle(false)}
              submitChanges={(nameEdit) => {
                if (nameEdit) {
                  handleUpdateTask({
                    title: nameEdit,
                  });
                }
              }}
              disabled={isLoading}
              containerProps={{
                style: {
                  fontSize: '0.9em',
                },
              }}
            />
          </div>
          <div className="flex flex-col" style={{ marginBottom: '0.25em' }}>
            <span style={{ fontSize: '0.75rem' }}>Description</span>
            <EditableTextArea
              inverted
              disabled={isLoading}
              text={description}
              submitChanges={(descEdit) =>
                handleUpdateTask({
                  description: descEdit,
                })
              }
            />
          </div>
          <div className="flex flex-col" style={{ marginBottom: '0.25em' }}>
            <span style={{ fontSize: '0.75rem' }}>Tag</span>
            <InvertedDropdown
              options={tags.map((t) => ({ text: t.title, value: t.id }))}
              value={tag?.id}
              loading={isLoading}
              onChange={(e, { value }) =>
                handleUpdateTask({
                  tagId: value,
                })
              }
            />
          </div>
          <div className="flex">
            <div className="flex flex-col" style={{ margin: 'auto auto 0 0' }}>
              <span style={{ fontSize: '0.75rem' }}>Original Due Date</span>
              <Header
                className="text-white"
                style={{ fontSize: '0.9em', margin: 0, padding: '0 0 0 0.75em' }}
              >
                {DateHelpers.convertToDateTime(originalDueDatetime).toFormat('LLL dd')}
              </Header>
            </div>
            <div className="flex flex-col" style={{ margin: 'auto auto 0 auto' }}>
              <span style={{ fontSize: '0.75rem' }}>Completion Date</span>
              <Header
                className="text-white"
                style={{ fontSize: '0.9em', margin: 0, padding: '0 0 0 0.75em' }}
              >
                {completeDatetime
                  ? DateHelpers.convertToDateTime(completeDatetime).toFormat('LLL dd')
                  : '-'}
              </Header>
            </div>
            <div className={classNames('procrastination-badge', { active: daysPutOff > 0 })}>
              {daysPutOff > 0 && <Icon name="exclamation circle" color="red" />} Days Put Off:{' '}
              {daysPutOff > 0 ? daysPutOff : 0}
            </div>
          </div>
          <div className="flex" style={{ marginTop: '1em' }}>
            <Button
              color="red"
              style={{ margin: 'auto auto auto 0', fontSize: '0.7em' }}
              size="tiny"
              onClick={async () => {
                await handleUpdateTask({ isDeleted: 1 });

                // TODO: refetch tasks for the specific day to hide this deleted task
              }}
            >
              Delete
            </Button>
            <div style={{ margin: 'auto 0 0 auto' }}>
              <Button.Group size="tiny">
                <Button
                  secondary
                  style={{ padding: '0.75em' }}
                  onClick={() =>
                    handleUpdateTask({
                      dueDatetime: DateHelpers.convertToDateTime(dueDatetime)
                        .set({ hour: 12, minute: 0 })
                        .plus({ days: -1 })
                        .toFormat(SQL_DATE_TIME_FORMAT),
                    })
                  }
                >
                  <Icon name="left arrow" />
                  Move back
                </Button>
                <Button
                  primary
                  style={{ padding: '0.75em' }}
                  onClick={() =>
                    handleUpdateTask({
                      dueDatetime: DateHelpers.convertToDateTime(dueDatetime)
                        .set({ hour: 12, minute: 0 })
                        .plus({ days: 1 })
                        .toFormat(SQL_DATE_TIME_FORMAT),
                    })
                  }
                >
                  Move forward <Icon name="right arrow" />
                </Button>
              </Button.Group>
            </div>
          </div>
        </div>
      }
    />
  );
};

export default TaskItem;
