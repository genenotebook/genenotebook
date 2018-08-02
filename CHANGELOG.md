# GeneNoteBook Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html)

## [Unreleased]
### Changed
- Orthogroup trees are now stored as text and parsed to an object in the browser, since some trees are too big to fit into MongoDB as objects.

## [0.1.1]
### Added
- Executable to add Orthofinder phylogenetic trees (```genenotebook add orthogroups```)

### Fixed
- Ability to unselect default gene attribute columns in GeneTable view
- Scanning gene attributes in the admin section now also removes old/unused attributes

## 0.1.0 - 2018-07-27
### Added
- First GeneNoteBook version ready for use

[Unreleased]: https://github.com/genenotebook/genenotebook/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/genenotebook/genenotebook/compare/v0.1.0...v0.1.1
