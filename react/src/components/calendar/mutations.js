import { gql } from '@apollo/client';

import { TAG_FIELDS, TASK_FIELDS } from './queries.js';

export const TASK_UPDATE = gql`
  ${TASK_FIELDS}
  mutation TASK_UPDATE($input: TaskCreateInput!, $id: ID!) {
    taskUpdate(input: $input, id: $id) {
      ...TaskFields
    }
  }
`;

export const TASKS_UPDATE = gql`
  ${TASK_FIELDS}
  mutation TASKS_UPDATE($input: TaskCreateInput!, $ids: [ID!]!) {
    tasksUpdate(input: $input, ids: $ids) {
      ...TaskFields
    }
  }
`;

export const CREATE_TASK = gql`
  mutation TaskCreate($input: [TaskCreateInput!]!) {
    tasksCreate(input: $input) {
      id
    }
  }
`;

export const TAG_UPDATE = gql`
  ${TAG_FIELDS}
  mutation UpdateTag($input: TagCreateInput!, $id: ID!) {
    tagUpdate(input: $input, id: $id) {
      ...TagFields
    }
  }
`;
