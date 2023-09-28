import React from 'react';
import { Dropdown } from 'semantic-ui-react';

const EditableDropdown = () => {
  return (
    <Dropdown
      style={{
        backgroundColor: 'transparent',
        color: 'white',
        paddingLeft: '0.5em',
      }}
      search
      selection
      options={tags.map((t) => ({ text: t.title, value: t.id }))}
      value={tag?.id}
      loading={isLoading}
      onChange={(e, { value }) =>
        handleUpdateTask({
          tagId: value,
        })
      }
    />
  );
};
