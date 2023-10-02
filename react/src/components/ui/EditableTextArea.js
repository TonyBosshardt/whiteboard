import classNames from 'classnames';
import React, { createRef, useEffect, useState } from 'react';
import { TextArea } from 'semantic-ui-react';

import './EditableTextArea.scss';

const EditableTextArea = ({
  submitChanges,
  text,
  externallySetEdit,
  setExternalEdit,
  containerProps,
  disabled,
  showDisabledCursor,
  inverted,
  ...textAreaProps
}) => {
  const [isEdit, setEdit] = useState(false);
  const [localValue, setLocalValue] = useState(text);

  useEffect(() => {
    setLocalValue(text);
  }, [text]);

  const textAreaRef = createRef();

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
            if (e.key === 'Enter' && !e.shiftKey) {
              handleSubmit();

              e.target.blur();

              if (setExternalEdit) setExternalEdit(false);
            }
          }}
          ref={textAreaRef}
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
          onClick={() => {
            if (!disabled) {
              setEdit(true);
            }
          }}
          disabled={disabled}
          value={text || ''}
          {...textAreaProps}
        />
      )}
    </div>
  );
};

// EditableTextArea.propTypes = {
//   submitChanges: PropTypes.func.isRequired,
//   text: PropTypes.string,
//   disabled: PropTypes.bool,
//   setExternalEdit: PropTypes.func,
//   showDisabledCursor: PropTypes.bool,
//   externallySetEdit: PropTypes.bool,
//   containerProps: PropTypes.object,
// };

// EditableTextArea.defaultProps = {
//   disabled: false,
//   setExternalEdit: null,
//   showDisabledCursor: true,
//   externallySetEdit: false,
//   containerProps: {},
//   text: '',
// };

export default EditableTextArea;
