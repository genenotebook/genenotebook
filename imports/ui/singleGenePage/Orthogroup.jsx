import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';

import React from 'react';
import { compose } from 'recompose';
import ContainerDimensions from 'react-container-dimensions';
import { cluster, tree, hierarchy } from 'd3';

import { parseNewick } from '/imports/api/util/util.js';
import { orthogroupCollection } from '/imports/api/genes/orthogroup_collection.js';

import { withEither, isLoading, Loading } from '/imports/ui/util/uiUtil.jsx';

import GeneLink from './GeneLink.jsx';

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

const TreeBranches = ({nodes}) => {
  return nodes.map(node => {
    const d = `
      M${node.parent.y},${node.parent.x} 
      L${node.parent.y},${node.x} 
      L${node.y},${node.x}`;
    return <path key={d} d={d} style={{fill: 'none', stroke: 'black', strokeWidth: 1}}/>
  })
}

const TreeNodes = ({nodes}) => {
  const tipNodes = nodes.filter(node => node.data.name.length > 0);
  return tipNodes.map(node => {
    const transcriptId = node.data.name
    const geneId = transcriptId.split('.').slice(0,-1).join('.');
    return (
      <g key={transcriptId}>
        <circle cy={node.x} cx={node.y} r='3' />
        <foreignObject width='300' height='10' x={node.y + 10} y={node.x - 15}>
          <GeneLink transcriptId={transcriptId} geneId={geneId} />
        </foreignObject>
      </g>
    )
  })
}

const Tree = ({ tree, size, geneIds }) => {
  console.log(tree)
  return (
    <div className='card tree'>
      <ContainerDimensions>
        {
          ({width, height}) =>{
            const svgHeight = size * 20;
            const treeMap = cluster()
              .size([svgHeight, width - 300])
              .separation((node1,node2) => { return 1})
            const treeRoot = hierarchy(tree, node => node.branchset);

            const treeData = treeMap(treeRoot).sum(node => node.branchLength);
            const nodes = treeData.descendants().filter(node => node.parent);
            

            return (
              <svg width={width - 10} height={svgHeight}>
                <g transform={`translate(10,0)`}>
                  <TreeBranches nodes={nodes} />
                  <TreeNodes nodes={nodes} />
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