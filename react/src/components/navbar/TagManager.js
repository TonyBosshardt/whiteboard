import { useMutation, useQuery } from '@apollo/client';
import React, { useState } from 'react';
import { Label, Modal, Popup } from 'semantic-ui-react';

import { STANDARD_COLOR_LIST } from '../../util/constants.js';
import { TAG_UPDATE } from '../calendar/mutations.js';
import { GET_TAGS } from '../calendar/queries.js';
import EditableHeader from '../ui/EditableHeader.js';
import ResizableInput from '../ui/ResizableInput.js';

const ColorSelector = ({ displayColor, handleUpdateTag }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popup
      trigger={
        <Label
          circular
          style={{
            backgroundColor: displayColor,
            cursor: 'pointer',
            margin: 'auto 1em auto 0',
          }}
        />
      }
      on="click"
      onClose={() => setIsOpen(false)}
      open={isOpen}
      style={{ minWidth: '27em' }}
      content={
        <div className="flex">
          {STANDARD_COLOR_LIST.map((c) => (
            <Label
              key={c}
              circular
              style={{ backgroundColor: c, cursor: 'pointer' }}
              onClick={async () => {
                await handleUpdateTag(id, {
                  displayColor: c,
                });
                setIsOpen(false);
              }}
            />
          ))}
        </div>
      }
    />
  );
};

const TagManager = ({ open, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);

  const { data: tagData } = useQuery(GET_TAGS);
  const [onUpdateTag] = useMutation(TAG_UPDATE);

  const tags = tagData?.tags || [];

  const handleUpdateTag = async (id, input, mutationProps = {}) => {
    setIsLoading(true);

    await onUpdateTag({
      variables: {
        id,
        input,
      },
      ...mutationProps,
    });

    setIsLoading(false);
  };

  return (
    <Modal open={open} onClose={onClose} size="small" style={{ border: '1px solid lightgray' }}>
      <Modal.Header
        className="flex text-white"
        style={{ backgroundColor: 'rgb(42 42 42)', borderBottom: '1px solid' }}
      >
        Tags
      </Modal.Header>
      <Modal.Content style={{ backgroundColor: 'rgb(42 42 42)' }}>
        {tags.map((tag) => {
          const { id, title, displayColor } = tag;

          return (
            <div key={id} className="flex tag-manager-item-outer" style={{ padding: '0.5em' }}>
              <Popup
                trigger={
                  <Label
                    circular
                    style={{
                      backgroundColor: displayColor,
                      cursor: 'pointer',
                      margin: 'auto 1em auto 0',
                    }}
                  />
                }
                on="click"
                style={{ minWidth: '27em' }}
                content={
                  <div className="flex">
                    {STANDARD_COLOR_LIST.map((c) => (
                      <Label
                        key={c}
                        circular
                        style={{ backgroundColor: c, cursor: 'pointer' }}
                        onClick={() =>
                          handleUpdateTag(id, {
                            displayColor: c,
                          })
                        }
                      />
                    ))}
                  </div>
                }
              />
              <EditableHeader
                inverted
                text={title}
                small
                externallySetEdit={id === '2'}
                submitChanges={(nameEdit) => {
                  if (nameEdit) {
                    handleUpdateTag(id, {
                      title: nameEdit,
                    });
                  }
                }}
                disabled={isLoading}
                containerProps={{
                  style: {
                    fontSize: '0.75em',
                    height: '3em',
                    margin: 'auto auto auto 0',
                  },
                }}
              />
              <ResizableInput value={`${title}${title}${title}${title}${title}`} />
            </div>
          );
        })}
      </Modal.Content>
    </Modal>
  );
};

export default TagManager;
