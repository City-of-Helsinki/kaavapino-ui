import React from 'react';
import { components } from 'react-select';

const CustomDropdownIndicator = (props) => {
  const menuIsOpen = props.selectProps.menuIsOpen;
  return (
    <components.DropdownIndicator {...props}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        style={{
          display: 'block',
          transform: menuIsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'none',
        }}
      >
        <path d="M0 0h24v24H0z" />
        <path fill="currentColor" d="M12 13.5l5-5 1.5 1.5-6.5 6.5L5.5 10 7 8.5z"></path>
      </svg>
    </components.DropdownIndicator>
  );
};

export default CustomDropdownIndicator;