import classNames from 'classnames';
import React, { createRef, useEffect, useState } from 'react';
import { TextArea } from 'semantic-ui-react';

import { KEYBOARD_CODES } from '../../util/constants.js';

import variables from './EditableTextArea.scss';

const { maxEditingHeight, minEditingHeight } = variables;

const _effectiveHeight = (incomingScrollHeightPx) => {
  if (incomingScrollHeightPx < +minEditingHeight) {
    return +minEditingHeight;
  }

  if (incomingScrollHeightPx > +maxEditingHeight) {
    return +maxEditingHeight;
  }

  return incomingScrollHeightPx;
};

const EditableTextArea = ({
  submitChanges,
  text,
  externallySetEdit,
  setExternalEdit,
  containerProps,
  disabled,
  showDisabledCursor,
  inverted,
  autoExpandHeight,
  ...textAreaProps
}) => {
  const [isEdit, setEdit] = useState(false);
  const [localValue, setLocalValue] = useState(text);

  useEffect(() => {
    setLocalValue(text);
  }, [text]);

  const textAreaRef = createRef();

  useEffect(() => {
    if (!autoExpandHeight) return;

    /** handle case where we're editing or just viewing */
    const displayElem = document.getElementById('text-area-ref-display');
    const activeElem = document.getElementById('text-area-ref-active');

    if (displayElem) {
      displayElem.style.height = `${_effectiveHeight(displayElem.scrollHeight) + 2}px`;
    }

    if (activeElem) {
      activeElem.style.height = `${_effectiveHeight(activeElem.scrollHeight)}px`;
    }
  }, [text, localValue, autoExpandHeight]);

  useEffect(() => {
    if (isEdit || externallySetEdit) {
      const { current } = textAreaRef;
      current.focus();
    }
  }, [isEdit, textAreaRef, externallySetEdit]);

  const handleSubmit = () => {
    if (localValue !== text) {
      submitChanges(localValue);
    }
    setEdit(false);
  };

  const innerInputStyle = inverted
    ? {
        color: 'white',
        backgroundColor: 'black',
        border: ' 1px solid lightgray',
      }
    : {};

  return (
    <div className="flex" {...containerProps}>
      {isEdit || externallySetEdit ? (
        <TextArea
          className="editable-text-area-active"
          onKeyPress={(e) => {
            if (e.key === KEYBOARD_CODES.ENTER && !e.shiftKey) {
              handleSubmit();

              e.target.blur();

              if (setExternalEdit) setExternalEdit(false);
            }
          }}
          ref={textAreaRef}
          id="text-area-ref-active"
          onChange={(e, { value }) => setLocalValue(value)}
          onBlur={() => {
            handleSubmit();
            if (setExternalEdit) setExternalEdit(false);
          }}
          value={localValue || ''}
          style={innerInputStyle}
          {...textAreaProps}
        />
      ) : (
        <TextArea
          className={classNames('editable-text-area-inactive flex', {
            disabled: disabled && showDisabledCursor,
          })}
          onFocus={() => {
            if (!disabled) {
              setEdit(true);
            }
          }}
          id="text-area-ref-display"
          onClick={() => {
            if (!disabled) {
              setEdit(true);
            }
          }}
          disabled={disabled}
          value={localValue || ''}
          {...textAreaProps}
        />
      )}
    </div>
  );
};

export default EditableTextArea;
