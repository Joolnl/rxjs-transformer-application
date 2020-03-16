import * as ts from 'typescript';

const rxjsCreationOperators = ['ajax', 'bindCallback', 'bindNodeCallback', 'defer', 'empty', 'from', 'fromEvent',
    'fromEventPattern', 'generate', 'interval', 'of', 'range', 'throwError', 'timer', 'iif'];

type NodeType = 'UNCLASSIFIED' | 'RXJS_CREATION_OPERATOR' | 'RXJS_JOIN_CREATION_OPERATOR' | 'RXJS_PIPE_OPERATOR';

// Determine if given node is RxJS Creation Operator Statement.
const isRxJSCreationOperator = (node: ts.Node): [boolean, string] => {
    if (!ts.isCallExpression(node)) {
        return [false, null];
    }

    const operator = rxjsCreationOperators
        .filter(operator => operator === node.expression.getText())
        .pop();

    return operator ? [true, operator] : [false, null];
};

// Determine if given node is RxJS Pipe Statement.
const isPipeStatement = (node: ts.Node): boolean => {
    if (!ts.isCallExpression(node)) {
        return false;
    }

    const result = node.getChildren()
        .filter(child => ts.isPropertyAccessExpression(child))
        .filter((child: ts.PropertyAccessExpression) => child.name.getText() === 'pipe');

    return result.length ? true : false;
};

// Wrap operator into wrapOperator.
const wrap = (operator: string): string => {
    const capitalized = operator[0].toUpperCase() + operator.slice(1);
    return `wrap${capitalized}`;
};

// Classify given node, return node classification and import statement.
const classify = (node: ts.Node): [NodeType, string | null] => {
    let classification: NodeType = 'UNCLASSIFIED';
    let importStatement = null;

    const [foundCreationOperator, creationOperator] = isRxJSCreationOperator(node);
    if (foundCreationOperator) {
        classification = 'RXJS_CREATION_OPERATOR';
        importStatement = wrap(creationOperator);
    }

    const foundPipeStatement = isPipeStatement(node);
    if (foundPipeStatement) {
        classification = 'RXJS_PIPE_OPERATOR';
    }

    return [classification, importStatement];
};

// Transforms node if necassary, returns original or transformed node along required import statement.
export const dispatchNode = (node: ts.Node): [ts.Node, string | null] => {
    const [nodeType, importStatement] = classify(node);

    nodeType !== 'UNCLASSIFIED' && console.log(`\nnodeType: ${nodeType} importStatement ${importStatement}`);

    switch (nodeType) {
        case 'UNCLASSIFIED':
            break;
        case 'RXJS_CREATION_OPERATOR':
            // node = null;
            break;
        case 'RXJS_PIPE_OPERATOR':
            break;
        default:
            throw new Error('Invalid node classification!');
    };

    return [node, importStatement];
}