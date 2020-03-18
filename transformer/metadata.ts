import * as ts from 'typescript';
import * as v5 from 'uuid/v5';

export interface ObservableMetadata {
    uuid: string;
    type?: string;
    identifier: string;
    file: string;
    line: number;
}

export interface MetadataDeprecated {
    identifier?: string;
    uuid: string;
    file: string;
    line: number;
    operator?: string;
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

type PipeObservablePair = [string, string];
const observableMap = new FileMap<ObservableMetadata>();
const operatorMap = new FileMap<PipeObservablePair>();

// Generate unique id from seed: filename and line.
const generateId = (filename: string, line: number): string => {
    const uuid = v5(`${filename}${line}`, 'e01462c8-517f-11ea-8d77-2e728ce88125');
    return uuid;
};

// Extract metadata from given call expression.
export const extractMetadata = (expression: ts.CallExpression): ObservableMetadata => {
    const line = expression.getSourceFile().getLineAndCharacterOfPosition(expression.getStart()).line;
    const file = expression.getSourceFile().fileName;
    const uuid = generateId(file, line);
    let identifier: string;

    if (ts.isVariableDeclaration(expression.parent)) {
        const variableDeclaration: ts.VariableDeclaration = expression.parent;
        identifier = variableDeclaration.name.getText();
    }

    return { line, file, uuid, identifier };
};

// TODO: registering under only identifier might bug with two likely named identifiers in seperate files.
// For Observable expression register metadata.
export const registerObservableMetadata = (observable: ts.CallExpression, operator: string): void => {
    try {
        const metadata = extractMetadata(observable);
        const identifier = metadata.identifier;
        console.log(`registering observable ${metadata.identifier} ${metadata.uuid}`);
        observableMap.set(identifier, metadata.file, { type: operator, ...metadata });

    } catch (error) {
        throw error;
    }
};

const createProperty = (name: string, value: any) => ts.createPropertyAssignment(name, ts.createLiteral(value || ''));

// Create metadata object literal expression from expression and operator.
export const createObservableMetadataExpression = (expression: ts.CallExpression, operator: string): ts.ObjectLiteralExpression => {
    const { line, file, uuid, identifier } = extractMetadata(expression);

    return ts.createObjectLiteral([
        createProperty('uuid', uuid),
        createProperty('type', operator),
        createProperty('identifier', identifier),
        createProperty('file', file),
        createProperty('line', line)
    ]);
};

export const registerPipeIfNotAnonymous = (expression: ts.CallExpression) => {
    const identifier = getIdentifier(expression);
    console.log(`pipe idenfitied ${identifier}`);
}

// TODO: should contain: operator type, function body, observable uuid, file, line
export const createPipeableOperatorMetadataExpression = (expression: ts.CallExpression): ts.ObjectLiteralExpression => {
    const operator = expression.expression.getText();
    const functionBody = expression.arguments.map(arg => arg.getText()).join('');
    const { file, line } = extractMetadata(expression);
    const id = generateId(file, line);
    let observable: string;
    if (ts.isCallExpression(expression.parent)) {
        if (ts.isPropertyAccessExpression(expression.parent.expression)) {
            const identifier = expression.parent.expression.expression.getText();
            try {
                observable = observableMap.get(identifier, file).uuid;
            } catch (e) {
                observable = 'anonymous';
            }
        }
    }

    return ts.createObjectLiteral([
        createProperty('type', operator),
        createProperty('function', functionBody),
        createProperty('observable', observable),
        createProperty('pipe', id),
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
    const observable = observableMap.get(identifier, file);
    const uuid = observable ? observable.uuid : 'anonymous';
    // console.log(`identifier ${identifier} observable ${uuid}`);
    // console.log(`expression ${node.expression.getText()}`);
};
