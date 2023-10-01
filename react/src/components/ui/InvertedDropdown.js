import React from 'react';
import { Dropdown } from 'semantic-ui-react';

import './InvertedDropdown.scss';

const InvertedDropdown = ({ ...dropdownProps }) => (
  <Dropdown
    style={{
      backgroundColor: 'transparent',
      color: 'white',
      paddingLeft: '0.5em',
    }}
    className="inverted-dropdown"
    search
    selection
    {...dropdownProps}
  />
);

export default InvertedDropdown;
