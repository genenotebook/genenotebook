import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import Select from 'react-select';

import {
  branch, compose, isLoading, Loading,
} from './uiUtil.jsx';
import { ROLES } from '/imports/api/users/users.js';

import './permissionSelect.scss';

class SelectionOption extends Object {
  constructor(optionName) {
    super();
    this.value = optionName;
    this.label = optionName;
  }
}

const customStyles = {
  control: (base, state) => ({
    ...base,
    height: 32,
    minHeight: 32,
    fontSize: '.8rem',
    backGroundColor: state.isDisabled ? 'hsl(0,0%,90%)' : 'hsl(0,0%,100%)',
  }),
};

const permissionSelectDataTracker = (props) => {
  const roleSub = Meteor.subscribe('roles');
  const loading = !roleSub.ready();
  const options = Meteor.roles.find({}).fetch();
  return {
    loading,
    options,
    ...props,
  };
};


function _PermissionSelect({
  value, options, onChange, disabled, ...props
}) {
  console.log({ value, options });
  return (
    <Select
      name="permission-select"
      className=""
      value={new SelectionOption(value)}
      options={ROLES.map((role) => new SelectionOption(role))}
      onChange={onChange}
      isDisabled={disabled}
      styles={customStyles}
    />
  );
}

function PermissionSelect({
  value, options, onChange, disabled, ...props
}) {
  console.log({ value, options });
  return (
    <ul className="permission-select steps is-small" disabled={disabled}>
      {options.map((option) => (
        <li
          key={option._id}
          className={`steps-segment ${option._id === value ? 'is-active' : ''}`}
        >
          <span className="steps-marker" />
          <div className="steps-content">
            <small>{option._id}</small>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default compose(
  withTracker(permissionSelectDataTracker),
  branch(isLoading, Loading),
)(PermissionSelect);
