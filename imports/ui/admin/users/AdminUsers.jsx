import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Roles } from 'meteor/alanning:roles';

import React from 'react';
import { Link } from 'react-router-dom';

import {
  branch, compose, isLoading, Loading, formatDate,
} from '/imports/ui/util/uiUtil.jsx';
import { getHighestRole } from '/imports/api/users/users.js';

function adminUsersDataTracker() {
  const userSub = Meteor.subscribe('users');
  const loading = !userSub.ready();
  const users = Meteor.users.find({}).fetch();
  return {
    loading,
    users,
  };
}

function AdminUserInfo({ user }) {
  const {
    _id, username, emails = [], profile, createdAt,
  } = user;
  const { first_name, last_name } = profile;
  const roles = Roles.getRolesForUser(_id);
  const role = getHighestRole(roles);
  return (
    <tr>
      <td>
        <Link to={`/admin/user/${_id}`}>
          {username}
        </Link>
      </td>
      <td>
        {`${first_name} ${last_name}`}
      </td>
      <td>
        <ul>
          {emails.map(({ address = '' }) => (
            <li key={address}>{address}</li>
          ))}
        </ul>
      </td>
      <td>{formatDate(createdAt)}</td>
      <td>
        {role}
      </td>
    </tr>
  );
}

function AdminUsers({ users }) {
  return (
    <table className="table is-hoverable is-narrow is-fullwidth">
      <thead>
        <tr>
          {
            ['Username', 'Full name', 'E-mail', 'Created at', 'User groups'].map((label) => (
              <th key={label} id={label}>
                <button
                  type="button"
                  className="button is-static is-fullwidth is-small"
                >
                  {label}
                </button>
              </th>
            ))
          }
        </tr>
      </thead>
      <tbody>
        {
          users.map((user) => <AdminUserInfo key={user._id} user={user} />)
        }
      </tbody>
    </table>
  );
}

export default compose(
  withTracker(adminUsersDataTracker),
  branch(isLoading, Loading),
)(AdminUsers);
