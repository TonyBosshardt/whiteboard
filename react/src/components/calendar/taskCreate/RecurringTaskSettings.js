import classNames from 'classnames';
import _ from 'lodash';
import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { Checkbox, Divider } from 'semantic-ui-react';

import DateHelpers from '../../../util/DateHelpers.js';
import { standardSetSelection } from '../../../util/SetUtils.js';
import InvertedDropdown from '../../ui/InvertedDropdown.js';

const DAY_OF_WEEK_ABBREVIATIONS = ['S', 'M', 'T', 'W', 'R', 'F', 'S'];
const N_DAYS_OPTIONS = _.range(1, 8).map((r) => ({ text: `${r} days`, value: r }));

const DateDisplay = forwardRef(({ onClick, selectedDatetime }, ref) => (
  <span onClick={onClick} ref={ref} className={classNames('date-display-selection', {})} style={{}}>
    {DateHelpers.convertToDateTime(selectedDatetime).toFormat('LLL dd yyyy')}
  </span>
));

const RecurringTaskSettings = ({ recurringTaskParams, setRecurringTaskParams }) => {
  return (
    <div
      className="flex flex-col text-white"
      style={{
        padding: '1em',
        marginLeft: '1em',
        marginTop: '0.5em',
        borderLeft: '1px solid',
      }}
    >
      <div
        className="flex"
        style={{
          position: 'relative',
          marginBottom: '1em',
        }}
      >
        <div className="flex flex-col" style={{ flex: 1 }}>
          <div className="flex flex-col" style={{ margin: '0 auto 0 auto' }}>
            <span>Repeat every</span>
            <InvertedDropdown
              search
              selection
              value={recurringTaskParams.everyNDay || ''}
              onChange={(e, { value }) =>
                setRecurringTaskParams({
                  ...recurringTaskParams,
                  everyNDay: value,
                  daysOfTheWeek: new Set(),
                })
              }
              options={N_DAYS_OPTIONS}
            />
          </div>
        </div>
        <Divider vertical style={{ color: 'white' }}>
          OR
        </Divider>
        <div className="flex" style={{ flex: 1 }}>
          <div className="flex flex-col" style={{ flex: 1, marginLeft: '2em' }}>
            <div className="flex">
              {DAY_OF_WEEK_ABBREVIATIONS.map((s, idx) => {
                const isSelected = recurringTaskParams.daysOfTheWeek.has(idx);

                return (
                  <div
                    className="flex flex-col action-area recurring-day-selector"
                    key={s}
                    onClick={() =>
                      setRecurringTaskParams({
                        ...recurringTaskParams,
                        everyNDay: null,
                        daysOfTheWeek: standardSetSelection(recurringTaskParams.daysOfTheWeek, idx),
                      })
                    }
                  >
                    <span style={{ marginBottom: '0.5em' }}>{s}</span>
                    <Checkbox checked={isSelected} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <span style={{ marginBottom: '1em' }}>Until</span>
        <div>
          <DatePicker
            onChange={(date) => {
              const end = DateHelpers.convertToDateTime(date);
              setRecurringTaskParams({
                ...recurringTaskParams,
                endDatetime: end,
              });
            }}
            selected={
              recurringTaskParams.endDatetime
                ? recurringTaskParams.endDatetime.toJSDate()
                : new Date()
            }
            popperPlacement="bottom-start"
            customInput={
              <DateDisplay selectedDatetime={recurringTaskParams.endDatetime ?? new Date()} />
            }
          />
        </div>
      </div>
    </div>
  );
};

export default RecurringTaskSettings;
