import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose } from 'recompose';

import { withEither, isLoading } from '/imports/ui/util/uiUtil.jsx';

const groupInfoDataTracker = ({ groupName }) => {
  const userSub = Meteor.subscribe('users');
  const loading = !userSub.ready();
  const groupUsers = Meteor.users.find({ roles: groupName }).fetch();
  console.log(groupName, groupUsers)
  return {
    loading,
    groupName,
    groupUsers
  }
}

const Loading = () => {
  return <tr>
    Loading...
  </tr>
}

const withConditionalRendering = compose(
  withTracker(groupInfoDataTracker),
  withEither(isLoading, Loading)
)

const UserGroupInfo = ({ groupName, groupUsers }) => {
  return <tr>
    <td>{groupName}</td>
    <td>{groupUsers.length}</td>
    <td>{groupUsers.map(user => user.username).join(',')}</td>
    <td>
    </td>
  </tr>
}

export default withConditionalRendering(UserGroupInfo);