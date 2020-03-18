import * as ts from 'typescript';
import {
    createWrapCreationExpression, wrapSubscribeMethod,
    wrapPipeStatement, wrapAnonymousPipeStatement
} from './operator_wrapper';

const rxjsCreationOperators = ['ajax', 'bindCallback', 'bindNodeCallback', 'defer', 'empty', 'from', 'fromEvent',
    'fromEventPattern', 'generate', 'interval', 'of', 'range', 'throwError', 'timer', 'iif'];

type NodeType = 'UNCLASSIFIED' | 'RXJS_CREATION_OPERATOR' | 'RXJS_JOIN_CREATION_OPERATOR' | 'RXJS_PIPE_OPERATOR' |
    'RXJS_PIPE_EXPR_STMT' | 'RXJS_PIPE_VAR_STMT' | 'RXJS_SUBSCRIBE';

// Determine if given node is RxJS Creation Operator Statement.
const isRxJSCreationOperator = (node: ts.Node): [boolean, string] => {
    try {
        if (!ts.isCallExpression(node)) {
            return [false, null];
        }

        const operator = rxjsCreationOperators
            .filter(o => o === node.expression.getText())
            .pop();

        return operator ? [true, operator] : [false, null];
    } catch (e) {
        // console.log(e);
        return [false, null];
    }
};

// Determine if given node is given method call.
const isMethodCall = (node: ts.Node, method: string): boolean => {
    try {
        if (!ts.isCallExpression(node)) {
            return false;
        }

        const result = node.getChildren()
            .filter(child => ts.isPropertyAccessExpression(child))
            .filter((child: ts.PropertyAccessExpression) => child.name.getText() === method);

        return result.length ? true : false;
    } catch (e) {
        return false;
    }
};

// Check if node is pipe property access expression.
const isPipePropertyAccessExpr = (node: ts.Node): boolean => {
    if (ts.isPropertyAccessExpression(node)) {
        return node.name.getText() === 'pipe' ? true : false;
    }

    return false;
};

// Determine if given node is RxJS Subscribe Statement.
const isSubscribeStatement = (node: ts.Node): boolean => isMethodCall(node, 'subscribe');

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

    if (isPipePropertyAccessExpr(node)) {
        if (ts.isVariableDeclaration(node.parent.parent)) {
            classification = 'RXJS_PIPE_VAR_STMT';
        } else {
            classification = 'RXJS_PIPE_EXPR_STMT';
        }
    }

    isSubscribeStatement(node) && (classification = 'RXJS_SUBSCRIBE');

    return [classification, importStatement];
};

// TODO: split RXJS_PIPE_OPERATOR in RXJS_PIPE_EXPR_STMT en RXJS_PIPE_VAR_STMT
// Transforms node if necassary, returns original or transformed node along required import statement.
export const dispatchNode = (node: ts.Node): [ts.Node, string | null] => {
    const [nodeType, importStatement] = classify(node);

    switch (nodeType) {
        case 'UNCLASSIFIED':
            // Unclassified, not transforming.
            break;
        case 'RXJS_CREATION_OPERATOR':
            node = createWrapCreationExpression(node as ts.CallExpression);
            break;
        case 'RXJS_PIPE_VAR_STMT':
            node = wrapPipeStatement(node as ts.PropertyAccessExpression);
            break;
        case 'RXJS_PIPE_EXPR_STMT':
            node = wrapAnonymousPipeStatement(node as ts.PropertyAccessExpression);
            break;
        case 'RXJS_SUBSCRIBE':
            node = wrapSubscribeMethod(node as ts.CallExpression);
            break;
        default:
            throw new Error('Invalid node classification!');
    }

    return [node, importStatement];
};
