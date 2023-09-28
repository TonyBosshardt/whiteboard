import React from 'react';
import { Header } from 'semantic-ui-react';

const DateSelector = ({ effectiveCurrentDatetime }) => {
  return (
    <div style={{ margin: 'auto 1em auto 0' }}>
      <Header style={{ color: 'white' }}>
        {effectiveCurrentDatetime.toFormat('LLLL')}
        <Header.Subheader style={{ fontSize: '0.7em', color: 'white' }}>
          {effectiveCurrentDatetime.toFormat('yyyy')}
        </Header.Subheader>
      </Header>
    </div>
  );
};

export default DateSelector;
