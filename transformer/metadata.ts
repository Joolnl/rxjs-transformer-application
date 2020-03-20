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

export interface MetadataDeprecated {
    identifier?: string;
    uuid: string;
    file: string;
    line: number;
    operator?: string;
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
    function: string;
    observable: string;
    pipe: string;
    file: string;
    line: number;
}

export interface SubscriberMetadata {
    observable: string;
    file: string;
    line: number;
}

// For storing data by identifier and file origin.
class FileMap<T> {
    private data: Map<string, T>;
    constructor() {
        this.data = new Map<string, T>();
    }

    private key = (identifier: string, file: string) => identifier + file;

    get = (identifier: string, file: string) => {
        return this.data.get(this.key(identifier, file));
    }

    set = (identifier: string, file: string, data: T) => {
        this.data.set(this.key(identifier, file), data);
    }
}

// Store data by file, line and pos.
class NodeMap<T> {
    private data: Map<string, T>;
    constructor() {
        this.data = new Map<string, T>();
    }

    private key = (file: string, line: number, pos: number) => file + line + pos;

    get = (file: string, line: number, pos: number) => {
        return this.data.get(this.key(file, line, pos));
    }

    set = (file: string, line: number, pos: number, data: T) => {
        this.data.set(this.key(file, line, pos), data);
    }
}

interface PipeInfo {
    pipeUUID: string;
    observableUUID: string;
}

const observableMapDeprecated = new FileMap<ObservableMetadata>();
// const pipeMap = new FileMap<PipeInfo>();

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

// // Map named pipe to named observable if both non-anonymous.
// export const registerPipe = (pipeUUID: string, pipeIdentifier: string, node: ts.CallExpression) => {
//     if (ts.isVariableDeclaration(node.parent)) {
//         const file = node.getSourceFile().getText();
//         const observableIdentifier = node.parent.name.getText();
//         const observable = observableMapDeprecated.get(observableIdentifier, file);
//         if (observable) {
//             console.log('Registering pipe inside metadata');
//             const pipeInfo = { pipeUUID, observableUUID: observable.uuid };
//             pipeMap.set(pipeIdentifier, file, pipeInfo);
//         }
//     }
// };

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
): [ts.ObjectLiteralExpression, string] => {
    const { file, line, pos } = extractMetadata(identifier);
    const uuid = generateId(file, line, pos);
    const observableMetadata = extractMetadata(getObservable(node));
    const observableUUID = generateId(observableMetadata.file, observableMetadata.line, observableMetadata.pos);

    const objectLiteral = ts.createObjectLiteral([
        createProperty('uuid', uuid),
        createProperty('observable', observableUUID),
        createProperty('identifier', variableName),
        createProperty('file', file),
        createProperty('line', line)
    ]);

    return [objectLiteral, uuid];
};


// export const createPipeMetadataExpressionDeprecated = (node: ts.CallExpression, identifier: string, uuid: string): ts.ObjectLiteralExpression => {
//     const { line, file } = extractMetadata(node);
//     const { file: observableFile, line: observableLine, pos: observablePos } = extractMetadata(getObservable(node).parent as ts.CallExpression);
//     const observable = generateId(observableFile, observableLine, observablePos);
//     console.log(`observable ${observable}`);

//     let observableUUID: string;
//     if (ts.isPropertyAccessExpression(node.expression)) {   // TODO: there might be more nodes between pipe and original observable?
//         const observableIdentifier = node.expression.expression.getText();
//         const observable = observableMapDeprecated.get(observableIdentifier, file);
//         if (observable) {
//             observableUUID = observable.uuid;
//         }
//     } else if (identifier) {
//         const pipeInfo = pipeMap.get(identifier, file);
//         if (pipeInfo) {
//             observableUUID = pipeInfo.observableUUID;
//         }
//     }

//     return ts.createObjectLiteral([
//         createProperty('uuid', uuid),
//         createProperty('observable', observableUUID),
//         createProperty('identifier', identifier),
//         createProperty('file', file),
//         createProperty('line', line)
//     ]);
// };

// Create operator metadata object literal.
export const createPipeableOperatorMetadataExpression = (node: ts.CallExpression, pipeIdentifier: string): ts.ObjectLiteralExpression => {
    const operator = node.expression.getText();
    const functionBody = node.arguments.map(arg => arg.getText()).join('');
    const { file, line } = extractMetadata(node);

    let observable: string;
    if (ts.isCallExpression(node.parent) && ts.isPropertyAccessExpression(node.parent.expression)) {
        const identifier = node.parent.expression.expression.getText();
        const observableObject = observableMapDeprecated.get(identifier, file);
        observable = observableObject ? observableObject.uuid : 'anonymous';
    }

    return ts.createObjectLiteral([
        createProperty('type', operator),
        createProperty('function', functionBody),
        createProperty('observable', observable),
        createProperty('pipe', pipeIdentifier),
        createProperty('file', file),
        createProperty('line', line)
    ]);
};

const getIdentifier = (node: ts.Expression): string => {
    if (ts.isCallExpression(node) || ts.isPropertyAccessExpression(node)) {
        return getIdentifier(node.expression as ts.Expression);
    }
    return node.getText();
};

export const createSubscriberMetadataExpression = (node: ts.CallExpression): void => {
    const identifier = getIdentifier(node);
    const { file, line } = extractMetadata(node);
    const observable = observableMapDeprecated.get(identifier, file);
    const uuid = observable ? observable.uuid : 'anonymous';
    // console.log(`identifier ${identifier} observable ${uuid}`);
    // console.log(`expression ${node.expression.getText()}`);
};
