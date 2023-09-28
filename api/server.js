import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

import resolvers from './src/resolvers.js';
import typeDefs from './src/schema.js';
import getDBConnection from './src/util/dbConnection.js';

const SERVER_LISTEN_PORT = 4000;

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: SERVER_LISTEN_PORT },
  context: () => ({ dbConnection: getDBConnection() }),
});

console.log(`🚀  Server ready at: ${url}`);
