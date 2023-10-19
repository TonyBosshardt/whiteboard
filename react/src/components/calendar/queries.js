import { gql } from '@apollo/client';

export const TAG_FIELDS = gql`
  fragment TagFields on Tag {
    id
    title
    displayColor
  }
`;

export const TASK_FIELDS = gql`
  fragment TaskFields on Task {
    id
    completeDatetime
    daysPutOff
    estimatedCompletionTimeMinutes
    originalDueDatetime
    user {
      id
      firstName
      lastName
    }
    title
    description
    tag {
      id
    }
    dueDatetime
    status
    insertDatetime
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
