import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { Header } from 'semantic-ui-react';

import DateHelpers from '../../util/DateHelpers.js';
import { URL_PARAM_KEYS } from '../../util/constants.js';
import { MODES } from '../calendar/CalendarHelpers.js';

const MonthDisplay = forwardRef(({ onClick, effectiveCurrentDatetime }, ref) => (
  <div className="date-selector-outer" onClick={onClick} ref={ref}>
    <Header style={{ color: 'white', margin: 'auto' }}>
      {effectiveCurrentDatetime.toFormat('LLLL')}
      <span style={{ fontSize: '0.75em', color: 'gray', marginLeft: '0.5em' }}>
        {effectiveCurrentDatetime.toFormat('yyyy')}
      </span>
    </Header>
  </div>
));

const DateSelector = ({ effectiveCurrentDatetime, setQueryParamObject }) => {
  const handleUpdateEffectiveDate = (date) => {
    const end = DateHelpers.convertToDateTime(date).startOf('day');
    const start = DateHelpers.getCurrentDatetime().startOf('day');

    const diff = Math.floor(end.diff(start).as('days'));

    setQueryParamObject({
      [URL_PARAM_KEYS.VIEW_MODE]: MODES.DAY,
      [URL_PARAM_KEYS.OFFSET_IDX]: diff,
    });
  };

  return (
    <DatePicker
      selected={effectiveCurrentDatetime.toJSDate()}
      onChange={handleUpdateEffectiveDate}
      customInput={<MonthDisplay effectiveCurrentDatetime={effectiveCurrentDatetime} />}
    />
  );
};

export default DateSelector;
