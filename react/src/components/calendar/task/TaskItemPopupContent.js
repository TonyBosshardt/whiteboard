import classNames from 'classnames';
import React from 'react';
import { Button, Header, Icon } from 'semantic-ui-react';

import DateHelpers, { SQL_DATE_TIME_FORMAT } from '../../../util/DateHelpers.js';
import EditableHeader from '../../ui/EditableHeader.js';
import EditableTextArea from '../../ui/EditableTextArea.js';
import InvertedDropdown from '../../ui/InvertedDropdown.js';

const TaskItemPopupContent = ({
  isQuickEditTitle,
  handleUpdateTask,
  setIsQuickEditTitle,
  isLoading,
  task,
  tags,
}) => {
  const {
    title,
    description,
    daysPutOff,
    completeDatetime,
    tag,
    dueDatetime,
    originalDueDatetime,
    estimatedCompletionTimeMinutes,
  } = task;

  return (
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
      <div className="flex" style={{ marginBottom: '0.25em' }}>
        <div className="flex flex-col flex-grow" style={{ marginRight: '0.25em' }}>
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
        <div className="flex flex-col flex-grow" style={{ marginLeft: '0.25em' }}>
          <span style={{ fontSize: '0.75rem' }}>Time to Complete (m)</span>
          <EditableHeader
            inverted
            text={estimatedCompletionTimeMinutes}
            inputProps={{ fluid: true }}
            submitChanges={(timeEdit) =>
              handleUpdateTask({
                estimatedCompletionTimeMinutes: timeEdit ? +timeEdit : null,
              })
            }
            disabled={isLoading}
            containerProps={{
              style: {
                fontSize: '0.9em',
              },
            }}
          />
        </div>
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
  );
};

export default TaskItemPopupContent;
