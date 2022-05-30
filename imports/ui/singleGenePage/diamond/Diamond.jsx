import { diamondCollection } from '/imports/api/genes/diamond/diamondCollection.js';
import { Genes } from '/imports/api/genes/geneCollection.js';
import { withTracker } from 'meteor/react-meteor-data';
import { branch, compose } from '/imports/ui/util/uiUtil.jsx';
import { Meteor } from 'meteor/meteor';
import React from 'react';

function Header() {
  return (
    <>
      <hr />
      <h4 className="subtitle is-4">Diamond</h4>
    </>
  );
}

function hasNoDiamond({ diamond }) {
  return typeof diamond === 'undefined';
}

function NoDiamond({ showHeader }) {
  return (
    <>
      {showHeader && <Header />}
      <article className="message no-orthogroup" role="alert">
        <div className="message-body">
          <p className="has-text-grey">No Diamond informations found</p>
        </div>
      </article>
    </>
  );
}

function DiamondDataTracker({ gene }) {
  const diamondId = Genes.findOne({ ID: gene.ID }).diamondId;

  const diamondSub = Meteor.subscribe('diamond');
  const loading = !diamondSub.ready();
  const diamond = diamondCollection.findOne({ _id: diamondId });

  return {
    loading,
    gene,
    diamond,
  };
}

function DiamondBlast({ showHeader = false, diamond }) {
  return (
    <>
      { showHeader && <Header />}
      <div>
        <h1>Diamond ?</h1>
      </div>
    </>
  );
}

export default compose(
  withTracker(DiamondDataTracker),
  branch(hasNoDiamond, NoDiamond),
)(DiamondBlast);
