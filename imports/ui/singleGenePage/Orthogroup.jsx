import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';

import React from 'react';
import { compose } from 'recompose';
import ContainerDimensions from 'react-container-dimensions';
import { cluster, tree, hierarchy } from 'd3';

import { parseNewick } from '/imports/api/util/util.js';
import { orthogroupCollection } from '/imports/api/genes/orthogroup_collection.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import OrthogroupTipNode from './OrthogroupTipNode.jsx';

const hasNoOrthogroup = ({ orthogroup }) => {
  return typeof orthogroup === 'undefined'
}

const NoOrthogroup = () => {
  return <div className="card orthogroup px-1 pt-1 mb-0">
    <div className="alert alert-dark mx-1 mt-1" role="alert">
      <p className="text-center text-muted mb-0">No Orthogroup found</p>
    </div>
  </div>
}

const orthogroupDataTracker = ({ gene }) => {
  const { orthogroupId } = gene;
  const orthoSub = Meteor.subscribe('orthogroups', orthogroupId);
  const loading = !orthoSub.ready();
  const orthogroup = orthogroupCollection.findOne({ ID: orthogroupId });
  return {
    loading,
    gene,
    orthogroup
  }
}

const withConditionalRendering = compose(
  withTracker(orthogroupDataTracker),
  withEither(isLoading, Loading),
  withEither(hasNoOrthogroup, NoOrthogroup)
)

const TreeBranches = ({ nodes, chronogram = true }) => {
  const offset = chronogram ? 0 : 50;
  const multiplier = chronogram ? 1 : 2;
  const value = chronogram ? 'y' : 'value';
  const style = {fill: 'none', stroke: 'black', strokeWidth: 1};
  return nodes.map(node => {
    const d = `
      M${offset + (node.parent[value] * multiplier)},${node.parent.x} 
      L${offset + (node.parent[value] * multiplier)},${node.x} 
      L${offset + (node[value] * multiplier)},${node.x}`;
    return <path key={d} d={d} style={style}/>
  })
}

const TreeBranch = ({ node, chronogram = true}) => {
  const offset = chronogram ? 0 : 50;
  const multiplier = chronogram ? 1 : 2;
  const value = chronogram ? 'y' : 'value';
  const style = {fill: 'none', stroke: 'black', strokeWidth: 1};
  const d = `M${offset + (node.parent[value] * multiplier)},${node.parent.x} 
      L${offset + (node.parent[value] * multiplier)},${node.x} 
      L${offset + (node[value] * multiplier)},${node.x}`;
  return <path {...{ d, style }} />
}

const InternalNode = ({ data = { name: ''}, x, y }) => {
  const nodeLabel = data.name;
  return <text x={y + 3} y={x + 3} fontSize='10'>
    { nodeLabel }
  </text>
}

const TreeNode = ({ node }) => {
  return typeof node.children === 'undefined' ? 
    <OrthogroupTipNode {...node} /> :
    <InternalNode {...node} />
}

const Tree = ({ tree, size, geneIds }) => {
  return (
    <div className='card tree'>
      <ContainerDimensions>
        {
          ({ width }) => {
            const margin = {
              top: 10,
              bottom: 10,
              left: 20,
              right: 310
            };
            const height = size * 12;
            const treeMap = cluster()
              .size([height - margin.top - margin.bottom, width - margin.left - margin.right])
              .separation(_ => 1)
            const treeRoot = hierarchy(tree, node => node.branchset);

            const treeData = treeMap(treeRoot).sum(node => node.branchLength);
            const nodes = treeData.descendants().filter(node => node.parent);
            

            return (
              <svg width={width} height={height}>
                <g transform={`translate(${margin.left},${margin.top})`}>
                  {
                    nodes.map(node => {
                      return <React.Fragment key={`${node.x}_${node.y}`}>
                        <TreeBranch node={node} />
                        <TreeNode node={node} />
                      </React.Fragment>
                    })
                  }
                </g>
              </svg>
            )
          }
        }
      </ContainerDimensions>
    </div>
  )
}

const Orthogroup = ({ orthogroup }) => {
  const { size, tree, geneIds } = parseNewick(orthogroup.tree);
  orthogroup.tree = tree;
  return <div id="orthogroup">
      <Tree {...orthogroup} />
  </div>
}

export default withConditionalRendering(Orthogroup);