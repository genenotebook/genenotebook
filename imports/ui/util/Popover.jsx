/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { usePopper } from 'react-popper';

export function PopoverTrigger({
  children, togglePopover, showPopover, node,
  setReferenceElement, setPopperElement, styles, attributes,
  ...props
}) {
  const child = React.Children.only(children);
  return React.cloneElement(child, {
    onClick: togglePopover, ref: setReferenceElement, ...props,
  });
}

export function PopoverBody({
  children, showPopover, node,
  setPopperElement, styles, attributes,
}) {
  if (!showPopover) {
    return null;
  }

  return createPortal(
    <div
      ref={setPopperElement}
      style={{
        backgroundColor: 'white',
        ...styles.popper,
      }}
      {...attributes.popper}
    >
      { children }
    </div>,
    node,
  );
}

export function Popover({ children }) {
  const [showPopover, setPopover] = useState(false);
  function closePopover() {
    document.removeEventListener('click', closePopover);
    setPopover(false);
  }
  function openPopover() {
    document.addEventListener('click', closePopover);
    setPopover(true);
  }
  function togglePopover() {
    if (showPopover) {
      closePopover();
    } else {
      openPopover();
    }
  }
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);
  const { styles, attributes } = usePopper(referenceElement, popperElement);

  const node = document.querySelector('body');

  return React.Children.map(children, (child) => React.cloneElement(child, {
    togglePopover, showPopover, node, setReferenceElement, setPopperElement, styles, attributes,
  }));
}
