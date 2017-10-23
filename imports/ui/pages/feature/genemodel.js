import { Template } from 'meteor/templating';

import GenemodelContainer from './Genemodel.jsx';

import './genemodel.html'

Template.genemodel_container.helpers({
  GenemodelContainer(){
    return GenemodelContainer
  }
})