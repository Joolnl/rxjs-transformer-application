import * as ts from 'typescript';

const isTestString = node => {
  return node === `'TESTSTRING'`;
};

const createStringLiteral = () => {
  console.log('\ncreating new literal\n');
  return ts.createStringLiteral('!@#$%#$%');
}


// Loops over all nodes, when node matches teststring, replaces the string literal.
export const dummyTransformer = <T extends ts.Node>(context: ts.TransformationContext) => {
  return (rootNode: ts.SourceFile) => {

    function visit(node: ts.Node): ts.Node {

      return isTestString(node.getText())
        // ? ts.visitEachChild(createStringLiteral(), visit, context)
        ? createStringLiteral()
        : ts.visitEachChild(node, visit, context);
      // return ts.visitEachChild(node, visit, context);
    }
    return ts.visitNode(rootNode, visit);
  };
};
