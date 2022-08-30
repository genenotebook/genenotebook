const parseNewick = (newickString) => {
  // Adapted from Jason Davies https://github.com/jasondavies/newick.js
  const ancestors = [];
  const tokens = newickString.split(/\s*(;|\(|\)|,|:)\s*/);
  const geneIds = [];
  let tree = {};
  let subtree = {};
  let nNodes = 0;
  tokens.forEach((token, tokenIndex) => {
    switch (token) {
      case '(': // new subtree (children of current tree)
        subtree = {};
        tree.children = [subtree];
        ancestors.push(tree);
        tree = subtree;
        break;
      case ',': // another branch
        subtree = {};
        ancestors[ancestors.length - 1].children.push(subtree);
        tree = subtree;
        break;
      case ')': // optional name next
        tree = ancestors.pop();
        break;
      case ':': // optional length next
        break;
      default:
        const previousToken = tokens[tokenIndex - 1];
        if (previousToken === '(' || previousToken === ')' || previousToken === ',') {
          tree.name = token;
          nNodes += 1;
          if (token.length > 0) {
            geneIds.push(token);
          }
        } else if (previousToken === ':') {
          tree.branchLength = parseFloat(token);
        }
    }
  });
  return {
    tree,
    geneIds,
    size: 0.5 * (nNodes + 1), // geneIds.length
  };
};

export {parseNewick}
