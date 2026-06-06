import { useMutation } from '@apollo/client';
import React, { useState } from 'react';
import { Button, Checkbox, Modal } from 'semantic-ui-react';

import DateHelpers, { effectiveStartOfWeekIdx } from '../../../util/DateHelpers.js';
import { resolveBacklogQueryVariables, resolveQueryVariables } from '../../navbar/NavBar.js';
import EditableHeader from '../../ui/EditableHeader.js';
import EditableTextArea from '../../ui/EditableTextArea.js';
import InvertedDropdown from '../../ui/InvertedDropdown.js';
import { MODES } from '../CalendarHelpers.js';
import { CREATE_TASK } from '../mutations.js';
import { GET_TASKS } from '../queries.js';
import { registerTaskCreateUndo } from '../taskUndoManager.js';
import RecurringTaskSettings from './RecurringTaskSettings.js';

const DEFAULT_DAYS_RECURRING = 90;

const NewTaskModal = ({
  onClose,
  initialDueDatetime = null,
  initialTagId = '',
  initialIsUnscheduled = false,
  allowUnscheduled = false,
  tags,
  selectedMode,
  effectiveCurrentDatetime,
}) => {
  const resolvedInitialDueDatetime =
    initialDueDatetime || DateHelpers.getCurrentDatetime().set({ hour: 12, minute: 0 });
  const [prototypeTaskParams, setPrototypeTaskParams] = useState({
    title: '',
    description: '',
    tagId: initialTagId,
    originalDueDatetime: resolvedInitialDueDatetime,
    isUnscheduled: initialIsUnscheduled,
  });

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringTaskParams, setRecurringTaskParams] = useState({
    daysOfTheWeek: new Set(),
    everyNDay: null,
    endDatetime: resolvedInitialDueDatetime.plus({ days: DEFAULT_DAYS_RECURRING }),
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateTaskParams = (key, value) =>
    setPrototypeTaskParams({ ...prototypeTaskParams, [key]: value });

  const [onCreateTasks] = useMutation(CREATE_TASK, {
    refetchQueries: [
      {
        query: GET_TASKS,
        variables: resolveQueryVariables({
          selectedMode,
          effectiveCurrentDatetime,
          isDayMode: selectedMode === MODES.DAY,
        }),
      },
      {
        query: GET_TASKS,
        variables: resolveBacklogQueryVariables(),
      },
    ],
  });

  const resolveCanSubmit = () => {
    const base = !!prototypeTaskParams.title && !!prototypeTaskParams.tagId;

    if (isRecurring && !prototypeTaskParams.isUnscheduled) {
      const { daysOfTheWeek, everyNDay } = recurringTaskParams;

      return base && (!!everyNDay || !!daysOfTheWeek.size);
    }

    return base;
  };

  const handleCreateTasks = async () => {
    if (isLoading || !resolveCanSubmit()) return;

    setIsLoading(true);

    const baseInput = [
      {
        title: prototypeTaskParams.title,
        description: prototypeTaskParams.description || null,
        dueDatetime: prototypeTaskParams.isUnscheduled
          ? null
          : DateHelpers.dateTimeToSQLFormat(prototypeTaskParams.originalDueDatetime),
        originalDueDatetime: prototypeTaskParams.isUnscheduled
          ? null
          : DateHelpers.dateTimeToSQLFormat(prototypeTaskParams.originalDueDatetime),
        tagId: prototypeTaskParams.tagId || null,
        userId: '1',
      },
    ];

    if (isRecurring && !prototypeTaskParams.isUnscheduled) {
      const { daysOfTheWeek, endDatetime, everyNDay } = recurringTaskParams;

      const validationFunction = everyNDay
        ? ({ idx }) => !(idx % everyNDay)
        : ({ nextDate }) => daysOfTheWeek.has(effectiveStartOfWeekIdx(nextDate));

      const end = DateHelpers.convertToDateTime(endDatetime).startOf('day');
      const start = resolvedInitialDueDatetime.startOf('day');

      const diff = Math.floor(end.diff(start).as('days'));

      for (let i = 0; i <= diff; i += 1) {
        const nextDate = start.plus({ days: i });

        if (
          validationFunction({ idx: i, nextDate }) &&
          nextDate.toISODate() !== prototypeTaskParams.originalDueDatetime.toISODate()
        ) {
          baseInput.push({
            title: prototypeTaskParams.title,
            description: prototypeTaskParams.description || null,
            dueDatetime: DateHelpers.dateTimeToSQLFormat(nextDate),
            originalDueDatetime: DateHelpers.dateTimeToSQLFormat(nextDate),
            tagId: prototypeTaskParams.tagId || null,
            userId: '1',
          });
        }
      }
    }

    const response = await onCreateTasks({
      variables: {
        input: baseInput,
      },
    });

    registerTaskCreateUndo({
      ids: response?.data?.tasksCreate?.map((task) => task.id) || [],
    });

    setIsLoading(false);
    onClose();
  };

  const canSubmit = resolveCanSubmit();

  return (
    <Modal open onClose={onClose} size="small" style={{ border: '1px solid lightgray' }}>
      <Modal.Header
        className="flex text-white"
        style={{ backgroundColor: 'rgb(42 42 42)', borderBottom: '1px solid' }}
      >
        <span style={{ flex: 1 }}>New Task</span>{' '}
        <span>
          {prototypeTaskParams.isUnscheduled
            ? 'Backlog'
            : prototypeTaskParams.originalDueDatetime.toFormat('LLL dd yyyy')}
        </span>
      </Modal.Header>
      <Modal.Content
        style={{ backgroundColor: 'rgb(42 42 42)' }}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' || e.shiftKey) return;
          if (e.target?.tagName === 'TEXTAREA') return;

          e.preventDefault();
          handleCreateTasks();
        }}
      >
        <div className="flex flex-col" style={{ marginBottom: '1em' }}>
          <span className="text-white">Title</span>
          <EditableHeader
            inverted
            startInEditMode
            text={prototypeTaskParams.title}
            submitChanges={(nameEdit) => handleUpdateTaskParams('title', nameEdit)}
            containerProps={{ style: { fontSize: '0.9em' } }}
            disabled={isLoading}
          />
        </div>
        <div className="flex flex-col" style={{ marginBottom: '1em' }}>
          <span className="text-white">Description</span>
          <EditableTextArea
            inverted
            autoExpandHeight
            text={prototypeTaskParams.description}
            disabled={isLoading}
            submitChanges={(descEdit) => handleUpdateTaskParams('description', descEdit)}
          />
        </div>
        <div className="flex flex-col" style={{ marginBottom: '1em' }}>
          <span className="text-white">Tag</span>
          <InvertedDropdown
            options={tags.map((t) => ({ text: t.title, value: t.id }))}
            value={prototypeTaskParams.tagId}
            disabled={isLoading}
            onChange={(e, { value }) => handleUpdateTaskParams('tagId', value)}
          />
        </div>
        <div className="flex flex-col" style={{ marginBottom: '1em' }}>
          {allowUnscheduled ? (
            <div>
              <Checkbox
                label="Add to backlog"
                className="text-white action-area"
                style={{ padding: '0.5em 0 0.75em 0' }}
                checked={!!prototypeTaskParams.isUnscheduled}
                onChange={() =>
                  handleUpdateTaskParams('isUnscheduled', !prototypeTaskParams.isUnscheduled)
                }
              />
            </div>
          ) : null}
          <div>
            <Checkbox
              label="Recurring"
              className="text-white action-area"
              style={{ padding: '0.5em' }}
              disabled={prototypeTaskParams.isUnscheduled}
              checked={!!isRecurring}
              onChange={() => setIsRecurring(!isRecurring)}
            />
          </div>
          {isRecurring && !prototypeTaskParams.isUnscheduled && (
            <RecurringTaskSettings
              recurringTaskParams={recurringTaskParams}
              setRecurringTaskParams={setRecurringTaskParams}
            />
          )}
        </div>
        <Button
          fluid
          primary={canSubmit}
          disabled={isLoading || !canSubmit}
          loading={isLoading}
          onClick={handleCreateTasks}
        >
          Submit
        </Button>
      </Modal.Content>
    </Modal>
  );
};

export default NewTaskModal;
