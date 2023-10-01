import { gql, useMutation, useQuery } from '@apollo/client';
import _ from 'lodash';
import React, { useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Button, Dropdown, Input } from 'semantic-ui-react';

import DateHelpers, { SQL_DATE_TIME_FORMAT } from '../../util/DateHelpers.js';
import WithQueryStrings from '../../util/WithQueryStrings.js';
import { KEYBOARD_SHORTCUTS, URL_PARAM_KEYS } from '../../util/constants.js';
import {
  MODES,
  MODE_OPTIONS,
  resolveCurrentEffectiveDatetime,
} from '../calendar/CalendarHelpers.js';
import { GET_TASKS } from '../calendar/TaskCalendar.js';
import DateSelector from './DateSelector.js';

import './NavBar.scss';

const GET_TAGS = gql`
  query GetTags {
    tags {
      id
      title
      displayColor
    }
  }
`;

const QUICK_CREATE_TASK = gql`
  mutation TaskCreate($input: [TaskCreateInput!]!) {
    tasksCreate(input: $input) {
      id
    }
  }
`;

const NavBar = ({ getQueryParamValue, replaceQueryParamValue, setQueryParamObject }) => {
  const inputRef = useRef();

  const { data } = useQuery(GET_TAGS);
  const tags = data?.tags || [];

  const [onCreateTask] = useMutation(QUICK_CREATE_TASK, {
    refetchQueries: [{ query: GET_TASKS }],
  });

  const [selectedTagId, setSelectedTagId] = useState('');
  const [quickAddText, setQuickAddText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateTask = async () => {
    setIsLoading(true);

    await onCreateTask({
      variables: {
        input: {
          title: quickAddText,
          dueDatetime: DateHelpers.getCurrentDatetime()
            .set({ hour: 12, minute: 0 })
            .toFormat(SQL_DATE_TIME_FORMAT),
          tagId: selectedTagId || null,
          userId: '1',
        },
      },
    });

    setIsLoading(false);
  };

  const selectedMode = getQueryParamValue(URL_PARAM_KEYS.VIEW_MODE, MODES.WEEK);
  const selectedIndexDifference = getQueryParamValue(URL_PARAM_KEYS.OFFSET_IDX, 0, {
    isNumeric: true,
  });

  const effectiveCurrentDatetime = resolveCurrentEffectiveDatetime({
    selectedMode,
    selectedIndexDifference,
  });

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
            onKeyPress={async (e) => {
              if (e.key === 'Enter' && quickAddText && !isLoading) {
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
        {/* <div className="flex" style={{ margin: 'auto 1em auto 0' }}>
          <Button icon="plus" circular />
          <Button icon="filter" circular />
          <Button icon="search" circular />
        </div> */}
        <Dropdown
          value={selectedMode}
          search
          selection
          style={{ margin: 'auto 1em auto 0' }}
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
            <Button icon="arrow left" circular onClick={() => onIncrement(-1)} />
            <Button icon="arrow right" circular onClick={() => onIncrement(1)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithQueryStrings(NavBar);
