import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import Select from 'react-select';
import { compose } from 'recompose';

import { withEither, isLoading, Loading } from './uiUtil.jsx';

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
  return (
    <Select 
      name='genome-permission-select'
      value={permissions}
      options={roles.map(role => { return {value: role.name, label: role.name} })}
      onChange={updatePermissions}
      multi={true}
      disabled={disabled}
      />
  )
}

export default withConditionalRendering(PermissionSelect);
