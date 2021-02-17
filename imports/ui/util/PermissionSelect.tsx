import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import Select from 'react-select';

import {
  branch, compose, isLoading, Loading,
} from './uiUtil.jsx';
import { ROLES } from '/imports/api/users/users.js';

class SelectionOption {
  value: string;

  label: string;

  constructor(optionName: string) {
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

function permissionSelectDataTracker(props) {
  const roleSub = Meteor.subscribe('roles');
  const loading = !roleSub.ready();
  const options = Meteor.roles.find({}).fetch();
  return {
    loading,
    options,
    ...props,
  };
}

interface PermissionSelectOptions {
  value: string,
  onChange: any,
  disabled: boolean
}
function PermissionSelect({
  value, onChange, disabled,
}: PermissionSelectOptions) {
  return (
    <Select
      value={new SelectionOption(value)}
      options={ROLES.map((role) => new SelectionOption(role))}
      onChange={onChange}
      isDisabled={disabled}
      styles={customStyles}
    />
  );
}
export default compose(
  withTracker(permissionSelectDataTracker),
  branch(isLoading, Loading),
)(PermissionSelect);
