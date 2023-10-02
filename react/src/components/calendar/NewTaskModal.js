import { gql, useMutation, useQuery } from '@apollo/client';
import React, { useState } from 'react';
import { Button, Modal } from 'semantic-ui-react';

import DateHelpers, { SQL_DATE_TIME_FORMAT } from '../../util/DateHelpers.js';
import EditableHeader from '../ui/EditableHeader.js';
import EditableTextArea from '../ui/EditableTextArea.js';
import InvertedDropdown from '../ui/InvertedDropdown.js';
import { GET_TASKS } from './TaskCalendar.js';

/**
 * 
    description: String
    dueDatetime: DateTime
    originalDueDatetime: DateTime
    project: Project
    
    tag: Tag
    title: String
    user: User
    
 */
const CREATE_TASK = gql`
  mutation TaskCreate($input: [TaskCreateInput!]!) {
    tasksCreate(input: $input) {
      id
    }
  }
`;

const NewTaskModal = ({ open, onClose, initialDueDatetime, tags }) => {
  const [newTaskParams, setNewTaskParams] = useState({
    title: '',
    description: '',
    tagId: '',
    originalDueDatetime: initialDueDatetime,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const handleUpdateTaskParams = (key, value) =>
    setNewTaskParams({ ...newTaskParams, [key]: value });

  const canSubmit = !!newTaskParams.title && !!newTaskParams.tagId;

  const [onCreateTask] = useMutation(CREATE_TASK, {
    refetchQueries: [{ query: GET_TASKS }],
  });

  const handleCreateTask = async () => {
    setIsLoading(true);

    await onCreateTask({
      variables: {
        input: {
          title: newTaskParams.title,
          description: newTaskParams.description || null,
          dueDatetime: newTaskParams.originalDueDatetime
            .set({ hour: 12, minute: 0 })
            .toFormat(SQL_DATE_TIME_FORMAT),
          originalDueDatetime: newTaskParams.originalDueDatetime
            .set({ hour: 12, minute: 0 })
            .toFormat(SQL_DATE_TIME_FORMAT),
          tagId: newTaskParams.tagId || null,
          userId: '1',
        },
      },
    });

    setIsLoading(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} size="mini" style={{ border: '1px solid lightgray' }}>
      <Modal.Header
        className="flex text-white"
        style={{ backgroundColor: 'rgb(42 42 42)', borderBottom: '1px solid' }}
      >
        <span style={{ flex: 1 }}>New Task</span>{' '}
        <span>{newTaskParams.originalDueDatetime.toFormat('LLL dd yyyy')}</span>
      </Modal.Header>
      <Modal.Content style={{ backgroundColor: 'rgb(42 42 42)' }}>
        <div className="flex flex-col" style={{ marginBottom: '1em' }}>
          <span className="text-white">Title</span>
          <EditableHeader
            inverted
            text={newTaskParams.title}
            externallySetEdit={isInitialLoad}
            onAfterSubmitChange={() => setIsInitialLoad(false)}
            submitChanges={(nameEdit) => handleUpdateTaskParams('title', nameEdit)}
            containerProps={{ style: { fontSize: '0.9em' } }}
            disabled={isLoading}
          />
        </div>
        <div className="flex flex-col" style={{ marginBottom: '1em' }}>
          <span className="text-white">Description</span>
          <EditableTextArea
            inverted
            text={newTaskParams.description}
            disabled={isLoading}
            submitChanges={(descEdit) => handleUpdateTaskParams('description', descEdit)}
          />
        </div>
        <div className="flex flex-col" style={{ marginBottom: '1em' }}>
          <span className="text-white">Tag</span>
          <InvertedDropdown
            options={tags.map((t) => ({ text: t.title, value: t.id }))}
            value={newTaskParams.tagId}
            disabled={isLoading}
            onChange={(e, { value }) => handleUpdateTaskParams('tagId', value)}
          />
        </div>
        <Button
          fluid
          primary={canSubmit}
          disabled={isLoading || !canSubmit}
          loading={isLoading}
          onClick={handleCreateTask}
        >
          Submit
        </Button>
      </Modal.Content>
    </Modal>
  );
};

export default NewTaskModal;
