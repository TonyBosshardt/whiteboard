import CaseUtils from './util/CaseUtils.js';

const TASK_DATETIME_FIELDS = ['completeDatetime', 'dueDatetime', 'originalDueDatetime'];

const normalizeDateTimeValue = (value) => {
  if (value == null) return value;

  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString().slice(0, 19).replace('T', ' ');
  }

  if (typeof value !== 'string') return value;

  const trimmedValue = value.trim();

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmedValue)) {
    return trimmedValue;
  }

  const isoMatch = trimmedValue.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/,
  );

  if (isoMatch) {
    return `${isoMatch[1]} ${isoMatch[2]}`;
  }

  return value;
};

const normalizeTaskInput = (input) =>
  Object.entries(input).reduce((acc, [key, value]) => {
    acc[key] = TASK_DATETIME_FIELDS.includes(key) ? normalizeDateTimeValue(value) : value;
    return acc;
  }, {});

const resolvers = {
  Task: {
    id: ({ taskId }) => taskId,
    parentTask: ({ parentTaskId }, args, { dbConnection }) =>
      dbConnection('task')
        .where('task_id', parentTaskId)
        .then((rows) => {
          const [row] = CaseUtils.toCamelCase(rows);

          return row;
        }),
    subtasks: ({ taskId }, args, { dbConnection }) =>
      dbConnection('task')
        .where('parent_task_id', taskId)
        .then((rows) => {
          return CaseUtils.toCamelCase(rows);
        }),
    tag: ({ tagId }, args, { dbConnection }) =>
      dbConnection('tag')
        .where('tag_id', tagId)
        .then((rows) => {
          const [row] = CaseUtils.toCamelCase(rows);
          return row;
        }),
    user: ({ userId }, args, { dbConnection }) =>
      dbConnection('user')
        .where('user_id', userId)
        .then((rows) => {
          const [row] = CaseUtils.toCamelCase(rows);

          return row;
        }),
  },
  Tag: {
    id: ({ tagId }) => tagId,
  },
  User: {
    id: ({ userId }) => userId,
  },
  Query: {
    task: (obj, { id }, { dbConnection }) =>
      dbConnection('task')
        .where('task_id', id)
        .then((rows) => {
          const [row] = CaseUtils.toCamelCase(rows);

          return row;
        }),
    tasks: (obj, { userId, fromDate, toDate }, { dbConnection }) => {
      const baseQuery = dbConnection('task').where('user_id', userId).where('is_deleted', 0);

      if (fromDate) {
        baseQuery.where('due_datetime', '>=', fromDate);
      }
      if (toDate) {
        baseQuery.where('due_datetime', '<=', toDate);
      }

      return baseQuery.then((rows) => CaseUtils.toCamelCase(rows));
    },
    tag() {},
    tags: (obj, args, { dbConnection }) =>
      dbConnection
        .select('*')
        .from('tag')
        .then((rows) => CaseUtils.toCamelCase(rows)),
    user() {},
  },
  Mutation: {
    tasksCreate: async (obj, { input }, { dbConnection }) => {
      const normalizedInput = input.map(normalizeTaskInput);
      const ids = await dbConnection.batchInsert('task', CaseUtils.toSnakeCase(normalizedInput), 30);

      return dbConnection('task')
        .whereIn('task_id', ids)
        .then((rows) => CaseUtils.toCamelCase(rows));
    },
    taskUpdate: async (obj, { input, id }, { dbConnection }) => {
      await dbConnection('task')
        .where('task_id', '=', id)
        .update(CaseUtils.toSnakeCase(normalizeTaskInput(input)));

      return dbConnection('task')
        .where('task_id', id)
        .then((rows) => {
          const [row] = CaseUtils.toCamelCase(rows);

          return row;
        });
    },
    tasksUpdate: async (obj, { input, ids }, { dbConnection }) => {
      await dbConnection('task')
        .whereIn('task_id', ids)
        .update(CaseUtils.toSnakeCase(normalizeTaskInput(input)));

      return dbConnection('task')
        .whereIn('task_id', ids)
        .then((rows) => CaseUtils.toCamelCase(rows));
    },
    tagUpdate: async (obj, { input, id }, { dbConnection }) => {
      await dbConnection('tag').where('tag_id', '=', id).update(CaseUtils.toSnakeCase(input));

      return dbConnection('tag')
        .where('tag_id', id)
        .then((rows) => {
          const [row] = CaseUtils.toCamelCase(rows);

          return row;
        });
    },
  },
};

export default resolvers;
