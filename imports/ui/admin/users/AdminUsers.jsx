import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import React from 'react';
import { Link } from 'react-router-dom';
import { compose } from 'recompose';

import {
  withEither, isLoading, Loading, formatDate,
} from '/imports/ui/util/uiUtil.jsx';
import PermissionSelect from '/imports/ui/util/PermissionSelect.jsx';


function adminUsersDataTracker() {
  const userSub = Meteor.subscribe('users');
  const loading = !userSub.ready();
  const users = Meteor.users.find({}).fetch();
  return {
    loading,
    users,
  };
}

const withConditionalRendering = compose(
  withTracker(adminUsersDataTracker),
  withEither(isLoading, Loading),
);

function AdminUserInfo ({
  _id, username, emails, profile, createdAt, roles, ...user
}) {
  const { first_name, last_name } = profile;
  return (
    <tr>
      <td>
        <Link to={`/admin/user/${_id}`}>
          { username }
        </Link>
      </td>
      <td>
        { `${first_name} ${last_name}` }
      </td>
      <td>{ emails[0].address }</td>
      <td>{ formatDate(createdAt) }</td>
      <td>
        <PermissionSelect value={roles} disabled />
      </td>
    </tr>
  );
}

function AdminUsers({ users }) {
  return (
    <div className="mt-2">
      <table className="table table-hover table-sm">
        <thead>
          <tr>
            {
              ['Username', 'Full name', 'E-mail', 'Created at', 'User groups'].map((label) => (
                <th key={label} id={label}>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-dark px-2 py-0"
                    disabled
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
            users.map((user) => <AdminUserInfo key={user._id} {...user} />)
          }
        </tbody>
      </table>
    </div>
  );
}

export default withConditionalRendering(AdminUsers);
