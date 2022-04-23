# GeneNoteBook Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html)

## [Unreleased]

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
