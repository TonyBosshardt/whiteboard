import _ from 'lodash';

import DateHelpers from '../../util/DateHelpers.js';

const TODAY = DateHelpers.getCurrentISODate();
const DAYS_IN_WEEK = 7;

export const MODES = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
};

const MODE_TO_DURATION = {
  [MODES.DAY]() {
    return 1;
  },
  [MODES.WEEK]() {
    return DAYS_IN_WEEK;
  },
  [MODES.MONTH](monthIdx, year) {
    return new Date(year, monthIdx, 0).getDate();
  },
};

export const MODE_OPTIONS = [MODES.DAY, MODES.WEEK, MODES.MONTH];

export const resolveCurrentEffectiveDatetime = ({ selectedMode, selectedIndexDifference }) =>
  DateHelpers.getCurrentDatetime().plus({ [`${selectedMode}s`]: selectedIndexDifference });

const resolveStartOfSelectedMode = ({ selectedMode, effectiveCurrentDatetime }) => {
  if (selectedMode === MODES.DAY) {
    return effectiveCurrentDatetime;
  }

  if (selectedMode === MODES.WEEK) {
    return DateHelpers.getStartOfWeekForDay(effectiveCurrentDatetime);
  }

  return DateHelpers.getStartOfMonthForDay(effectiveCurrentDatetime);
};

const _mapDayIdxToUS = (idx) => (idx % 7) + 1;

const _padFront = ({ firstDate, startDateForRange }) => {
  const padding = [];

  if (_mapDayIdxToUS(firstDate.dateTime.toFormat('c')) !== 1) {
    const paddedDays = _mapDayIdxToUS(firstDate.dateTime.toFormat('c')) - 1;

    for (let i = paddedDays; i > 0; i -= 1) {
      const dateObj = startDateForRange.minus({ days: i });
      const asIso = dateObj.toISODate();

      padding.push({ dateTime: dateObj, isoDate: asIso, inactive: true });
    }
  }

  return padding;
};

export const loadEffectiveWeeks = ({
  selectedMode,
  isDayMode,
  effectiveCurrentDatetime,
  effectiveWindowSize,
}) => {
  const effectiveMonthIdx = effectiveCurrentDatetime.toFormat('L');
  const effectiveYear = effectiveCurrentDatetime.toFormat('yyyy');

  const daysInMode = MODE_TO_DURATION[selectedMode](effectiveMonthIdx, effectiveYear);

  const startDateForRange = resolveStartOfSelectedMode({ selectedMode, effectiveCurrentDatetime });

  const dates = _.range(daysInMode).map((dayIndex) => {
    const dateObj = startDateForRange.plus({ days: dayIndex });

    const asIso = dateObj.toISODate();

    return { dateTime: dateObj, isoDate: asIso, isToday: asIso === TODAY };
  });

  if (isDayMode) {
    return [dates];
  }

  const [firstDate] = dates;

  const previousMonthPadding = _padFront({ firstDate, startDateForRange });

  const effectiveDates = [...previousMonthPadding, ...dates];

  const chunked = _.chunk(effectiveDates, DAYS_IN_WEEK);

  const lastChunk = chunked[chunked.length - 1];

  if (lastChunk.length !== DAYS_IN_WEEK) {
    const diff = DAYS_IN_WEEK - lastChunk.length;

    const lastDate = lastChunk[lastChunk.length - 1].dateTime;

    for (let i = 1; i < diff + 1; i += 1) {
      const dateObj = lastDate.plus({ days: i });
      const asIso = dateObj.toISODate();

      lastChunk.push({ dateTime: dateObj, isoDate: asIso, inactive: true });
    }
  }

  return chunked;
};
