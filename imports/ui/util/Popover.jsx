/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePopper } from 'react-popper';

export function PopoverTrigger({
  children, togglePopover, setReferenceElement,
}) {
  const child = React.Children.only(children);
  return React.cloneElement(child, {
    onClick: togglePopover, ref: setReferenceElement,
  });
}

export function PopoverBody({
  children, showPopover, container,
  setPopperElement, styles, attributes,
  togglePopover, header,
}) {
  if (!showPopover) {
    return null;
  }
  const popoverBody = (
    <div
      id="popover"
      ref={setPopperElement}
      style={{
        backgroundColor: 'white',
        maxWidth: '400px',
        ...styles.popper,
      }}
      {...attributes.popper}
    >
      <nav className="panel is-info">
        <p className="panel-heading">
          {header}
          <button type="button" className="delete" onClick={togglePopover} />
        </p>
        {children}
      </nav>
    </div>
  );
  return createPortal(popoverBody, container);
}

export function Popover({ children }) {
  const [showPopover, setShowPopover] = useState(false);
  function togglePopover() {
    setShowPopover(!showPopover);
  }

  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement);

  const container = document.querySelector('body');

  const childProps = {
    togglePopover,
    showPopover,
    container,
    setReferenceElement,
    setPopperElement,
    styles,
    attributes,
  };

  return React.Children
    .map(children, (child) => React.cloneElement(child, childProps));
}
