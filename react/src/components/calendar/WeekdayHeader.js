import classNames from 'classnames';
import React from 'react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const loadEffectiveHeaders = ({ effectiveWindowSize, effectiveCurrentDatetime }) => {
  if (effectiveWindowSize) {
    const todayIdx = effectiveCurrentDatetime.weekday;

    const effectiveHeaders = [];

    for (let i = todayIdx; i < todayIdx + effectiveWindowSize; i += 1) {
      effectiveHeaders.push(DAYS[i % 7]);
    }
    return effectiveHeaders;
  }

  return DAYS;
};

const WeekdayHeader = ({ effectiveWindowSize, effectiveCurrentDatetime }) => (
  <div className="flex">
    {loadEffectiveHeaders({ effectiveCurrentDatetime, effectiveWindowSize }).map((d) => (
      <span key={d} className={classNames('weekday-header')}>
        {d}
      </span>
    ))}
  </div>
);

export default WeekdayHeader;
