import { gql } from '@apollo/client';

export const TAG_FIELDS = gql`
  fragment TagFields on Tag {
    id
    title
    displayColor
  }
`;

export const TASK_FIELDS = gql`
  ${TAG_FIELDS}
  fragment TaskFields on Task {
    id
    daysPutOff
    originalDueDatetime
    user {
      id
      firstName
      lastName
    }
    title
    description
    tag {
      ...TagFields
    }
    dueDatetime
    status
    insertDatetime
    completeDatetime
  }
`;

export const GET_TASKS = gql`
  ${TASK_FIELDS}
  query GetTasks($fromDate: String, $toDate: String, $userId: ID!) {
    tasks(userId: $userId, toDate: $toDate, fromDate: $fromDate) {
      ...TaskFields
    }
  }
`;

export const GET_TAGS = gql`
  ${TAG_FIELDS}
  query GetTags {
    tags {
      ...TagFields
    }
  }
`;
