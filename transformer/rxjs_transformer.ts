import * as ts from 'typescript';
import { dispatchNode } from './node_dispatcher';

// Add import to given SourceFile.
// format: import importname as alias from file
const addNamedImportToSourceFile = (rootNode: ts.SourceFile, importName: string, alias: string, file: string): ts.SourceFile => {
  return ts.updateSourceFileNode(rootNode,
    [ts.createImportDeclaration(
        /*decorators*/undefined,
        /*modifiers*/ undefined,
      ts.createImportClause(
        undefined,
        ts.createNamedImports([ts.createImportSpecifier(ts.createIdentifier(`${importName}`), ts.createIdentifier(`${alias}`))])
      ),
      ts.createLiteral(`${file}`)
    ), ...rootNode.statements]);
};

// Add array of wrapper functions to given source file node.
const addWrapperFunctionImportArray = (rootNode: ts.SourceFile, operators: string[]): ts.SourceFile => {
  const file = 'src/rxjs_wrapper';
  operators
    .filter(operator => operator !== null)
    .map(operator => rootNode = addNamedImportToSourceFile(rootNode, operator, operator, file));
  return rootNode;
};


// Loops over all nodes, when node matches teststring, replaces the string literal.
export const dummyTransformer = <T extends ts.Node>(context: ts.TransformationContext) => {

  return (rootNode: ts.SourceFile) => {
    if (rootNode.fileName.includes('/rxjs_wrapper.ts')) {
      console.log('\nIgnoring rxjs_wrapper.ts');
      return rootNode;
    }

    const importStatements: Set<string> = new Set();
    function visit(node: ts.SourceFile): ts.SourceFile {

      const realVisit = (node: ts.Node): ts.Node => {
        const [dispatchedNode, wrapperImport] = dispatchNode(node);
        wrapperImport && importStatements.add(wrapperImport);

        return ts.visitEachChild(dispatchedNode, realVisit, context);
      };

      // Add required imports to sourceFile after visitor pattern.
      const root = realVisit(node) as ts.SourceFile;
      // TODO: Optimise imports, now importing these three every file.
      return addWrapperFunctionImportArray(root, ['sendEventToBackpage', 'wrapPipeableOperator', ...Array.from(importStatements)]);
    }

    return ts.visitNode(rootNode, visit);
  };
};
