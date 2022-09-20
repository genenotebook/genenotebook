/* eslint-disable react/prop-types */
import { orthogroupCollection } from '/imports/api/genes/orthogroup/orthogroupCollection.js';
import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import React from 'react';
import { Tree } from 'react-bio-viz';
import {
  branch,
  compose,
  isLoading,
  Loading,
} from '/imports/ui/util/uiUtil.jsx';

function hasNoOrthogroup({ orthogroup }) {
  return typeof orthogroup === 'undefined';
}

function NoOrthogroup({ showHeader }) {
  return (
    <>
      {showHeader && <Header />}
      <article className="message no-orthogroup" role="alert">
        <div className="message-body">
          <p className="has-text-grey">No orthogroup found</p>
        </div>
      </article>
    </>
  );
}

function orthogroupDataTracker({ gene, ...props }) {
  const orthogroupId = (typeof gene.orthogroups === 'undefined' ? undefined : gene.orthogroups._str);
  const orthogroupSub = Meteor.subscribe('orthogroups', orthogroupId);
  const loading = !orthogroupSub.ready();
  const orthogroup = (typeof orthogroupId === 'undefined' ? undefined : orthogroupCollection.findOne({}));

  return {
    loading,
    gene,
    orthogroup,
    ...props,
  };
}

function Header() {
  return (
    <>
      <hr />
      <h4 className="subtitle is-4">Orthogroup</h4>
    </>
  );
}

function Orthogroup({ orthogroup, showHeader = false }) {
  return (
    <div id="orthogroup">
      {showHeader && <Header />}
      <Tree
        tree={orthogroup.tree}
        height={orthogroup.size * 15}
        cladogram
        shadeBranchBySupport={false}
      />
    </div>
  );
}

export default compose(
  withTracker(orthogroupDataTracker),
  branch(isLoading, Loading),
  branch(hasNoOrthogroup, NoOrthogroup),
)(Orthogroup);
