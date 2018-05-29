import React from 'react';


const InfoLine = ({ genome, toggleEdit }) => {
  return (
    <tr>
      <td>{genome.referenceName}</td>
      <td>{genome.organism}</td>
      <td>{genome.description}</td>
      <td>{genome.permissions}</td>
      <td>
        <button 
          type='button' 
          className='btn btn-outline-dark btn-sm'
          onClick={toggleEdit}
          name={genome._id}
        >Edit</button>
      </td>
    </tr>
  )
}

export default class AdminGenomeInfo extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      isEditing: false
    }
  }

  toggleEdit = () => {
    this.setState((state, props) => {
      return {
        isEditing: !state.isEditing
      }
    })
  }

  render(){
    const { genome } = this.props;
    return (
      <InfoLine genome={genome} toggleEdit={this.toggleEdit} />
    )
  }
};
