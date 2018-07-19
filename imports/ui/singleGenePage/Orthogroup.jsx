import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';

import React from 'react';
import ContainerDimensions from 'react-container-dimensions';
import { cluster, tree, hierarchy } from 'd3';

import { Orthogroups } from '/imports/api/genes/orthogroup_collection.js';

import GeneLink from './GeneLink.jsx';

const Loading = props => {
  return (
    <div className='card tree'>
    </div>
  )
}

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

const Tree = ({orthogroup}) => {
  return (
    <div className='card tree'>
      <ContainerDimensions>
        {
          ({width, height}) =>{
            const svgHeight = orthogroup.size * 20;
            const treeMap = cluster()
              .size([svgHeight, width - 300])
              .separation((node1,node2) => { return 1})
            const treeRoot = hierarchy(orthogroup.tree, node => node.branchset);

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

class Orthogroup extends React.Component {
  constructor(props){
    super(props)
  }
  render(){
    return (
      <div id="orthogroup">
        <hr />
        <h3>Orthogroup</h3>
        {
          this.props.loading ?
          <Loading /> :
          <Tree orthogroup={this.props.orthogroup}/>
        }
      </div>
    )
  }
}

export default withTracker(props => {
  const orthoSub = Meteor.subscribe('orthogroups', props.gene.orthogroup);
  const orthogroup = Orthogroups.findOne({ID: props.gene.orthogroup});
  return {
    loading: !orthoSub.ready(),
    gene: props.gene,
    orthogroup: orthogroup
  }
})(Orthogroup);