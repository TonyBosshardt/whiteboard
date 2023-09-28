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
    user: User
    title: String
    description: String
    tag: Tag
    project: Project
    status: String
    dueDatetime: DateTime
    insertDatetime: DateTime
    completeDatetime: DateTime
  }

  # MUTATION INPUTS
  input TaskCreateInput {
    userId: ID
    title: String
    description: String
    tagId: ID
    projectId: ID
    status: String
    completeDatetime: DateTime
    dueDatetime: DateTime
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    task(id: ID!): Task
    tasks(userId: ID!, projectId: ID, tagId: ID): [Task]

    tag(id: ID!): Tag
    tags: [Tag]

    user(id: ID!): User
  }

  type Mutation {
    tasksCreate(input: [TaskCreateInput!]!): [Task]
    taskUpdate(input: TaskCreateInput!, id: ID!): Task
  }
`;

export default typeDefs;
