/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { branch, compose } from '/imports/ui/util/uiUtil.jsx';
import { Genes } from '/imports/api/genes/geneCollection.js';
import { withTracker } from 'meteor/react-meteor-data';
import './eggnog.scss';

function Header() {
  return (
    <>
      <hr />
      <h4 className="subtitle is-4">eggNOG annotations</h4>
    </>
  );
}

function hasNoEggnog({ eggnog }) {
  return typeof eggnog === 'undefined';
}

function NoEggnog({ showHeader }) {
  return (
    <>
      {showHeader && <Header />}
      <article className="message no-orthogroup" role="alert">
        <div className="message-body">
          <p className="has-text-grey">No eggnog annotations found</p>
        </div>
      </article>
    </>
  );
}

function eggnogDataTracker({ gene }) {
  const eggnogAnnotation = Genes.findOne({ ID: gene.ID }).eggnog;
  const eggnog = (Object.keys(eggnogAnnotation).length === 0 ? undefined : eggnogAnnotation);
  return {
    gene,
    eggnog,
  };
}

function SeedEggNOGOrtholog({ seed, evalue, score }) {
  const uniprotUrl = 'https://www.uniprot.org/uniprot/';

  // Split to get uniprot id (e.g: 36080.S2K726 -> S2K726).
  const uniprotID = seed.split('.')[1];

  // Set 'e' to exponential unicode (e.g: 6.14e-161 -> 6.14ₑ-161)
  const expEvalue = (evalue.indexOf('e') > -1
    ? (
      <span>
        {evalue.split('e')[0]}
        {'\u2091'}
        <sup>
          {evalue.split('e')[1]}
        </sup>
      </span>
    )
    : <span>{evalue}</span>);

  return (
    <td className="seed_eggnog_ortholog_table">
      <p>
        Seed:
        <a href={`${uniprotUrl}${uniprotID}`} target="_blank" rel="noreferrer">
          { seed }
        </a>
      </p>
      <p>
        evalue:
        <span>
          { expEvalue }
        </span>
      </p>
      <p>
        score:
        <span>
          { score }
        </span>
      </p>
    </td>
  );
}

function EggnogOGs({ orthologousGroups }) {
  const eggnog5Url = 'http://eggnog5.embl.de/#/app/results?target_nogs=';
  const ncbiUrl = 'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=';

  // Split orthologous groups to get eggNOG 5 id (e.g: COG0563@1|root -> COG0563).
  const eggnogOGsID = (Array.isArray(orthologousGroups)
    ? orthologousGroups.map((val) => val.split('@')[0])
    : orthologousGroups.split('@')[0]);

  // Split orthologous groups to get NCBI id (e.g: KOG3078@2759|Eukaryota -> 2759).
  const ncbiOGsID = (Array.isArray(orthologousGroups)
    ? orthologousGroups.map((val) => val.split('@')[1].split('|')[0])
    : orthologousGroups.split('@')[1].split('|')[0]);

  // Split orthologous groups and get taxonomy (e.g: 38FS5@33154|Opisthokonta ->
  // Opisthokonta).
  const taxonOGs = (Array.isArray(orthologousGroups)
    ? orthologousGroups.map((val) => val.split('@')[1].split('|')[1])
    : orthologousGroups.split('@')[1].split('|')[1]);

  // Create links to ncbi and eggNOG 5 (e.g: Fungi incertae sedis: 1GT34)
  const eggOgsUrl = (Array.isArray(eggnogOGsID)
    ? eggnogOGsID.map((egg5ID, index) => {
      return (
        <div>
          <a
            href={`${ncbiUrl}${ncbiOGsID[index]}`}
            target="_blank"
            rel="noreferrer"
          >
            {`${taxonOGs[index]}`}
          </a>
          <span>:  </span>
          <a
            href={`${eggnog5Url}${egg5ID}`}
            target="_blank"
            rel="noreferrer"
          >
            {egg5ID}
          </a>
        </div>
      );
    })
    : (
      <div>
        <a
          href={`${ncbiUrl}${ncbiOGsID}`}
          target="_blank"
          rel="noreferrer"
        >
          {`${taxonOGs}`}
        </a>
        <span>:  </span>
        <a
          href={`${eggnog5Url}${eggnogOGsID}`}
          target="_blank"
          rel="noreferrer"
        >
          {eggnogOGsID}
        </a>
      </div>
    ));

  return (
    <EggnogGeneralInformations informations={eggOgsUrl} />
  );
}

function MaxAnnotLvl({ annot }) {
  const ncbiUrl = 'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=';

  // Split annotation level to get NCBI id (e.g: 4751|Fungi -> 4751).
  const annotationSplit = annot.split('|');
  const ncbiID = annotationSplit[0];
  const taxonomyLevel = annotationSplit[1];

  return (
    <a href={`${ncbiUrl}${ncbiID}`} target="_blank" rel="noreferrer">
      { taxonomyLevel }
    </a>
  );
}

function GogCategory({ category }) {
  // Based on :
  // https://ecoliwiki.org/colipedia/index.php/Clusters_of_Orthologous_Groups_(COGs)
  const functionalClassifications = {
    A: 'RNA processing and modification',
    B: 'Chromatin Structure and dynamics',
    C: 'Energy production and conversion',
    D: 'Cell cycle control and mitosis',
    E: 'Amino Acid metabolis and transport',
    F: 'Nucleotide metabolism and transport',
    G: 'Carbohydrate metabolism and transport',
    H: 'Coenzyme metabolis',
    I: 'Lipid metabolism',
    J: 'Tranlsation',
    K: 'Transcription',
    L: 'Replication and repair',
    M: 'Cell wall/membrane/envelop biogenesis',
    N: 'Cell motility',
    O: 'Post-translational modification, protein turnover, chaperone functions',
    P: 'Inorganic ion transport and metabolism',
    Q: 'Secondary Structure',
    T: 'Signal Transduction',
    U: 'Intracellular trafficing and secretion',
    Y: 'Nuclear structure',
    Z: 'Cytoskeleton',
    R: 'General Functional Prediction only',
    S: 'Function Unknown',
  };

  const description = functionalClassifications[`${category}`];

  return (
    <div className="gogcategory">
      <p>
        { category }
      </p>
      {
        description
          ? (
            <p>
              <span>(</span>
              { description }
              <span>)</span>
            </p>
          )
          : null
      }
    </div>
  );
}

function DescriptionGeneOntologyApi({ goterm }) {
  const [description, setDescription] = useState('');
  const GOsApi = 'http://api.geneontology.org/api/bioentity/';

  // May cause Cross-Origin Request Blocked error.
  useEffect(() => {
    fetch(`${GOsApi}${goterm}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw response;
      })
      .then((data) => {
        setDescription(data.label);
      });
  }, [description]);

  return (
    <p className="gogcategory">{description}</p>
  );
}

function GeneOntology({ gosID }) {
  const GOsUrl = 'http://amigo.geneontology.org/amigo/term/';

  const GOsAttribute = (Array.isArray(gosID)
    ? gosID.map((ID) => {
      return (
        <div className="seed_eggnog_ortholog_table">
          <a
            href={`${GOsUrl}${ID}`}
            target="_blank"
            rel="noreferrer"
          >
            {ID}
          </a>
          <DescriptionGeneOntologyApi goterm={ID} />
        </div>
      );
    })
    : (
      <a
        href={`${GOsUrl}${gosID}`}
        target="_blank"
        rel="noreferrer"
      >
        {gosID}
      </a>
    ));

  return (
    <EggnogGeneralInformations informations={GOsAttribute} />
  );
}

function Cazy({ cazy }) {
  const cazyUrl = 'http://www.cazy.org/';

  const cazyFullUrl = (Array.isArray(cazy)
    ? cazy.map((val) => {
      return (
        <a
          href={cazyUrl.concat(cazy, '.html')}
          target="_blank"
          rel="noreferrer"
        >
          { val }
        </a>
      );
    })
    : <a href={cazyUrl.concat(cazy, '.html')} target="_blank" rel="noreferrer">{ cazy }</a>);

  return (
    <EggnogGeneralInformations informations={cazyFullUrl} />
  );
}

function BiggReaction({ reaction }) {
  const biggModelsUrl = 'http://bigg.ucsd.edu/models/';
  const biggGenesUrl = '/genes/';

  // Split bigg reaction to get models and genes id (eg. iMM904.YER091C ->
  // model: iMM904 and gene: YER091C) and create url.
  const biggReactionUrl = (Array.isArray(reaction)
    ? reaction.map((val) => {
      return (
        <a
          href={biggModelsUrl.concat(val.split('.')[0], biggGenesUrl, val.split('.')[1])}
          target="_blank"
          rel="noreferrer"
        >
          { val }
        </a>
      );
    })
    : <a href={biggModelsUrl.concat(reaction.split('.')[0], biggGenesUrl, reaction.split('.')[1])} target="_blank" rel="noreferrer">{ reaction }</a>);

  return (
    <EggnogGeneralInformations informations={biggReactionUrl} />
  );
}

function LinkedComponent({ values, url }) {
  const linkUrl = (url === undefined ? '' : url);

  const linkedAttribute = (Array.isArray(values)
    ? values.map((val) => {
      return (
        <a href={linkUrl.concat(val)} target="_blank" rel="noreferrer">
          {val}
        </a>
      );
    })
    : (
      <a href={linkUrl.concat(values)} target="_blank" rel="noreferrer">
        {values}
      </a>
    ));

  return (
    <EggnogGeneralInformations informations={linkedAttribute} />
  );
}

function EggnogGeneralInformations({ informations }) {
  const maxChar = 70;
  const maxArrayLines = 5;
  const infoIsArray = Array.isArray(informations);
  const isMaxArray = informations.length > maxArrayLines;
  const isMaxChar = informations.length > maxChar;

  const [openInfo, setOpenInfo] = useState(false);
  const [descArray, setDescArray] = useState([]);
  const [descChar, setDescChar] = useState('');

  useEffect(() => {
    if (infoIsArray) {
      if (openInfo) {
        setDescArray(informations);
      } else {
        setDescArray(informations.slice(0, maxArrayLines));
      }
    } else {
      if (informations.length > maxChar) {
        if (openInfo === false) {
          const descNoArray = informations
            ? `${informations.slice(0, maxChar)} ... `
            : informations;
          setDescChar(descNoArray);
        } else {
          setDescChar(informations);
        }
      } else {
        setDescChar(informations);
      }
    }
  }, [openInfo]);

  const buttonText = (() => {
    if (infoIsArray) {
      if (openInfo) {
        return 'Show less';
      }
      return `Show ${informations.length - 1} more ...`;
    } else {
      if (openInfo) {
        return 'Show less';
      }
      return 'Show more ...';
    }
  })();

  return (
    <>
      {
        infoIsArray
          ? (
            <ul>
              { descArray.map((value, index) => (
                <li key={index}>{ value }</li>
              ))}
            </ul>
          )
          : (
            <p>{ descChar }</p>
          )
      }
      { (isMaxArray && infoIsArray) || (isMaxChar && !infoIsArray)
        ? (
          <button
            type="button"
            className="is-link"
            onClick={() => setOpenInfo(!openInfo)}
          >
            <small>{ buttonText }</small>
          </button>
        ) : null }
    </>
  );
}

function ArrayEggnogAnnotations({ eggnog }) {
  return (
    <div>
      <table className="table-eggnog table">
        <tbody>
          <tr>
            <th colSpan="2" className="is-light">
              General informations
            </th>
          </tr>
          <tr>
            <td>
              Seed
              <div className="help-tip">
                <span>
                  {'\u24d8'}
                  ,
                </span>
                <p>
                  Best protein match in eggNOG.
                </p>
              </div>

              evalue
              <div className="help-tip">
                <span>
                  {'\u24d8'}
                  ,
                </span>
                <p>
                  Best protein match (e-value).
                </p>
              </div>

              score
              <div className="help-tip">
                <span>
                  {'\u24d8'}
                </span>
                <p>
                  Best protein match (bit-score).
                </p>
              </div>
            </td>
            <SeedEggNOGOrtholog
              seed={eggnog.seed_eggNOG_ortholog}
              evalue={eggnog.seed_ortholog_evalue}
              score={eggnog.seed_ortholog_score}
            />
          </tr>
        </tbody>
      </table>
      <table className="table-eggnog table">
        <tbody>
          <tr>
            <th colSpan="2" className="is-light">
              eggNOG Orthologous Groups
            </th>
          </tr>
          <tr>
            <td>
              Orthologous Groups
              <div className="help-tip">
                <span>
                  {'\u24d8'}
                </span>
                <p>
                  List of matching eggNOG Orthologous Groups.
                </p>
              </div>
            </td>
            <td>
              <EggnogOGs orthologousGroups={eggnog.eggNOG_OGs} />
            </td>
          </tr>
          <tr>
            <td>Maximum annotation level</td>
            <td>
              <MaxAnnotLvl annot={eggnog.max_annot_lvl} />
            </td>
          </tr>
          <tr>
            <td>
              Clusters of Orthologous Groups category
              <div className="help-tip">
                <span>
                  {'\u24d8'}
                </span>
                <p>
                  COG functional category inferred from best matching OGs.
                </p>
              </div>
            </td>
            <td>
              <GogCategory category={eggnog.COG_category} />
            </td>
          </tr>
          <tr>
            <td>Description</td>
            <td>
              <EggnogGeneralInformations informations={eggnog.Description} />
            </td>
          </tr>
          <tr>
            <td>Preferred name</td>
            <td>{eggnog.Preferred_name}</td>
          </tr>
        </tbody>
      </table>
      <table className="table-eggnog table">
        <tbody>
          <tr>
            <th colSpan="2" className="is-light">
              Functional annotations
            </th>
          </tr>
          <tr>
            <td>
              Gene Ontology
              <div className="help-tip">
                <span>
                  {'\u24d8'}
                </span>
                <p>
                  List of predicted Gene Ontology terms.
                </p>
              </div>
            </td>
            {
              eggnog.GOs.length > 0 && eggnog.GOs[0] !== ' '
                ? (
                  <td className="scrolling-goterms">
                    <GeneOntology gosID={eggnog.GOs} />
                  </td>
                )
                : (
                  <td> </td>
                )
            }
          </tr>
          <tr>
            <td>
              Enzyme Commission
              <div className="help-tip">
                <span>
                  {'\u24d8'}
                </span>
                <p>
                  EC numbers specify enzyme-catalysed reactions.
                </p>
              </div>
            </td>
            <td>
              <LinkedComponent
                values={eggnog.EC}
                url="https://enzyme.expasy.org/EC/"
              />
            </td>
          </tr>
          <tr>
            <td>KEGG ko</td>
            <td>
              <LinkedComponent
                values={eggnog.KEGG_ko}
                url="https://www.genome.jp/entry/"
              />
            </td>
          </tr>
          <tr>
            <td>KEGG pathway</td>
            <td>
              <LinkedComponent
                values={eggnog.KEGG_Pathway}
                url="https://www.genome.jp/entry/"
              />
            </td>
          </tr>
          <tr>
            <td>KEGG reaction</td>
            <td>
              <LinkedComponent
                values={eggnog.KEGG_Reaction}
                url="https://www.genome.jp/entry/"
              />
            </td>
          </tr>
          <tr>
            <td>KEGG rclass</td>
            <td>
              <LinkedComponent
                values={eggnog.KEGG_rclass}
                url="https://www.genome.jp/entry/"
              />
            </td>
          </tr>
          <tr>
            <td>BRITE</td>
            <td>
              <LinkedComponent
                values={eggnog.BRITE}
                url="https://www.genome.jp/brite/"
              />
            </td>
          </tr>
          <tr>
            <td>KEGG tc</td>
            <td>
              <LinkedComponent
                values={eggnog.KEGG_TC}
                url="https://tcdb.org/search/result.php?tc="
              />
            </td>
          </tr>
          <tr>
            <td>CAZy</td>
            <td>
              <Cazy cazy={eggnog.CAZy} />
            </td>
          </tr>
          <tr>
            <td>BiGG reaction</td>
            <td>
              <BiggReaction reaction={eggnog.BiGG_Reaction} />
            </td>
          </tr>
          <tr>
            <td>PFAMs</td>
            <td>
              <LinkedComponent
                values={eggnog.PFAMs}
                url="https://pfam.xfam.org/family/"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function EggNogAnnotation({ showHeader = false, eggnog }) {
  return (
    <>
      { showHeader && <Header />}
      <div>
        <ArrayEggnogAnnotations eggnog={eggnog} />
      </div>
    </>
  );
}

export default compose(
  withTracker(eggnogDataTracker),
  branch(hasNoEggnog, NoEggnog),
)(EggNogAnnotation);
