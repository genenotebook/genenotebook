import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { compose } from 'recompose';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';
import UserGroupInfo from './UserGroupInfo.jsx';

const adminUserGroupsDataTracker = () => {
  const userGroupSub = Meteor.subscribe('roles');
  const loading = userGroupSub.ready();
  const userGroups = Meteor.roles.find({}).fetch();
  return {
    userGroups
  }
}

const withConditionalRendering = compose(
  withTracker(adminUserGroupsDataTracker),
  withEither(isLoading, Loading)
)

const AdminUserGroups = ({ userGroups }) => {
  return <div className='mt-2'>
    <table className="table table-hover table-sm">
      <thead>
        <tr>
          {
            ['User group','Group size','Members','Actions'].map(label => {
              return <th key={label} id={label}>
                <button className='btn btn-sm btn-outline-dark px-2 py-0' disabled>
                  {label}
                </button>
              </th>
            })
          }
        </tr>
      </thead>
      <tbody>
      {
        userGroups.map(userGroup => {
          return <UserGroupInfo groupName={userGroup.name} />
        })
      }
      </tbody>
    </table>
  </div>
}

export default withConditionalRendering(AdminUserGroups)