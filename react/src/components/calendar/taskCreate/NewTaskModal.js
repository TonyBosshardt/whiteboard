import { useMutation } from '@apollo/client';
import React, { useState } from 'react';
import { Button, Checkbox, Modal } from 'semantic-ui-react';

import DateHelpers, { effectiveStartOfWeekIdx } from '../../../util/DateHelpers.js';
import { resolveQueryVariables } from '../../navbar/NavBar.js';
import EditableHeader from '../../ui/EditableHeader.js';
import EditableTextArea from '../../ui/EditableTextArea.js';
import InvertedDropdown from '../../ui/InvertedDropdown.js';
import { MODES } from '../CalendarHelpers.js';
import { CREATE_TASK } from '../mutations.js';
import { GET_TASKS } from '../queries.js';
import RecurringTaskSettings from './RecurringTaskSettings.js';

const DEFAULT_DAYS_RECURRING = 90;

const NewTaskModal = ({
  onClose,
  initialDueDatetime,
  tags,
  selectedMode,
  effectiveCurrentDatetime,
}) => {
  const [prototypeTaskParams, setPrototypeTaskParams] = useState({
    title: '',
    description: '',
    tagId: '',
    originalDueDatetime: initialDueDatetime,
  });

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringTaskParams, setRecurringTaskParams] = useState({
    daysOfTheWeek: new Set(),
    everyNDay: null,
    endDatetime: initialDueDatetime.plus({ days: DEFAULT_DAYS_RECURRING }),
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
    ],
  });

  const handleCreateTasks = async () => {
    setIsLoading(true);

    const baseInput = [
      {
        title: prototypeTaskParams.title,
        description: prototypeTaskParams.description || null,
        dueDatetime: DateHelpers.dateTimeToSQLFormat(prototypeTaskParams.originalDueDatetime),
        originalDueDatetime: DateHelpers.dateTimeToSQLFormat(
          prototypeTaskParams.originalDueDatetime,
        ),
        tagId: prototypeTaskParams.tagId || null,
        userId: '1',
      },
    ];

    if (isRecurring) {
      const { daysOfTheWeek, endDatetime, everyNDay } = recurringTaskParams;

      const validationFunction = everyNDay
        ? ({ idx }) => !(idx % everyNDay)
        : ({ nextDate }) => daysOfTheWeek.has(effectiveStartOfWeekIdx(nextDate));

      const end = DateHelpers.convertToDateTime(endDatetime).startOf('day');
      const start = initialDueDatetime.startOf('day');

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

    await onCreateTasks({
      variables: {
        input: baseInput,
      },
    });

    setIsLoading(false);
    onClose();
  };

  const canSubmit = (() => {
    const base = !!prototypeTaskParams.title && !!prototypeTaskParams.tagId;

    if (isRecurring) {
      const { daysOfTheWeek, everyNDay } = recurringTaskParams;

      return base && (!!everyNDay || !!daysOfTheWeek.size);
    }

    return base;
  })();

  return (
    <Modal open onClose={onClose} size="small" style={{ border: '1px solid lightgray' }}>
      <Modal.Header
        className="flex text-white"
        style={{ backgroundColor: 'rgb(42 42 42)', borderBottom: '1px solid' }}
      >
        <span style={{ flex: 1 }}>New Task</span>{' '}
        <span>{prototypeTaskParams.originalDueDatetime.toFormat('LLL dd yyyy')}</span>
      </Modal.Header>
      <Modal.Content style={{ backgroundColor: 'rgb(42 42 42)' }}>
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
          <div>
            <Checkbox
              label="Recurring"
              className="text-white action-area"
              style={{ padding: '0.5em' }}
              checked={!!isRecurring}
              onChange={() => setIsRecurring(!isRecurring)}
            />
          </div>
          {isRecurring && (
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
