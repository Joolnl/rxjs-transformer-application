import * as ts from 'typescript';
import v5 = require('uuid/v5');

interface Metadata {
    identifier?: string;
    uuid: string,
    file: string;
    line: number;
    operator?: string;
}

const observableMetadata = new Map<string, Metadata>();

// Generate unique id from seed: filename and line.
const generateId = (filename: string, line: number): string => {
    const uuid = v5(`${filename}${line}`, 'e01462c8-517f-11ea-8d77-2e728ce88125');
    return uuid;
};

// Extract metadata from given call expression.
export const extractMetaData = (expression: ts.CallExpression): Metadata => {
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

// For Observable expression register metadata.
export const registerObservableMetadata = (observable: ts.CallExpression, operator: string): void => {
    try {
        const metadata = extractMetaData(observable);
        observableMetadata.set(metadata.identifier, { operator, ...metadata });
    } catch (error) {
        throw error;
    }
};

// Get metadata of epxressions subscribtion.
export const getObservableMetadata = (node: ts.CallExpression): Metadata => {
    const observableIdentifier = node.getChildren()
        .filter(n => ts.isPropertyAccessExpression(n))
        .map((n: ts.PropertyAccessExpression) => n.expression.getText())
        .pop();

    if (!observableIdentifier) {
        throw new Error('No observable identifier found in node! Possible anonymous observable?');
    }

    return observableMetadata.get(observableIdentifier);
};
