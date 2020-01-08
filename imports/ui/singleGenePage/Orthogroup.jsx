import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';

import React from 'react';
import { compose } from 'recompose';
import ContainerDimensions from 'react-container-dimensions';
import { cluster, hierarchy } from 'd3';

import { parseNewick } from '/imports/api/util/util.js';
import { orthogroupCollection } from '/imports/api/genes/orthogroup_collection.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import OrthogroupTipNode from './OrthogroupTipNode.jsx';

function hasNoOrthogroup({ orthogroup }) {
  return typeof orthogroup === 'undefined';
}

function NoOrthogroup() {
  return (
    <div className="card orthogroup px-1 pt-1 mb-0">
      <div className="alert alert-dark mx-1 mt-1" role="alert">
        <p className="text-center text-muted mb-0">No Orthogroup found</p>
      </div>
    </div>
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

const withConditionalRendering = compose(
  withTracker(orthogroupDataTracker),
  withEither(isLoading, Loading),
  withEither(hasNoOrthogroup, NoOrthogroup),
);

function TreeBranch({ node, chronogram }) {
  const offset = chronogram ? 0 : 20;
  const multiplier = chronogram ? 1 : -10;
  const value = chronogram ? 'y' : 'value';
  const style = { fill: 'none', stroke: 'black', strokeWidth: 1 };
  const d = `M${offset + (node.parent[value] * multiplier)},${node.parent.x} 
      L${offset + (node.parent[value] * multiplier)},${node.x} 
      L${offset + (node[value] * multiplier)},${node.x}`;
  return <path {...{ d, style }} />;
}

function InternalNode({
  data = { name: '' }, x, y, chronogram,
}) {
  const nodeLabel = data.name;
  return (
    <text x={y + 3} y={x + 3} fontSize="10">
      { nodeLabel }
    </text>
  );
}

function TreeNode({ node }) {
  return typeof node.children === 'undefined'
    ? <OrthogroupTipNode {...node} />
    : <InternalNode {...node} />;
}

function Tree({
  tree, size, geneIds, chronogram = true,
}) {
  return (
    <div className="card tree">
      <ContainerDimensions>
        {
          ({ width }) => {
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
                        <TreeBranch {...{ node, chronogram }} />
                        <TreeNode {...{ node, chronogram }} />
                      </React.Fragment>
                    ))
                  }
                </g>
              </svg>
            );
          }
        }
      </ContainerDimensions>
    </div>
  );
}

function Orthogroup({ orthogroup, showHeader = false }) {
  const { tree } = parseNewick(orthogroup.tree);
  // eslint-disable-next-line no-param-reassign
  orthogroup.tree = tree;
  return (
    <div id="orthogroup">
      {
          showHeader && (
            <>
              <hr />
              <h3>Orthogroup</h3>
            </>
          )
      }
      <Tree {...orthogroup} />
    </div>
  );
}

export default withConditionalRendering(Orthogroup);
