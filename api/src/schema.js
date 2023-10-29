const typeDefs = `#graphql

  # supporting data types
  scalar DateTime

  # QUERY TYPES
  type User {
    id: ID
    firstName: String
    lastName: String
    emailAddress: String
    insertDatetime: DateTime
  }

  type Tag {
    id: ID
    title: String
    description: String
    displayColor: String
    tasks: [Task]
    taskCount: Int
    insertDatetime: DateTime
  }

  type Project {
    id: ID
    title: String
    description: String
    tasks: [Task]
    insertDatetime: DateTime
  }

  type Task {
    id: ID
    completeDatetime: DateTime
    daysPutOff: Int # generated column, 
    description: String
    dueDatetime: DateTime
    estimatedCompletionTimeMinutes: Int
    isUrgent: Int
    originalDueDatetime: DateTime
    project: Project
    status: String
    tag: Tag
    title: String
    user: User
    insertDatetime: DateTime
  }

  # MUTATION INPUTS
  input TaskCreateInput {
    userId: ID
    title: String
    estimatedCompletionTimeMinutes: Int
    description: String
    isUrgent: Int
    tagId: ID
    projectId: ID
    status: String
    completeDatetime: DateTime
    dueDatetime: DateTime
    isDeleted: Int
    originalDueDatetime: DateTime
  }

  input TagCreateInput {
    title: String
    displayColor: String
  }

  type Query {
    task(id: ID!): Task
    tasks(userId: ID!, projectId: ID, tagId: ID, fromDate: String, toDate: String): [Task]

    tag(id: ID!): Tag
    tags: [Tag]

    user(id: ID!): User
  }

  type Mutation {
    tasksCreate(input: [TaskCreateInput!]!): [Task]

    taskUpdate(input: TaskCreateInput!, id: ID!): Task
    tasksUpdate(input: TaskCreateInput!, ids: [ID!]!): [Task]

    tagUpdate(input: TagCreateInput!, id: ID!): Tag
  }
`;

export default typeDefs;
