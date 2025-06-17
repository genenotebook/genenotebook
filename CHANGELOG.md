# Genoboo Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html)

## [0.4.17] 2025-06-17

- Fix annot loading when using numerical reference ids
- Fix meteor version in bundle script

## [0.4.16] 2024-06-12

- Better management for mongo error when adding annotation
- Manage empty genes (no subentities)
- Manage CDS with same IDs in the same gene

## [0.4.15] 2024-04-05

### Fixed

- Fix incorrect release

## [0.4.14] 2024-04-04

### Fixed

- Hectar loader

## [0.4.13] 2024-02-05

### Added

- Added /healthcheck endpoint to improve galaxy tool build (Will write a line in logs, and send a 200 response)

## [0.4.12] 2023-12-07

### Fixed

- Fixed filtering when using ES search

## [0.4.11] 2023-11-29

### Added

- Added 'annotation_field" config option, for external ES search
- Added redirection from Gene subentity to Gene in url


## [0.4.10] 2023-11-23

### Added

- Added 'disable_header' config option, to hide GeneNotebook links and display on the landing page

### Fixed

- Fixed test CI
- Fixed gene list not re-rendering properly when searching
- Fixed search block on the bottom of the landing page

## [0.4.9] 2023-11-17

### Fixed

- Error management in expression files

## [0.4.8] 2023-10-20

### Added

- Option for redirecting the search to an external url ("public.redirectSearch" key in config)
  - An additional key "public.redirectSearchAttribute", defaulting to 'query', will be used as the get parameter attribute. (ie: url + "?redirectSearchAttribute=query")
- Options for using a remote search ending, and merging the results with GNB internal search.
  - The 'public.externalSearch' option need to be set to true, and an 'externalSearchOptions' dict need to be set.
  - 'url' key is the remote endpoint where the query will be sent
  - 'gene_field' is the remote field to get the gene IDs (default to geneId)
  - 'query_param' : optional get parameter to use for the query
  - 'field_param': optional get parameter to use to restrict the results to the gene_field value
  - 'count_param': optional get parameter to restrict the number of results
- Multiple annotations for the same genome
  - When adding an annotation, you must now set the '--annot' to set the annotation name.
  - When integrating data afterward, you can use the --annot tag to specify the annotation you are aiming for.
  - If you have multiple genes with the same ID, and do not specify '--annot', the results may be variables
  - You can specify --annotations multiple time when integrating orthogroups
- Will now decode proteins and genes IDs when integrating data. (It was already done when integrating gffs, so there was some mismatch with IDs)

## Changed

- Various UI fixes to better fit multiple annotation versions
  - Including an 'annotation' selector in the gene list

## [0.4.7] 2023-09-26

### Fixed

- Fix typo in cli
- Fix typo in changelog

## [0.4.6] 2023-09-25

### Added

- Added generic expression loader

### Fixed

- Crash when loading a transcriptome with a gene not in DB

## [0.4.5] 2023-09-19

### Added

- Added Hectar loader

### Changed

- Changed GO API url due to changes

## [0.4.4] 2023-06-23

### Changed

- Break annotation add batch in smaller size units (500 genes)

## [0.4.3] 2023-05-02

### Fixed

- Fixed Protein domains view in gene list
- Removed remaining console.log in Eggnog
- Fixed display for blast/diamond when there is no data
- Fixed typo in Show more / Show less for diamond
- Fixed async annotation add

### Added

- Added back config file option at startup (see config.json.template)
- Added config option to disable login (and registration) (*disable_user_login* key)
- Added config option to disable registrations (*disable_user_registration* key)
- Added config option to hide blast link (*disable_blast* key)
- Added config option to redirect blast link to custom external link (*blast_link* key)

## [0.4.2] 2023-04-13

### Fixed

- Fixed an issue with annotations files (numerical score values)
- Fixed eggnog integration
- Fixed an issue with publications (stopped loading all interpro / eggnog data)
- Fixed an issue with blast xml loader

### Changed

- Moved Interpro data to dedicated collection
- Allow multiple blast / interpro results for the same gene (one for each protein)
- Removed wrong link for Unintegrated interpro data
- Disabled Kegg api call (for now)
- Only integrate Interpro & GO DBxref for now

## [0.4.1] 2023-03-31

### Fixed

- Fixed several async issues when loading data (interproscan, genome, alignment) (issue with 'on' on LineReader)
- Improper management of errors in CLI (process left hanging)
- Better management of bulkOp when empty

## [0.4.0] 2023-03-21

### Added

- Add support for custom protein ids when integrating annotation
- Add tests from the API side

### Changed

- Forked Genenotebook to Genoboo
- Rewrote orthogroup integration (for better protein management + include orthogroup name)
  - (Not compatible with previous version: need to re-integrate orthogroups)
- Added Bar Plot for orthogroup content

# Removed

- API calls for PFAM in Eggnog display (pfam is deprecated)

### Fixed

- Various UI issues

## [0.3.2] 2022-11-04

### Added

- Support for additional InterproScan file formats (tsv, gff, xml)
- EggNog annotations
- BLAST/diamond alignment reading/visualizing

## [0.3.1] 2021-01-28

### Added

- User accounts can be added/changed/removed from the CLI
- Bulk operations for user account management through CLI
- `--dbStartupTimeout` option to `genenotebook run` to allow specifying how long to wait for the mongo daemon to start
- `--dbCacheSizeGB` option to `genenotebook run` to allow specifying how many GBs of RAM can be used for mongodb cache.

### Changed

- Removed `settings.json`
- Phylogenetic tree now made with react-bio-viz
- Meteor version 2.5.6

### Fixed

- Once again fixed version display
- Popover menus

## [0.3.0] 2021-09-17

### Added

- External links and descriptions on GO terms and INTERPRO ids
- Make the list of default user accounts configurable using `settings.json` configuration file
- Ability to upload genome sequence through the browser

### Changed

- Meteor version 2.4
- Node.js version 14

### Fixed

- Option parsing for CLI
- Version display in browser

## [0.2.0] 2020-01-22

### Added

- Mongodb logging
- Verbosity toggle for gff parsing

### Changed

- Meteor version 1.10
- Node.js version >12
- MongoDB version 4.2
- Fully migrated all react components to new hooks API
- Upgraded to `alanning:roles@3.2.0`
- **BACKWARDS INCOMPATIBLE:**
  Modified user permission schemas to comply with `alanning:roles@3.2.0` for the following collections: `users`, `genomeCollection`, `genomeSequenceCollection`, `ExperimentInfo`, `Transcriptomes`. Existing servers attempt to fix this with automatic schema migration.

### Fixed

- Footer correctly displays version info on production builds
- Plot tooltips can be closed by clicking anywhere on the screen, similar to dropdown menu
- Various orthogroup loading fixes: results are properly returned to the cli and loading an orthogroup with an existing ID throws an error.

## [0.1.16] 2019-05-02

### Added

- Working 404 page
- Multiline queries in gene table

### Changed

- Meteor version 1.8.1

### Fixed

- Base url of download links
- BLAST result options menu
- Downloads for users that are not logged in
- Trim whitespace search string
- Genome selection menu

## [0.1.15] 2019-03-26

### Added

- Download options for annotations and gene expression

### Changed

- Download loading indicators

### Fixed

- Downloading no longer requires user to be logged in

## [0.1.14] 2019-03-21

### Added

- Loading indicator for expression plots
- View gene expression and protein domains of BLAST hits
- Link BLAST hits to Gene Table
- Footer that displays running GeneNoteBook version and links to documentation
- Warning indicating absence of BLAST databases
- Set BLAST Parameters
- Display original input and used parameters of finished BLAST jobs

### Changed

- Orientation of gene expression x-axis to maximize space use

### Fixed

- Expression plots now display scroll on overflow
- Executables read version info from package.json instead of being hardcoded
- BLAST databases no longer mysteriously disappear

## [0.1.13] 2018-11-29

### Fixed

- DB path folder creation

## [0.1.12] 2018-11-29

### Added

- `--db-path` option for `genenotebook run` to specify location of MongoDB datafiles when letting GeneNoteBook handle the MongoDB daemon.

### Changed

- GeneNoteBook now runs a MongoDB daemon under the hood by default, so having a running MongoDB daemon is no longer a requirement. It is still possible by specifying `--mongo-url` when executing `genenotebook run`.
- Updated to Meteor 1.8.0.1

## [0.1.11] 2018-11-28

### Fixed

- Header logo and font loading when running production bundle on localhost

## [0.1.10] 2018-11-25

### Fixed

- CLI executables logging
- Header logo
- Even more font loading fixes
- Console logging and debugging

## [0.1.9] 2018-11-21

### Fixed

- Font loading for icon fonts
- Usage string for CLI scripts
- BLAST url redirect when not logged in

### Changed

- Moved Docker files to separate repository

## [0.1.8] 2018-11-15

### Fixed

- Several GFF3 parsing issues

## [0.1.7] 2018-11-12

### Fixed

- Genetable correctly infers query from URL

### Added

- Spinner indicating that gene table query is loading

### Changed

- Switched to React Router v4
- Transcriptome sample selection interface

## [0.1.6] 2018-10-30

### Fixed

- Ability to set permission levels of transcriptome samples
- Gene table column order

### Added

- Genome name column for gene table

## [0.1.5] 2018-10-22

### Fixed

- Correctly set isPublic attribute during genome loading
- Only admin and curator can edit genes

### Changed

- Updated meteor.js to v1.8.0
- Cleanup package.json

## [0.1.4] 2018-10-03

### Added

- Ability to change passwords
- Cancel filter option to GeneTable dropdown menu

### Fixed

- Orthogroup tip labels correctly show on firefox and safari

### Changed

- Color orthogroup tip nodes by organism

## [0.1.3] 2018-09-29

### Added

- Protein domain popovers
- Gene attributes with multiple values can be toggled to display more or less values
- Option to download primary transcripts only
- Add kallisto tsv files from command line

### Fixed

- Parsing newick formatted orthogroup trees and linking genes on gene ID / transcript ID
- Adding Interproscan gff3 (`genenotebook add interproscan`)
- Downloads no longer save empty files

### Changed

- Parsing genome annotation gff3 more efficiently fetches genomic regions and skips (with warning) unrecognized features

## [0.1.2] 2018-08-29

### Added

- Popovers for genemodels

### Fixed

- Searching and dropdown queries no longer conflict

### Changed

- Orthogroup trees are now stored as text and parsed into an object in the browser, since some trees are too big to fit into MongoDB as objects.
- During the adding of annotations, corresponding sequences are loaded one-by-one in stead of all at once. This fixes memory issues for large genomes.

## [0.1.1] 2018-08-02

### Added

- Executable to add Orthofinder phylogenetic trees (`genenotebook add orthogroups`)

### Fixed

- Ability to unselect default gene attribute columns in GeneTable view
- Scanning gene attributes in the admin section now also removes old/unused attributes

## 0.1.0 - 2018-07-25

### Added

- First GeneNoteBook version ready for use

[unreleased]: https://github.com/genenotebook/genenotebook/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/genenotebook/genenotebook/compare/v0.1.16...v0.2.0
[0.1.16]: https://github.com/genenotebook/genenotebook/compare/v0.1.15...v0.1.16
[0.1.15]: https://github.com/genenotebook/genenotebook/compare/v0.1.14...v0.1.15
[0.1.14]: https://github.com/genenotebook/genenotebook/compare/v0.1.13...v0.1.14
[0.1.13]: https://github.com/genenotebook/genenotebook/compare/v0.1.12...v0.1.13
[0.1.12]: https://github.com/genenotebook/genenotebook/compare/v0.1.11...v0.1.12
[0.1.11]: https://github.com/genenotebook/genenotebook/compare/v0.1.10...v0.1.11
[0.1.10]: https://github.com/genenotebook/genenotebook/compare/v0.1.9...v0.1.10
[0.1.9]: https://github.com/genenotebook/genenotebook/compare/v0.1.8...v0.1.9
[0.1.8]: https://github.com/genenotebook/genenotebook/compare/v0.1.7...v0.1.8
[0.1.7]: https://github.com/genenotebook/genenotebook/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/genenotebook/genenotebook/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/genenotebook/genenotebook/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/genenotebook/genenotebook/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/genenotebook/genenotebook/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/genenotebook/genenotebook/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/genenotebook/genenotebook/compare/v0.1.0...v0.1.1
