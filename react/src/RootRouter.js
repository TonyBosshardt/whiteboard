import React from 'react';
import { Route, Switch } from 'react-router-dom';

import TaskCalendar from './components/calendar/TaskCalendar.js';
import NavBar from './components/navbar/NavBar.js';

const RootContainer = ({ children }) => (
  <div className="flex flex-col root-container">{children}</div>
);

const RootRouter = () => (
  <RootContainer>
    <NavBar />
    <Switch>
      <Route path="/" component={TaskCalendar} />
    </Switch>
  </RootContainer>
);

export default RootRouter;
