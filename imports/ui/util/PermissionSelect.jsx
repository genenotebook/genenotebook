import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import Select from 'react-select';
import { compose } from 'recompose';

import { withEither, isLoading, Loading } from './uiUtil.jsx';
import { ROLES } from '/imports/api/users/users.js';

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

const withConditionalRendering = compose(
  withTracker(permissionSelectDataTracker),
  withEither(isLoading, Loading),
);

function PermissionSelect({
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

export default withConditionalRendering(PermissionSelect);
