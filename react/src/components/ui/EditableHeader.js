import classNames from 'classnames';
import React, { createRef, useEffect, useState } from 'react';
import { Header, Input } from 'semantic-ui-react';

import { KEYBOARD_CODES } from '../../util/constants.js';

import './EditableHeader.scss';

const EditableHeader = ({
  submitChanges,
  text,
  containerProps,
  disabled,
  showDisabledCursor,
  inverted,
  allowEmpty,
  setExternalRef,
  onAfterSubmitChange,
  externallySetEdit,
  small,
  inputProps = {},
  startInEditMode = false,
  ...headerProps
}) => {
  const [isEdit, setEdit] = useState(startInEditMode);
  const [localValue, setLocalValue] = useState(text);

  useEffect(() => {
    setLocalValue(text);
  }, [text]);

  const inputRef = createRef();

  useEffect(() => {
    if (isEdit || externallySetEdit) {
      const { current } = inputRef;
      current.focus();
    }
  }, [isEdit, inputRef, externallySetEdit]);

  const handleSubmit = () => {
    if (localValue !== text) {
      submitChanges(localValue);
    }
    setEdit(false);
    if (onAfterSubmitChange) onAfterSubmitChange();
  };

  const innerInputStyle = inverted
    ? {
        color: 'white',
        backgroundColor: 'black',
        border: '1px solid lightgray',
        fontSize: '14.58px',
        fontStyle: 'normal',
        fontWeight: 700,
        paddingLeft: '0.5em',
      }
    : {};

  if (small) {
    innerInputStyle.fontWeight = 100;
    innerInputStyle.fontSize = '12px';
    innerInputStyle.height = '2.75em';
  }

  return (
    <div className={classNames('flex editable-header-container', {})} {...containerProps}>
      {isEdit || externallySetEdit ? (
        <Input
          inverted
          onKeyPress={(e) => {
            if (e.key === KEYBOARD_CODES.ENTER) {
              handleSubmit();
            }
          }}
          ref={inputRef}
          style={{ flex: 1 }}
          onChange={(e, { value }) => setLocalValue(value)}
          onBlur={handleSubmit}
          value={localValue}
          {...inputProps}
        >
          <input
            className={classNames('editable-header-container input-inner', {})}
            style={innerInputStyle}
          />
        </Input>
      ) : (
        <span
          className={classNames('editable-header flex', {
            disabled: disabled && showDisabledCursor,
            inverted,
          })}
          tabIndex={0}
          role="button"
          onFocus={() => {
            if (!disabled) {
              setEdit(true);
            }
          }}
          onClick={() => {
            if (!disabled) {
              setEdit(true);
            }
          }}
        >
          <Header
            style={{ margin: 'auto auto auto 0.5em', color: inverted ? 'white' : '' }}
            {...headerProps}
          >
            {text}
          </Header>
        </span>
      )}
    </div>
  );
};

export default EditableHeader;
