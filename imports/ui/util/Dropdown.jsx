import React, { useState } from 'react';

export function DropdownButton({ children, ...props }) {
  return (
    <button type="button" key="dropdownButton" {...props}>
      { children }
    </button>
  );
}

export function DropdownMenu({
  children, show = '', className = '', ...props
}) {
  return (
    <div
      key="dropdownMenu"
      className={`dropdown-menu ${show} ${className}`}
      {...props}
    >
      { children }
    </div>
  );
}

export function Dropdown({ children }) {
  const [show, setShow] = useState('');
  function close() {
    setShow('');
    document.removeEventListener('click', close);
  }

  function open() {
    setShow('show');
    document.addEventListener('click', close);
  }

  function preventClose(event) {
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
  }

  function renderChildren() {
    return React.Children.map(children, (child) => {
      const onClick = child.type === DropdownButton
        ? open
        : preventClose;
      return React.cloneElement(child, { onClick, show });
    });
  }
  return (
    <div className="dropdown btn-group">
      { renderChildren() }
    </div>
  );
}
