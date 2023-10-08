import { gql, useMutation, useQuery } from '@apollo/client';
import _ from 'lodash';
import React, { useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Button, Dropdown, Input } from 'semantic-ui-react';

import DateHelpers, { SQL_DATE_TIME_FORMAT } from '../../util/DateHelpers.js';
import WithQueryStrings from '../../util/WithQueryStrings.js';
import { KEYBOARD_CODES, KEYBOARD_SHORTCUTS, URL_PARAM_KEYS } from '../../util/constants.js';
import {
  MODES,
  MODE_OPTIONS,
  loadEffectiveWeeks,
  resolveCurrentEffectiveDatetime,
  resolveFirstDate,
  resolveLastDate,
} from '../calendar/CalendarHelpers.js';
import { GET_TAGS, GET_TASKS } from '../calendar/queries.js';
import DateSelector from './DateSelector.js';
import TagManager from './TagManager.js';

import './NavBar.scss';

const QUICK_CREATE_TASK = gql`
  mutation TaskCreate($input: [TaskCreateInput!]!) {
    tasksCreate(input: $input) {
      id
    }
  }
`;

export const resolveQueryVariables = ({ selectedMode, effectiveCurrentDatetime, isDayMode }) => {
  const chunkedByWeek = loadEffectiveWeeks({
    selectedMode,
    isDayMode,
    effectiveCurrentDatetime,
  });

  return {
    userId: '1',
    fromDate: resolveFirstDate(chunkedByWeek).isoDate,
    toDate: resolveLastDate(chunkedByWeek).dateTime.plus({ days: 1 }).toISODate(),
  };
};

const NavBar = ({ getQueryParamValue, replaceQueryParamValue, setQueryParamObject }) => {
  const inputRef = useRef();

  const selectedMode = getQueryParamValue(URL_PARAM_KEYS.VIEW_MODE, MODES.WEEK);
  const selectedIndexDifference = getQueryParamValue(URL_PARAM_KEYS.OFFSET_IDX, 0, {
    isNumeric: true,
  });

  const effectiveCurrentDatetime = resolveCurrentEffectiveDatetime({
    selectedMode,
    selectedIndexDifference,
  });

  const { data } = useQuery(GET_TAGS);
  const tags = data?.tags || [];

  const [onCreateTask] = useMutation(QUICK_CREATE_TASK, {
    refetchQueries: [
      {
        query: GET_TASKS,
        variables: resolveQueryVariables({
          selectedMode,
          effectiveCurrentDatetime,
          isDayMode: selectedMode === MODES.DAY,
        }),
      },
    ],
  });

  const [selectedTagId, setSelectedTagId] = useState('');
  const [quickAddText, setQuickAddText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);

  const handleCreateTask = async () => {
    setIsLoading(true);

    const dt = DateHelpers.getCurrentDatetime()
      .set({ hour: 12, minute: 0 })
      .toFormat(SQL_DATE_TIME_FORMAT);

    await onCreateTask({
      variables: {
        input: {
          title: quickAddText,
          originalDueDatetime: dt,
          dueDatetime: dt,
          tagId: selectedTagId || null,
          userId: '1',
        },
      },
    });

    setIsLoading(false);
  };

  const onChangeMode = (mode) => replaceQueryParamValue(URL_PARAM_KEYS.VIEW_MODE, mode);

  const handleSetFocus = (e) => {
    e.preventDefault();
    if (inputRef?.current) {
      inputRef.current.focus();
    }
  };

  useHotkeys(KEYBOARD_SHORTCUTS.FOCUS_INPUT_QUICK_ADD, handleSetFocus);

  useHotkeys('d', () =>
    setQueryParamObject({ [URL_PARAM_KEYS.VIEW_MODE]: MODES.DAY, [URL_PARAM_KEYS.OFFSET_IDX]: 0 }),
  );
  useHotkeys('w', () =>
    setQueryParamObject({ [URL_PARAM_KEYS.VIEW_MODE]: MODES.WEEK, [URL_PARAM_KEYS.OFFSET_IDX]: 0 }),
  );
  useHotkeys('m', () =>
    setQueryParamObject({
      [URL_PARAM_KEYS.VIEW_MODE]: MODES.MONTH,
      [URL_PARAM_KEYS.OFFSET_IDX]: 0,
    }),
  );

  const onIncrement = (value) =>
    replaceQueryParamValue(URL_PARAM_KEYS.OFFSET_IDX, selectedIndexDifference + value);

  useHotkeys('right', () => onIncrement(1));
  useHotkeys('left', () => onIncrement(-1));

  return (
    <>
      <TagManager open={tagModalOpen} onClose={() => setTagModalOpen(false)} />
      <div className="navbar">
        <div className="flex outer">
          <div className="flex" style={{ marginRight: 'auto' }}>
            <Input
              placeholder="quick add task to today ..."
              style={{ marginRight: '1em', width: '30em' }}
              value={quickAddText}
              onChange={(e, { value }) => setQuickAddText(value)}
              ref={inputRef}
              loading={isLoading}
              onKeyPress={async ({ key }) => {
                if (key === KEYBOARD_CODES.ENTER && quickAddText && !isLoading) {
                  await handleCreateTask();
                  setQuickAddText('');
                }
              }}
              label={
                <Dropdown
                  value={selectedTagId}
                  onChange={(e, { value }) => setSelectedTagId(value)}
                  clearable
                  selection
                  style={{ minWidth: '10em', maxWidth: '10em' }}
                  placeholder="tag"
                  options={tags.map((r) => ({
                    text: r.title,
                    value: r.id,
                  }))}
                  search
                />
              }
              labelPosition="left"
            />
          </div>
          <div className="flex" style={{ margin: 'auto 1em auto auto' }}>
            <Button
              icon="tag"
              circular
              style={{ fontSize: '0.9em' }}
              onClick={() => setTagModalOpen(true)}
            />
          </div>
          <Dropdown
            value={selectedMode}
            search
            selection
            style={{ margin: 'auto 1em auto 0', fontSize: '0.9em' }}
            options={MODE_OPTIONS.map((m) => ({ text: _.startCase(m), value: m }))}
            onChange={(e, { value }) => onChangeMode(value)}
          />
          <div className="flex text-white" style={{ margin: 'auto 0 auto 0' }}>
            <DateSelector
              effectiveCurrentDatetime={effectiveCurrentDatetime}
              replaceQueryParamValue={replaceQueryParamValue}
              setQueryParamObject={setQueryParamObject}
            />
            <div className="flex" style={{ margin: 'auto 0 auto 0' }}>
              <Button
                icon="arrow left"
                style={{ fontSize: '0.9em' }}
                circular
                onClick={() => onIncrement(-1)}
              />
              <Button
                icon="arrow right"
                style={{ fontSize: '0.9em' }}
                circular
                onClick={() => onIncrement(1)}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WithQueryStrings(NavBar);
