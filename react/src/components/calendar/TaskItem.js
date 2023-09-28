import { gql, useMutation } from '@apollo/client';
import React, { useRef, useState } from 'react';
import { Button, Checkbox, Dropdown, Icon, Popup } from 'semantic-ui-react';

import DateHelpers, {
  SQL_DATE_TIME_FORMAT,
  STANDARD_DATE_TIME_FORMAT,
} from '../../util/DateHelpers.js';
import EditableHeader from '../ui/EditableHeader.js';
import EditableTextArea from '../ui/EditableTextArea.js';

const TASK_UPDATE = gql`
  mutation TASK_UPDATE($input: TaskCreateInput!, $id: ID!) {
    taskUpdate(input: $input, id: $id) {
      id
      title
      description
      dueDatetime
      insertDatetime
      completeDatetime
      status
      tag {
        id
      }
    }
  }
`;

const TaskItem = ({ task, isDayMode, tags }) => {
  const { id, title, description, dueDatetime, insertDatetime, completeDatetime, status, tag } =
    task;

  const [isLoading, setIsLoading] = useState(false);
  const [isQuickEditTitle, setIsQuickEditTitle] = useState(false);

  const isComplete = status === 'complete';

  const [onUpdateTask] = useMutation(TASK_UPDATE);

  const handleUpdateTask = async (input) => {
    setIsLoading(true);

    await onUpdateTask({
      variables: {
        id,
        input,
      },
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
          className="flex task-item"
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
          <div className="flex flex-col">
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
          <div className="flex flex-col">
            <span
              style={{
                fontSize: '0.75rem',
              }}
            >
              Tag
            </span>
            <Dropdown
              style={{
                backgroundColor: 'transparent',
                color: 'white',
                paddingLeft: '0.5em',
              }}
              className="inverted-dropdown"
              search
              selection
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
          <div className="flex" style={{ marginTop: '1em' }}>
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
