import DateHelpers from '../../util/DateHelpers.js';
import { SPECIAL_TAG_IDS } from '../../util/constants.js';
import { TASKS_UPDATE, TASK_UPDATE } from './mutations.js';

const MAX_UNDO_STACK_SIZE = 25;

let undoStack = [];
let redoStack = [];
let apolloClient = null;
let getTaskById = () => null;
let getRefetchQueries = () => [];

const resolveTaskFieldValue = (task, key) => {
  if (!task) return null;

  if (key === 'dueDatetime' || key === 'originalDueDatetime' || key === 'completeDatetime') {
    return task[key]
      ? DateHelpers.dateTimeToSQLFormat(DateHelpers.convertToDateTime(task[key]))
      : null;
  }

  if (key === 'tagId') {
    if (!task.tag || task.tag.id === SPECIAL_TAG_IDS.UNTAGGED) return null;
    return task.tag.id;
  }

  if (key === 'isDeleted') {
    return 0;
  }

  return task[key] ?? null;
};

const pushHistoryEntry = (entry) => {
  undoStack.push(entry);
  redoStack = [];

  if (undoStack.length > MAX_UNDO_STACK_SIZE) {
    undoStack = undoStack.slice(-MAX_UNDO_STACK_SIZE);
  }
};

const applyTaskUpdates = ({ ids, input }) =>
  apolloClient.mutate({
    mutation: TASKS_UPDATE,
    variables: {
      ids,
      input,
    },
    refetchQueries: getRefetchQueries(),
    awaitRefetchQueries: true,
  });

export const configureTaskUndoManager = ({
  client,
  getTaskById: taskGetter,
  getRefetchQueries: queryGetter,
}) => {
  apolloClient = client;
  getTaskById = taskGetter;
  getRefetchQueries = queryGetter;
};

export const clearTaskUndoManager = () => {
  apolloClient = null;
  getTaskById = () => null;
  getRefetchQueries = () => [];
  undoStack = [];
  redoStack = [];
};

export const registerTaskUpdateUndo = ({ ids, input }) => {
  const snapshots = (ids || []).map((id) => getTaskById(id)).filter(Boolean);

  if (!snapshots.length) return;

  pushHistoryEntry({
    undo: async () => {
      await Promise.all(
        snapshots.map((task) =>
          apolloClient.mutate({
            mutation: TASK_UPDATE,
            variables: {
              id: task.id,
              input: Object.keys(input).reduce((acc, key) => {
                acc[key] = resolveTaskFieldValue(task, key);
                return acc;
              }, {}),
            },
            refetchQueries: getRefetchQueries(),
            awaitRefetchQueries: true,
          }),
        ),
      );
    },
    redo: async () => {
      await applyTaskUpdates({ ids: snapshots.map((task) => task.id), input });
    },
  });
};

export const registerTaskCreateUndo = ({ ids }) => {
  if (!ids?.length) return;

  pushHistoryEntry({
    undo: async () => {
      await applyTaskUpdates({
        ids,
        input: {
          isDeleted: 1,
        },
      });
    },
    redo: async () => {
      await applyTaskUpdates({
        ids,
        input: {
          isDeleted: 0,
        },
      });
    },
  });
};

export const undoLastTaskAction = async () => {
  const entry = undoStack.pop();

  if (!entry || !apolloClient) return false;

  await entry.undo();
  redoStack.push(entry);
  return true;
};

export const redoLastTaskAction = async () => {
  const entry = redoStack.pop();

  if (!entry || !apolloClient) return false;

  await entry.redo();
  undoStack.push(entry);
  return true;
};
