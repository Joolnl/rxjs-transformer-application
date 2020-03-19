import * as ts from 'typescript';
import { createWrapCreationExpression, wrapSubscribeMethod, wrapPipeStatement } from './operator_wrapper';

const rxjsCreationOperators = ['ajax', 'bindCallback', 'bindNodeCallback', 'defer', 'empty', 'from', 'fromEvent',
    'fromEventPattern', 'generate', 'interval', 'of', 'range', 'throwError', 'timer', 'iif'];

type NodeType = 'UNCLASSIFIED' | 'RXJS_CREATION_OPERATOR' | 'RXJS_JOIN_CREATION_OPERATOR' |
    'RXJS_PIPE_EXPR_STMT' | 'RXJS_PIPE_VAR_DECL' | 'RXJS_SUBSCRIBE';

// Determine if given node is RxJS Creation Operator Statement.
const isRxJSCreationOperator = (node: ts.Node): boolean => {
    try {
        if (ts.isCallExpression(node)) {
            if (rxjsCreationOperators.some(operator => operator === node.expression.getText())) {
                return true;
            }
        }
    } catch (e) {
        return false;
    }
    return false;
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
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        return node.expression.name.getText() === 'pipe' ? true : false;
    }
    return false;
};

// Determine if given node is RxJS Subscribe Statement.
const isSubscribeStatement = (node: ts.Node): boolean => isMethodCall(node, 'subscribe');

// Classify given node, return node classification.
const classify = (node: ts.Node): NodeType => {
    let classification: NodeType = 'UNCLASSIFIED';

    if (isRxJSCreationOperator(node)) {
        classification = 'RXJS_CREATION_OPERATOR';
    }

    if (isPipePropertyAccessExpr(node)) {
        if (ts.isVariableDeclaration(node.parent)) {
            classification = 'RXJS_PIPE_VAR_DECL';
        } else {
            classification = 'RXJS_PIPE_EXPR_STMT';
        }
    }

    if (isSubscribeStatement(node)) {
        classification = 'RXJS_SUBSCRIBE';
    }

    return classification;
};

// Transforms node if necassary, returns original or transformed node along required import statement.
export const dispatchNode = (node: ts.Node): [ts.Node, string | null] => {
    const nodeType = classify(node);

    switch (nodeType) {
        case 'UNCLASSIFIED':
            return [node, null];
        case 'RXJS_CREATION_OPERATOR':
            node = createWrapCreationExpression(node as ts.CallExpression);
            return [node, 'wrapCreationOperator'];
        case 'RXJS_PIPE_VAR_DECL':
            node = wrapPipeStatement(node as ts.CallExpression, false);
            return [node, 'wrapPipe'];
        case 'RXJS_PIPE_EXPR_STMT':
            node = wrapPipeStatement(node as ts.CallExpression, true);
            return [node, 'wrapPipe'];
        case 'RXJS_SUBSCRIBE':
            node = wrapSubscribeMethod(node as ts.CallExpression);
            return [node, 'wrapSubscribe'];
        default:
            throw new Error('Invalid node classification!');
    }
};
