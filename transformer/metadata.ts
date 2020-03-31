import * as ts from 'typescript';
import * as v5 from 'uuid/v5';

export interface ObservableMetadata {
    uuid: string;
    type?: string;
    identifier: string;
    file: string;
    line: number;
    pos?: number;
}

export interface PipeMetadata {
    uuid: string;
    observable: string;
    identifier?: string;
    file: string;
    line: number;
}

export interface PipeableOperatorMetadata {
    type: string;
    uuid: string;
    function: string;
    observable: string;
    pipe: string;
    file: string;
    line: number;
}

export interface SubscriberMetadata {
    observable: string;
    pipes: Array<string>;
    func: string;
    file: string;
    line: number;
}

const namedPipes = new Map<string, string>();

// Generate unique id from seed: filename, line and pos.
const generateId = (filename: string, line: number, pos: number): string => {
    const uuid = v5(`${filename}${line}${pos}`, 'e01462c8-517f-11ea-8d77-2e728ce88125');
    return uuid;
};

// Extract metadata from given call expression.
export const extractMetadata = (node: ts.Expression): { file: string, line: number, pos: number } => {
    const file = node.getSourceFile().fileName;
    const line = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line;
    const pos = node.pos;
    return { file, line, pos };
};

const createProperty = (name: string, value: any) => ts.createPropertyAssignment(name, ts.createLiteral(value || ''));

// Create metadata object literal expression from expression and operator.
export const createObservableMetadataExpression = (node: ts.Identifier, variableName: string): ts.ObjectLiteralExpression => {
    const { file, line, pos } = extractMetadata(node);
    const uuid = generateId(file, line, pos);

    return ts.createObjectLiteral([
        createProperty('uuid', uuid),
        createProperty('type', node.getText()),
        createProperty('identifier', variableName),
        createProperty('file', file),
        createProperty('line', line)
    ]);
};

// Traverse tree until observable is found.
const getObservable = (node: ts.Expression): ts.Identifier => {
    if (ts.isPropertyAccessExpression(node) || ts.isCallExpression(node)) {
        return getObservable(node.expression);
    } else if (ts.isIdentifier(node)) {
        return node;
    } else {
        throw new Error('No Observable found!');
    }
};

// Create pipe metadata object literal.
export const createPipeMetadataExpression = (
    node: ts.CallExpression,
    identifier: ts.Identifier,
    variableName: string
): [ts.ObjectLiteralExpression, string, string] => {
    const { file, line, pos } = extractMetadata(identifier);
    const uuid = generateId(file, line, pos);
    const observableMetadata = extractMetadata(getObservable(node));
    const observableUUID = generateId(observableMetadata.file, observableMetadata.line, observableMetadata.pos);

    if (variableName !== 'anonymous') {
        namedPipes.set(variableName, uuid);
    }

    const objectLiteral = ts.createObjectLiteral([
        createProperty('uuid', uuid),
        createProperty('observable', observableUUID),
        createProperty('identifier', variableName),
        createProperty('file', file),
        createProperty('line', line)
    ]);

    return [objectLiteral, uuid, observableUUID];
};

// Create operator metadata object literal.
export const createPipeableOperatorMetadataExpression = (
    node: ts.CallExpression,
    operatorUUID: string,
    pipeUUID: string,
    observableUUID: string
): ts.ObjectLiteralExpression => {
    const operator = node.expression.getText();
    const functionBody = node.arguments.map(arg => arg.getText()).join('');
    const { file, line } = extractMetadata(node);

    return ts.createObjectLiteral([
        createProperty('type', operator),
        createProperty('uuid', operatorUUID),
        createProperty('function', functionBody),
        createProperty('observable', observableUUID),
        createProperty('pipe', pipeUUID),
        createProperty('file', file),
        createProperty('line', line)
    ]);
};

interface Pipe {
    node: ts.Identifier;
    anonymous: boolean;
}

// Recursively get all pipes a subscribe belongs to. 0...n
const getPipeArray = (node: ts.Expression, pipes?: Array<Pipe>): Array<Pipe> => {
    const result: Array<Pipe> = pipes ? pipes : [];
    if (ts.isPropertyAccessExpression(node) || ts.isCallExpression(node)) {
        if (ts.isPropertyAccessExpression(node) && node.name.getText() === 'pipe') {
            result.push({ node: node.name, anonymous: true });
        } else if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.name.getText() === 'subscribe') {
            result.push({ node: node.expression, anonymous: false });
        }

        return getPipeArray(node.expression, result);
    }
    return result;
};

// Create subscribe metadata object literal.
export const createSubscriberMetadataExpression = (node: ts.CallExpression): ts.ObjectLiteralExpression => {
    const { file, line } = extractMetadata(node);
    const observableMetadata = extractMetadata(getObservable(node));
    const observableUUID = generateId(observableMetadata.file, observableMetadata.line, observableMetadata.pos);

    const pipes = getPipeArray(node);
    // Generate UUID for anonymous pipes.
    const anonymousPipes = pipes
        .filter(pipe => pipe.anonymous)
        .map(pipe => pipe.node)
        .map(pipeNode => extractMetadata(pipeNode))
        .map(metadata => generateId(metadata.file, metadata.line, metadata.pos));

    // Fetch already generated UUID's for non-anonymous pipes.
    const nonAnonymousPipes = pipes
        .filter(pipe => !pipe.anonymous)
        .map(pipe => pipe.node)
        .map(pipeNode => pipeNode.getText())
        .map(pipeName => namedPipes.get(pipeName));

    return ts.createObjectLiteral([
        createProperty('observable', observableUUID),
        ts.createPropertyAssignment('pipes',
            ts.createArrayLiteral([...anonymousPipes.concat(nonAnonymousPipes).map(pipe => ts.createStringLiteral(pipe))])
        ),
        createProperty('function', 'testFn'),
        createProperty('file', file),
        createProperty('line', line)
    ]);
};
