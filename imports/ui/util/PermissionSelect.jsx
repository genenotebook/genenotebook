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

const customStyles = {
  control: (base, state) => ({
    ...base,
    fontSize: '.8rem',
    backGroundColor: state.isDisabled ? 'hsl(0,0%,80%)' : 'hsl(0,0%,100%)',
    paddingTop: 0,
    paddingBottom: 0
  })
}

const permissionSelectDataTracker = props => {
  const roleSub = Meteor.subscribe('roles');
  const loading = !roleSub.ready();
  const options = Meteor.roles.find({}).fetch();
  return {
    loading,
    options,
    ...props
  }
}

const withConditionalRendering = compose(
  withTracker(permissionSelectDataTracker),
  withEither(isLoading, Loading)
)

const PermissionSelect = ({ value, options, onChange, disabled, ...props }) => {
  return <Select name='permission-select' className=''
      value={value.map(permission => new SelectionOption(permission))}
      options={options.map(({ name }) => new SelectionOption(name))}
      onChange={onChange} isMulti={true} isDisabled={disabled}
      styles={customStyles} closeMenuOnSelect={false} />
}

export default withConditionalRendering(PermissionSelect);
