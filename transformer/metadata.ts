import * as ts from 'typescript';
import * as v5 from 'uuid/v5';

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
    file: string;
    line: number;
}

const observableMetadata = new Map<string, MetadataDeprecated>();

// Generate unique id from seed: filename and line.
const generateId = (filename: string, line: number): string => {
    const uuid = v5(`${filename}${line}`, 'e01462c8-517f-11ea-8d77-2e728ce88125');
    return uuid;
};

// Extract metadata from given call expression.
export const extractMetadata = (expression: ts.CallExpression): MetadataDeprecated => {
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
        observableMetadata.set(metadata.identifier, { operator, ...metadata });
    } catch (error) {
        throw error;
    }
};

// Get metadata of epxressions subscribtion.
export const getObservableMetadata = (node: ts.CallExpression): MetadataDeprecated => {
    const observableIdentifier = node.getChildren()
        .filter(n => ts.isPropertyAccessExpression(n))
        .map((n: ts.PropertyAccessExpression) => n.expression.getText())
        .pop();

    if (!observableIdentifier) {
        throw new Error('No observable identifier found in node! Possible anonymous observable?');
    }

    return observableMetadata.get(observableIdentifier);
};

// Create metadata object literal expression from expression and operator.
export const createObservableMetadataExpression = (expression: ts.CallExpression, operator: string): ts.ObjectLiteralExpression => {
    const { line, file, uuid, identifier } = extractMetadata(expression);

    const uuidProperty = ts.createPropertyAssignment('uuid', ts.createLiteral(uuid));
    const fileProperty = ts.createPropertyAssignment('file', ts.createLiteral(file));
    const lineProperty = ts.createPropertyAssignment('line', ts.createNumericLiteral(line.toString()));
    const operatorProperty = ts.createPropertyAssignment('operator', ts.createLiteral(operator));
    const identifierProperty = ts.createPropertyAssignment('identifier', ts.createLiteral(identifier || ''));
    const metadata = ts.createObjectLiteral([uuidProperty, fileProperty, lineProperty, operatorProperty, identifierProperty]);

    return metadata;
};

// TODO: should contain: operator type, function body, observable uuid, file, line
export const createPipeableOperatorMetadataExpression = (expression: ts.CallExpression): ts.ObjectLiteralExpression => {
    const operator = expression.expression.getText();
    const functionBody = expression.arguments.map(arg => arg.getText()).join('');
    
    let observable: string;
    if (ts.isCallExpression(expression.parent)) {
        const { uuid } = extractMetadata(expression.parent);
        observable = uuid;
    }

    const { file, line } = extractMetadata(expression);

    console.log(`operator ${operator} functionBody ${functionBody} observable ${observable} file ${file} line ${line}`);

    const createProperty = (name: string, value: any) => ts.createPropertyAssignment(name, ts.createLiteral(value || ''));

    return ts.createObjectLiteral([
        createProperty('type', operator),
        createProperty('function', functionBody),
        createProperty('observable', observable),
        createProperty('file', file),
        createProperty('line', line)
    ]);
};