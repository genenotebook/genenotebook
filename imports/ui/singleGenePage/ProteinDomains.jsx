import React from 'react';
import { compose } from 'recompose';
import { scaleLinear } from 'd3';//-scale';
import { groupBy } from 'lodash';
import ReactResizeDetector from 'react-resize-detector';
import { Popover, PopoverHeader, PopoverBody } from 'reactstrap';
import randomColor from 'randomcolor';

import { getGeneSequences } from '/imports/api/util/util.js';

import { withEither } from '/imports/ui/util/uiUtil.jsx';

import './proteinDomains.scss';

const XAxis = ({ scale, numTicks, transform, seqid }) => {
  const range = scale.range();

  const [start, end] = scale.domain();

  const stepSize = Math.round((end - start) / numTicks);

  const ticks = [start];

  for (let i = 1; i < numTicks; i++) {
     ticks.push(start + (i * stepSize));
  }
  ticks.push(end)
  return (
    <g className = 'x-axis' transform={transform}>
      <text className='axis-label' x={range[0]} y='0' 
        dy='5' textAnchor='left' fontSize='11'>
        {seqid}
      </text>
      <line className='backbone' x1={range[0]} x2={range[1]} 
        y1='25' y2='25' stroke='black'/>
      {
        ticks.map((tick, tickIndex) => {
          const pos = scale(tick)
          let textAnchor;
          if (tickIndex === 0){
            textAnchor = 'start';
          } else if (tickIndex === ticks.length - 1){
            textAnchor = 'end';
          } else {
            textAnchor = 'middle';
          }
          return (
            <g className='tick' key={tick}>
              <line x1={pos} x2={pos} y1='20' y2='25' stroke='black' />
              <text x={pos} y='10' dy='5' textAnchor={textAnchor} 
                fontSize='10'>
                { tick }
              </text>
            </g>
          )
        })
      }
    </g>
  )
}

const DomainPopover = ({ showPopover, targetId, togglePopover, ...domain }) => {
  const { start, end, score, name, Dbxref = [], Ontology_term = [], 
    signature_desc, source } = domain;
  return <Popover placement='top' isOpen={showPopover} 
    target={targetId} toggle={togglePopover}>
    <PopoverHeader>
      {source} <small className='text-muted'>{ name }</small>
    </PopoverHeader>
    <PopoverBody className='px-0 py-0'>
      <div className="table-responive">
        <table className="table table-hover">
          <tbody>
            {
              signature_desc &&
              <tr>
                <td>Signature description</td>
                <td>{signature_desc}</td>
              </tr>
            }
            <tr>
              <td>Coordinates</td>
              <td>{start}..{end}</td>
            </tr>
            <tr>
              <td>Score</td>
              <td>{score}</td>
            </tr>
            {
              Dbxref.length > 0 && 
              <tr>
                <td>Dbxref</td>
                <td>
                  <ul>
                    {
                      Dbxref.map(xref => {
                        return <li key={xref}>
                          { xref }
                        </li>
                      })
                    }
                  </ul>
                </td>
              </tr>
            }
            {
              Ontology_term.length > 0 && 
              <tr>
                <td>Ontology term</td>
                <td>
                  <ul>
                    {
                      Ontology_term.map(term => {
                        return <li key={term}>
                          { term }
                        </li>
                      })
                    }
                  </ul>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </PopoverBody>
  </Popover>
}

class ProteinDomain extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      showPopover: false
    }
  }
  togglePopover = () => {
    this.setState({
      showPopover: !this.state.showPopover
    })
  }
  render(){
    const { interproId, start, end, name, domainIndex, scale } = this.props;
    const fill = interproId === 'Unintegrated signature' ? 
            'grey' : randomColor({seed: interproId});
    const style = { fill, fillOpacity: .5 };
    const targetId = `${name.replace(/[:\.]/g,'_')}_${start}_${end}`;
    return <React.Fragment>
      <rect className='protein-domain-interval' x={scale(start)}
            width={scale(end) - scale(start)} y='0' height='8' rx='2'
            ry='2' style={style} id={targetId} onClick={this.togglePopover}/>
      <DomainPopover {...{ targetId, ...this.props, ...this.state }} 
        togglePopover={this.togglePopover}/>
    </React.Fragment>
  }
}

const SourceGroup = ({source, domains, transform, scale}) => {
  return (
    <g transform={transform}>
      {
        domains.map((domain, domainIndex) => {
          return <ProteinDomain key={domainIndex} {...domain} scale={scale} />
        })
      }
    </g>
  )
}

const InterproGroup = ({interproId, sourceGroups, transform, scale}) => {
  const [xMin, xMax] = scale.range();
  const descriptions = new Set();
  Object.entries(sourceGroups).forEach((sourceGroup, sourceIndex) => {
    const [source, domains] = sourceGroup;
    domains.forEach(domain => {
      if (typeof domain.signature_desc !== 'undefined'){
        descriptions.add(domain.signature_desc)
      }
    })
  })
  const description = [...descriptions].sort((a,b) => b.length - a.length)[0];
  return (
    <g transform={transform}>
      <foreignObject width={xMax} height='25' x='0' y='-22'>
        <p style={{fontSize: '1rem', fontFamily: 'monospace', overflow: 'hidden', 
          whitespace: 'nowrap', height: 25, textOverflow: 'ellipsis', 
          wordBreak: 'break-all' }}>
          <a href={`https://www.ebi.ac.uk/interpro/entry/${interproId}`} 
            className="btn btn-outline-dark px-2 py-0" 
            style={{fontSize: '.7rem'}} target="_blank">
            {interproId}
          </a>
          &nbsp;{ interproId !== 'Unintegrated signature' && description}
        </p>
      </foreignObject>
      {
        Object.entries(sourceGroups).map((sourceGroup, sourceIndex) => {
          const [source, domains] = sourceGroup;
          return <SourceGroup key={source} source={source} domains={domains}
            transform={`translate(0,${sourceIndex * 10})`} index={sourceIndex} scale={scale} />
        })
      }
    </g>
  )
}

const sortGroups = (groupA, groupB) => {
  const [nameA, intervalsA] = groupA;
  const [nameB, intervalsB] = groupB;
  if (nameA === 'Unintegrated signature') {
    return 1
  }
  if (nameB === 'Unintegrated signature'){
    return -1
  }
  const startA = Math.min(...intervalsA.map(interval => interval.start));
  const startB = Math.min(...intervalsB.map(interval => interval.start));

  return startA - startB
}

const hasNoProteinDomains = ({ gene }) => {
  const transcripts = gene.subfeatures.filter(sub => sub.type === 'mRNA');
  const proteinDomains = transcripts.filter(transcript => {
    return typeof transcript.protein_domains !== 'undefined'
  });

  return proteinDomains.length === 0
}

const NoProteinDomains = ({ showHeader }) => {
  return <React.Fragment>
    {
      showHeader && <React.Fragment>
        <hr />
        <h3>Protein domains</h3>
      </React.Fragment>
    }
    <div className="card protein-domains px-1 pt-1 mb-0">
      <div className="alert alert-dark mx-1 mt-1" role="alert">
        <p className="text-center text-muted mb-0">No protein domains found</p>
      </div>
    </div>
  </React.Fragment>
}

const withConditionalRendering = compose(
  withEither(hasNoProteinDomains, NoProteinDomains)
)

class ProteinDomains extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      width: 300
    }
  }

  static defaultProps = {
    resizable: true
  }

  onResize = width => {
    this.setState({
      width
    })
  }

  render(){
    const { gene, resizable, showHeader } = this.props;
    //get sequence to determine length
    const sequences = getGeneSequences(gene);
    //interproscan results should be on transcripts
    const transcripts = gene.subfeatures.filter(sub =>  sub.type == 'mRNA');
    //pick transcript with annotated protein domains
    const transcript = transcripts.filter(transcript => {
      return typeof transcript.protein_domains !== 'undefined'
    })[0];
    const transcriptSequence = sequences.filter(seq => seq.ID === transcript.ID)[0]
    const transcriptSize = transcriptSequence.prot.length;
    
    const interproGroups = Object.entries(groupBy(transcript.protein_domains, 
      'interproId')).sort(sortGroups);
    const totalGroups = interproGroups.length;
    let totalDomains = 0;
    const sortedDomains = interproGroups.map(domainGroup => {
      const [ interproId, domains ] = domainGroup;
      const sourceGroups = Object.entries(groupBy(domains, 'name'));
      totalDomains += sourceGroups.length;
      return sourceGroups
    })

    const margin = {
      top: 10,
      bottom: 10,
      left: 20,
      right: 20
    };

    const style = {
      marginLeft: margin.left,
      marginTop: margin.top
    }

    const svgWidth = this.state.width - margin.left - margin.right;
    const svgHeight = (totalGroups * 30) + ( totalDomains * 10 ) + 
      margin.top + margin.bottom + 40;
    const scale = scaleLinear().domain([0, transcriptSize]).range([0, svgWidth])
    let domainCount = 0;
    return <React.Fragment>
      {
        showHeader && <React.Fragment>
          <hr />
          <h3>Protein domains</h3>
        </React.Fragment>
      }
      <div className="card protein-domains px-0">
        <svg width={svgWidth} height={svgHeight} style={style}>
          <XAxis scale={scale} numTicks={5} transform='translate(0,10)' 
            seqid={transcript.ID}/>
          <g className='domains' transform='translate(0,40)'>
          {
            interproGroups.map((interproGroup, index) => {
              const [interproId, domains] = interproGroup;
              const sourceGroups = groupBy(domains, 'name');
              const yTransform = ((index + 1) * 30) + (domainCount * 10);
              const transform = `translate(0,${yTransform})`;
              domainCount += Object.entries(sourceGroups).length;
              return <InterproGroup key={interproId} interproId={interproId} 
                sourceGroups={sourceGroups} transform={transform} scale={scale} />
            })
          }
          </g>
        </svg>
        { 
          resizable && <ReactResizeDetector handleWidth onResize={this.onResize} />
        }
      </div>
    </React.Fragment>
  }
}

export default withConditionalRendering(ProteinDomains)

