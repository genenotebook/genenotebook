
import { Template } from 'meteor/templating';

import './expression.html';

import ExpressionPlot from './ExpressionPlot.jsx';

Template.expression.helpers({
    ExpressionPlot(){
        return ExpressionPlot
    }
})




