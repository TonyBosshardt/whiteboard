import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import RootRouter from './src/RootRouter.js';

import './index.scss';
import 'react-datepicker/dist/react-datepicker.css';

const client = new ApolloClient({
  uri: 'http://localhost:4000/',
  cache: new InMemoryCache(),
});

const rootContainer = document.getElementById('root');

const rootNode = ReactDOM.createRoot(rootContainer);

rootNode.render(
  <ApolloProvider client={client}>
    <HashRouter>
      <RootRouter />
    </HashRouter>
  </ApolloProvider>,
);
