/* eslint-disable react/prop-types */
import { eggnogCollection } from '/imports/api/genes/eggnog/eggnogCollection.js';
import { branch, compose } from '/imports/ui/util/uiUtil.jsx';
import { Genes } from '/imports/api/genes/geneCollection.js';
import { withTracker } from 'meteor/react-meteor-data';
import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import './eggnog.scss';

function Header() {
  return (
    <>
      <hr />
      <h4 className="subtitle is-4">EggNOG annotations</h4>
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
          <p className="has-text-grey">No EggNOG annotations found</p>
        </div>
      </article>
    </>
  );
}

function eggnogDataTracker({ gene }) {
  const eggnogId = Genes.findOne({ ID: gene.ID }).eggnogId;

  const eggnogSub = Meteor.subscribe('eggnog');
  const loading = !eggnogSub.ready();
  const eggnog = eggnogCollection.findOne({ _id: eggnogId });

  return {
    loading,
    gene,
    eggnog,
  };
}

function SeedEggNOGOrtholog({ seed, evalue, score }) {
  const uniprotUrl = 'https://www.uniprot.org/uniprot/';

  // Split to get uniprot id (e.g: 36080.S2K726 -> S2K726).
  let uniprotID;
  if (seed) {
    uniprotID = seed.split('.')[1];
  } else {
    uniprotID = '';
  }

  // Set 'e' to exponential unicode (e.g: 6.14e-161 -> 6.14ₑ-161)
  let expEvalue;
  if (typeof evalue !== 'undefined') {
    expEvalue = (evalue.indexOf('e') > -1
      ? (
        <span>
          {evalue.split('e')[0]}
          {'\u2091'}
          <sup>
            {evalue.split('e')[1]}
          </sup>
        </span>
      )
      : <span>{evalue}</span>
    );
  }

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
    V: 'Defense mechanisms',
    W: 'Extracellular structures',
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

function KeggApi({ database, query }) {
  // e.g reaction : https://rest.kegg.jp/find/reaction/R04405
  // e.g ko : https://rest.kegg.jp/find/ko/ko:K00549
  // e.g rclass : https://rest.kegg.jp/find/rclass/RC00002
  // e.g brite : https://rest.kegg.jp/find/brite/ko00001
  // e.g pathway : https://rest.kegg.jp/list/map01110

  // From kegg query api.
  let keggQueryApi;
  switch (database) {
    case 'pathway':
    case 'enzyme':
      keggQueryApi = 'https://rest.kegg.jp/list/';
      break;
    default:
      keggQueryApi = `https://rest.kegg.jp/find/${database}/`;
  }
  const [description, setDescription] = useState('');
  const [loading, isLoading] = useState(true);

  useEffect(() => {
    fetch(`${keggQueryApi}${query}`)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw response;
      })
      .then((data) => {
        isLoading(false);

        let content;

        // Get the KEGG Query.
        switch (database) {
          case 'reaction':
          case 'ko':
            content = data.split('\t')[1].split(';')[1];
            break;
          case 'rclass':
          case 'brite':
          case 'enzyme':
          case 'pathway':
            content = data.split('\t')[1];
            break;
          default:
            content = data;
        }
        setDescription(content);
      });
  }, [description, loading]);

  return (
    <div>
      {
        loading
          ? (
            <p className="loadingContent">...</p>
          )
          : (
            <p className="gogcategory">{description}</p>
          )
      }
    </div>
  );
}

function Kegg({ database, query }) {
  let KeggEntryUrl;
  switch (database) {
    case 'brite':
      KeggEntryUrl = 'https://www.genome.jp/brite/';
      break;
    default:
      KeggEntryUrl = 'https://www.genome.jp/entry/';
  }

  const KeggRecAttribute = (Array.isArray(query)
    ? query.map((ID) => {
      return (
        <div className="seed_eggnog_ortholog_table">
          <a
            href={`${KeggEntryUrl}${ID}`}
            target="_blank"
            rel="noreferrer"
          >
            {ID}
          </a>
          <KeggApi database={database} query={ID} />
        </div>
      );
    })
    : (
      <div>
        <a
          href={`${KeggEntryUrl}${query}`}
          target="_blank"
          rel="noreferrer"
        >
          {query}
        </a>
        <KeggApi database={database} query={query} />
      </div>
    ));

  return (
    <EggnogGeneralInformations informations={KeggRecAttribute} maxArray={2} />
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

function BiggApi({ models, genes }) {
  // e.g : api http://bigg.ucsd.edu/api/v2/models/iMM904/genes/YER091C
  const biggQueryApi = `http://bigg.ucsd.edu/api/v2/models/${models}/genes/${genes}`;

  const [description, setDescription] = useState('');
  const [loading, isLoading] = useState(true);

  useEffect(() => {
    fetch(biggQueryApi)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw response;
      })
      .then((data) => {
        isLoading(false);

        let content = '';
        for (let i = 0; i < data.reactions.length; i++) {
          content += data.reactions[i].name;
          if (i === data.reactions.length - 1) break;
          content = content.concat('; ');
        }
        setDescription(content);
      });
  }, [description, loading]);

  return (
    <div>
      {
        loading
          ? (
            <p className="loadingContent">...</p>
          )
          : (
            <p className="gogcategory">{description}</p>
          )
      }
    </div>
  );
}

function BiggReaction({ reaction }) {
  if (reaction === ' ') return <p />;
  // e.g : http://bigg.ucsd.edu/models/iMM904/genes/YER091C
  const biggModelsUrl = 'http://bigg.ucsd.edu/models/';
  const biggGenesUrl = '/genes/';

  // Split bigg reaction to get models and genes id (eg. iMM904.YER091C ->
  // model: iMM904 and gene: YER091C) and create url.
  const biggReactionUrl = (Array.isArray(reaction)
    ? reaction.map((val) => {
      return (
        <div>
          <a
            href={biggModelsUrl.concat(val.split('.')[0], biggGenesUrl, val.split('.')[1])}
            target="_blank"
            rel="noreferrer"
          >
            { val }
          </a>
          <BiggApi models={val.split('.')[0]} genes={val.split('.')[1]} />
        </div>
      );
    })
    : (
      <div>
        <a
          href={biggModelsUrl.concat(reaction.split('.')[0], biggGenesUrl, reaction.split('.')[1])}
          target="_blank"
          rel="noreferrer"
        >
          { reaction }
        </a>
        <BiggApi models={reaction.split('.')[0]} genes={reaction.split('.')[1]}/>
      </div>
    ));

  return (
    <EggnogGeneralInformations informations={biggReactionUrl} />
  );
}

function PfamsApi({ id }) {
  // e.g : https://pfam.xfam.org/family/Meth_synt_1/desc
  const PfamsQueryApi = `https://pfam.xfam.org/family/${id}/desc`;

  const [description, setDescription] = useState('');
  const [loading, isLoading] = useState(true);

  useEffect(() => {
    fetch(PfamsQueryApi)
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        throw response;
      })
      .then((data) => {
        isLoading(false);
        setDescription(data);
      });
  }, [description, loading]);

  return (
    <div>
      {
        loading
          ? (
            <p className="loadingContent">...</p>
          )
          : (
            <p className="gogcategory">{description}</p>
          )
      }
    </div>
  );
}

function Pfams({ family }) {
  // e.g : https://pfam.xfam.org/family/Meth_synt_1
  const PfamsUrl = 'https://pfam.xfam.org/family/';

  const PfamsLibrary = (Array.isArray(family)
    ? family.map((val) => {
      return (
        <div>
          <a
            href={`${PfamsUrl}${val}`}
            target="_blank"
            rel="noreferrer"
          >
            { val }
          </a>
          <PfamsApi id={val} />
        </div>
      );
    })
    : (
      <div>
        <a
          href={`${PfamsUrl}${family}`}
          target="_blank"
          rel="noreferrer"
        >
          { family }
        </a>
        <PfamsApi id={family} />
      </div>
    ));

  return (
    <EggnogGeneralInformations informations={PfamsLibrary} />
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

function EggnogGeneralInformations({ informations, maxArray = 5 }) {
  const maxChar = 70;
  const maxArrayLines = maxArray;
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
      return `Show ${informations.length - maxArrayLines} more ...`;
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
            <ul className="scrolling-goterms">
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
                  Best protein match in EggNOG.
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
              EggNOG Orthologous Groups
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
                  List of matching EggNOG Orthologous Groups.
                </p>
              </div>
            </td>
            <td>
              { eggnog.eggNOG_OGs && <EggnogOGs orthologousGroups={eggnog.eggNOG_OGs} /> }
            </td>
          </tr>
          <tr>
            <td>
              Maximum annotation level
              <div className="help-tip">
                <span>
                  {'\u24d8'}
                </span>
                <p>
                  The level of widest OG used to retrieve orthologs for
                  annotations.
                </p>
              </div>
            </td>
            <td>
              { eggnog.max_annot_lvl && <MaxAnnotLvl annot={eggnog.max_annot_lvl} /> }
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
              { eggnog.COG_category && <GogCategory category={eggnog.COG_category} /> }
            </td>
          </tr>
          <tr>
            <td>
              Description
              <div className="help-tip">
                <span>
                  {'\u24d8'}
                </span>
                <p>
                  EggNOG functional description inferred from best matching OG.
                </p>
              </div>
            </td>
            <td>
              {
                eggnog.Description
                  && (
                    <EggnogGeneralInformations informations={eggnog.Description} />
                  )
              }
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
            <td>
              { eggnog.GOs && <GeneOntology gosID={eggnog.GOs} /> }
            </td>
          </tr>
          <tr>
            <td>
              Enzyme Commission
              <div className="help-tip">
                <span>
                  {'\u24d8'}
                </span>
                <p>
                  The Enzyme Commission number (EC number).
                </p>
              </div>
            </td>
            <td>
              { eggnog.EC && <Kegg database="enzyme" query={eggnog.EC} /> }
            </td>
          </tr>
          <tr>
            <td>
              KEGG ko
              <div className="help-tip">
                <span>
                  {'\u24d8'}
                </span>
                <p>
                  The KO (KEGG Orthology) database is a database of molecular
                  functions represented in terms of functional orthologs.
                  <br />
                  <a href="https://www.genome.jp/kegg/reaction/" target="_blank" rel="noreferrer">
                    (source : https://www.genome.jp/kegg/ko.html)
                  </a>
                </p>
              </div>
            </td>
            <td>
              { eggnog.KEGG_ko && <Kegg database="ko" query={eggnog.KEGG_ko} /> }
            </td>
          </tr>
          <tr>
            <td>
              KEGG pathway
              <div className="help-tip">
                <span>
                  {'\u24d8'}
                </span>
                <p>
                  KEGG PATHWAY is a collection of manually drawn pathway maps
                  representing our knowledge of the molecular interaction,
                  reaction and relation networks.
                  <br />
                  <a href="https://www.genome.jp/kegg/pathway.html" target="_blank" rel="noreferrer">
                    (source : https://www.genome.jp/kegg/pathway.html)
                  </a>
                </p>
              </div>
            </td>
            <td>
              { eggnog.KEGG_Pathway && <Kegg database="pathway" query={eggnog.KEGG_Pathway} /> }
            </td>
          </tr>
          <tr>
            <td>
              KEGG reaction
              <div className="help-tip">
                <span>
                  {'\u24d8'}
                </span>
                <p>
                  KEGG REACTION is a database of chemical reactions, mostly
                  enzymatic reactions, containing all reactions that appear in
                  the KEGG metabolic pathway maps and additional reactions that
                  appear only in the Enzyme Nomenclature.
                  <br />
                  <a href="https://www.genome.jp/kegg/reaction/" target="_blank" rel="noreferrer">
                    (source : https://www.genome.jp/kegg/reaction/)
                  </a>
                </p>
              </div>
            </td>
            <td>
              { eggnog.KEGG_Reaction && <Kegg database="reaction" query={eggnog.KEGG_Reaction} /> }
            </td>
          </tr>
          <tr>
            <td>
              KEGG rclass
              <div className="help-tip">
                <span>
                  {'\u24d8'}
                </span>
                <p>
                  KEGG RCLASS contains classification of reactions based on the
                  chemical structure transformation patterns of
                  substrate-product pairs (reactant pairs), which are
                  represented by the so-called RDM patterns.
                  <br />
                  <a href="https://www.genome.jp/kegg/reaction/" target="_blank" rel="noreferrer">
                    (source : https://www.genome.jp/kegg/reaction/)
                  </a>
                </p>
              </div>
            </td>
            <td>
              { eggnog.KEGG_rclass && <Kegg database="rclass" query={eggnog.KEGG_rclass} /> }
            </td>
          </tr>
          <tr>
            <td>
              KEGG BRITE
              <div className="help-tip">
                <span>
                  {'\u24d8'}
                </span>
                <p>
                  KEGG BRITE is a collection of hierarchical classification
                  systems capturing functional hierarchies of various biological
                  objects, especially those represented as KEGG objects.
                  <br />
                  <a href="https://www.genome.jp/kegg/brite.html" target="_blank" rel="noreferrer">
                    (source : https://www.genome.jp/kegg/brite.html)
                  </a>
                </p>
              </div>
            </td>
            <td>
              { eggnog.BRITE && <Kegg database="brite" query={eggnog.BRITE} /> }
            </td>
          </tr>
          <tr>
            <td>
              KEGG TC (Transporter Classification)
              <div className="help-tip">
                <span>
                  {'\u24d8'}
                </span>
                <p>
                  Classification system for membrane transport proteins known as
                  the Transporter Classification (TC) system.
                  <br />
                  <a href="https://www.tcdb.org/" target="_blank" rel="noreferrer">
                    (source : https://www.tcdb.org/)
                  </a>
                </p>
              </div>
            </td>
            <td>
              {
                eggnog.KEGG_TC
                  && (
                    <LinkedComponent
                      values={eggnog.KEGG_TC}
                      url="https://tcdb.org/search/result.php?tc="
                    />
                  )
              }
            </td>
          </tr>
          <tr>
            <td>
              CAZy
              <div className="help-tip">
                <span>
                  {'\u24d8'}
                </span>
                <p>
                  Best hit with
                  <b> Carbohydrate-Active enZYmes </b>
                  database.
                  <br />
                  <a href="http://www.cazy.org/" target="_blank" rel="noreferrer">
                    (source : http://www.cazy.org/)
                  </a>
                </p>
              </div>
            </td>
            <td>
              { eggnog.CAZy && <Cazy cazy={eggnog.CAZy} /> }
            </td>
          </tr>
          <tr>
            <td>
              BiGG reaction
              <div className="help-tip">
                <span>
                  {'\u24d8'}
                </span>
                <p>
                  List of predicted BiGG metabolic reactions.
                  <br />
                  <a href="http://bigg.ucsd.edu/" target="_blank" rel="noreferrer">
                    (source : http://bigg.ucsd.edu/)
                  </a>
                </p>
              </div>
            </td>
            <td>
              { eggnog.BiGG_Reaction && <BiggReaction reaction={eggnog.BiGG_Reaction} />}
            </td>
          </tr>
          <tr>
            <td>
              PFAMs
              <div className="help-tip">
                <span>
                  {'\u24d8'}
                </span>
                <p>
                  The Pfam database is a large collection of protein families.
                  <br />
                  <a href="https://pfam.xfam.org/" target="_blank" rel="noreferrer">
                    (source : https://pfam.xfam.org/)
                  </a>
                </p>
              </div>
            </td>
            <td>
              { eggnog.PFAMs && <Pfams family={eggnog.PFAMs} /> }
            </td>
          </tr>
          {
            eggnog.md5
              && (
                <tr>
                  <td>md5</td>
                  <td>
                    {eggnog.md5}
                  </td>
                </tr>
              )
          }
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
