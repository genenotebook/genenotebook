# GeneNoteBook Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html)

## [Unreleased]
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
- Adding Interproscan gff3 (```genenotebook add interproscan```)
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
- Executable to add Orthofinder phylogenetic trees (```genenotebook add orthogroups```)

### Fixed
- Ability to unselect default gene attribute columns in GeneTable view
- Scanning gene attributes in the admin section now also removes old/unused attributes

## 0.1.0 - 2018-07-25
### Added
- First GeneNoteBook version ready for use

[Unreleased]: https://github.com/genenotebook/genenotebook/compare/v0.1.6...HEAD
[0.1.6]: https://github.com/genenotebook/genenotebook/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/genenotebook/genenotebook/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/genenotebook/genenotebook/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/genenotebook/genenotebook/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/genenotebook/genenotebook/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/genenotebook/genenotebook/compare/v0.1.0...v0.1.1
