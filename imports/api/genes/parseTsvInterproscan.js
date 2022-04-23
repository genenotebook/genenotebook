import { InterproscanProcessor } from '/imports/api/genes/addInterproscan.js';
import logger from '/imports/api/util/logger.js';

class ParseTsvFile extends InterproscanProcessor {
  parse = (line) => {
    const [
      seqId,
      md5,
      length,
      analysis, // source (gff3)
      signatureAccession, // Name (gff3)
      signatureDescription, // signature_desc (gff3)
      start,
      stop, // end (gff3)
      score,
      status,
      date,
      interproAccession, // interproIds (gff3)
      interpro_description, // signature_desc (gff3)
      goAnnotation, // Ontology_term (referring to a GO association) (gff3)
      pathwaysAnnotations, // Dbxref (gff3)
    ] = line.split('\t');

    const dbUpdate = { $addToSet: {} };

    const proteinDomain = {
      start, end: stop, source: analysis, score, name: signatureAccession,
    };

    const ontologyTerm = (goAnnotation === undefined ? '' : goAnnotation.split('|'));
    const Dbxref = (pathwaysAnnotations === undefined ? '' : pathwaysAnnotations.split('|'));

    if (interproAccession.length && interproAccession !== '-') {
      const interproscanLabel = ''.concat('InterPro:', interproAccession);
      Dbxref.unshift(interproscanLabel);
      proteinDomain.interproId = interproAccession;
    } else {
      proteinDomain.interproId = 'Unintegrated signature';
    }

    if (signatureDescription.length && signatureDescription !== '-') {
      proteinDomain.signature_desc = signatureDescription;
    }

    if (Dbxref.length && Dbxref !== '-') {
      proteinDomain.Dbxref = Dbxref;
      dbUpdate.$addToSet['attributes.Dbxref'] = { $each: Dbxref };
    }

    if (ontologyTerm.length && ontologyTerm !== '-') {
      proteinDomain.Ontology_term = ontologyTerm;
      dbUpdate.$addToSet['attributes.Ontology_term'] = {
        $each: ontologyTerm,
      };
    }

    dbUpdate.$addToSet['subfeatures.$.protein_domains'] = proteinDomain;
    this.bulkOp.find({ 'subfeatures.ID': seqId }).update(dbUpdate);
  };
}

export default ParseTsvFile;
