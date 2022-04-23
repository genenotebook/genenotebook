/* eslint-disable react/prop-types */
import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';

import React from 'react';
// import ReactResizeDetector from 'react-resize-detector';
// import { cluster, hierarchy } from 'd3';

import { parseNewick } from '/imports/api/util/util.js';
import { orthogroupCollection } from '/imports/api/genes/orthogroup_collection.js';

import { Tree } from 'react-bio-viz';

import {
  branch,
  compose,
  isLoading,
  Loading,
} from '/imports/ui/util/uiUtil.jsx';

import OrthogroupTipNode from './OrthogroupTipNode.jsx';

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
  const { orthogroupId } = gene;
  const orthoSub = Meteor.subscribe('orthogroups', orthogroupId);
  const loading = !orthoSub.ready();
  const orthogroup = orthogroupCollection.findOne({ ID: orthogroupId });
  return {
    loading,
    gene,
    orthogroup,
    ...props,
  };
}
/*
function TreeBranch({ node, chronogram = true }) {
  const offset = chronogram ? 0 : 20;
  const multiplier = chronogram ? 1 : -10;
  const value = chronogram ? 'y' : 'value';
  const style = { fill: 'none', stroke: 'black', strokeWidth: 1 };
  const d = `M${offset + (node.parent[value] * multiplier)},${node.parent.x}
      L${offset + (node.parent[value] * multiplier)},${node.x}
      L${offset + (node[value] * multiplier)},${node.x}`;
  return <path d={d} style={style} />;
}

function InternalNode({ node }) {
  const { data = { name: '' }, x, y } = node;
  const nodeLabel = data.name;
  return (
    <text x={y + 3} y={x + 3} fontSize="10">
      {nodeLabel}
    </text>
  );
}

function TreeNode({ node }) {
  return typeof node.children === 'undefined'
    ? <OrthogroupTipNode node={node} />
    : <InternalNode node={node} />;
}

function Tree({
  tree, size,
}) {
  return (
    <div className="card tree">
      <ReactResizeDetector handleWidth>
        {
          ({ width = 200 }) => {
            const margin = {
              top: 10,
              bottom: 10,
              left: 20,
              right: 310,
            };
            const height = size * 12;
            const treeMap = cluster()
              .size([
                height - margin.top - margin.bottom,
                width - margin.left - margin.right,
              ])
              .separation(() => 1);

            const treeRoot = hierarchy(tree, (node) => node.branchset);

            const treeData = treeMap(treeRoot).sum((node) => node.branchLength);

            const nodes = treeData.descendants().filter((node) => node.parent);

            return (
              <svg width={width} height={height}>
                <g transform={`translate(${margin.left},${margin.top})`}>
                  {
                    nodes.map((node) => (
                      <React.Fragment key={`${node.x}_${node.y}`}>
                        <TreeBranch node={node} />
                        <TreeNode node={node} />
                      </React.Fragment>
                    ))
                  }
                </g>
              </svg>
            );
          }
        }
      </ReactResizeDetector>
    </div>
  );
}
*/

function Header() {
  return (
    <>
      <hr />
      <h4 className="subtitle is-4">Orthogroup</h4>
    </>
  );
}

function Orthogroup({ orthogroup, showHeader = false }) {
  const { tree, size } = parseNewick(orthogroup.tree);
  return (
    <div id="orthogroup">
      {showHeader && <Header />}
      <Tree
        tree={tree}
        height={size * 15}
        cladogram
        shadeBranchBySupport={false}
      />
    </div>
  );
}

export default compose(
  withTracker(orthogroupDataTracker),
  branch(isLoading, Loading),
  branch(hasNoOrthogroup, NoOrthogroup)
)(Orthogroup);
