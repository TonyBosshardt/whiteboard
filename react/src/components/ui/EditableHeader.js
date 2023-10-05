import classNames from 'classnames';
import React, { createRef, useEffect, useState } from 'react';
import { Header, Input } from 'semantic-ui-react';

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
        border: ' 1px solid lightgray',
        fontSize: '14.58px',
        fontStyle: 'normal',
        fontWeight: 700,
        paddingLeft: '0.5em',
      }
    : {};

  return (
    <div className={classNames('flex editable-header-container', {})} {...containerProps}>
      {isEdit || externallySetEdit ? (
        <Input
          inverted
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSubmit();
            }
          }}
          ref={inputRef}
          style={{ flex: 1 }}
          onChange={(e, { value }) => setLocalValue(value)}
          onBlur={handleSubmit}
          value={localValue}
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
