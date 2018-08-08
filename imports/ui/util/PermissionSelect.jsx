import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import Select from 'react-select';
import { compose } from 'recompose';

import { withEither, isLoading, Loading } from './uiUtil.jsx';

class SelectionOption extends Object {
  constructor(optionName){
    super();
    this.value = optionName;
    this.label = optionName;
  }
}

const permissionSelectDataTracker = props => {
  const roleSub = Meteor.subscribe('roles');
  const loading = !roleSub.ready();
  const roles = Meteor.roles.find({}).fetch();
  return {
    loading,
    roles,
    ...props
  }
}

const withConditionalRendering = compose(
  withTracker(permissionSelectDataTracker),
  withEither(isLoading, Loading)
)

const PermissionSelect = ({ roles, permissions, updatePermissions, disabled, ...props }) => {
  return <Select 
      name='genome-permission-select'
      value={permissions.map(permission => new SelectionOption(permission))}
      options={roles.map(({ name }) => new SelectionOption(name))}
      onChange={updatePermissions}
      isMulti={true}
      disabled={disabled} />
}

export default withConditionalRendering(PermissionSelect);
