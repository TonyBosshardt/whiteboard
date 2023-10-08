import CaseUtils from './util/CaseUtils.js';

const resolvers = {
  Task: {
    id: ({ taskId }, args, { dbConnection }) => taskId,
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
    task: (obj, { id }, { dbConnection }, info) =>
      dbConnection('task')
        .where('task_id', id)
        .then((rows) => {
          const [row] = CaseUtils.toCamelCase(rows);

          return row;
        }),
    tasks: (obj, { userId, projectId, tagId, fromDate, toDate }, { dbConnection }) => {
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
    user({ userId }) {},
  },
  Mutation: {
    tasksCreate: async (obj, { input }, { dbConnection }) => {
      const ids = await dbConnection.batchInsert('task', CaseUtils.toSnakeCase(input), 30);

      return dbConnection('task')
        .whereIn('task_id', ids)
        .then((rows) => CaseUtils.toCamelCase(rows));
    },
    taskUpdate: async (obj, { input, id }, { dbConnection }) => {
      await dbConnection('task').where('task_id', '=', id).update(CaseUtils.toSnakeCase(input));

      return dbConnection('task')
        .where('task_id', id)
        .then((rows) => {
          const [row] = CaseUtils.toCamelCase(rows);

          return row;
        });
    },
    tasksUpdate: async (obj, { input, ids }, { dbConnection }) => {
      await dbConnection('task').whereIn('task_id', ids).update(CaseUtils.toSnakeCase(input));

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
