// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as Parser from 'web-tree-sitter';
import * as path from 'path';


const RUST_WASM_MODULE = 'tree-sitter-rust';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
        console.log('Initializing learn extension...');
        
        // block on parser initialization from WASM
        await Parser.init(); // TODO: double-check that this doesn't crash, as the tree-sitter extension suggests 

        // load Rust language module 
        const absoluteRustPath = path.join(context.extensionPath, 'parsers', `${RUST_WASM_MODULE}.wasm`);
        const Rust = await Parser.Language.load(absoluteRustPath); // TODO: cache these parsers between files or init on workspace open
        const parser = new Parser();

        // set Rust as standard tree-sitter language module
        parser.setLanguage(Rust);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let parseFile = vscode.commands.registerCommand('extension.parseFile', () => {
		// The code you place here will be executed every time your command is executed

                // get the parsed syntax trees
                const trees = vscode.window.visibleTextEditors.map(
                  editor => parser.parse(editor.document.getText())
                ); // TODO: investigate getText vs Parser.input()

                // do something with the parsed syntax trees
                console.log('parse tree->', trees.map(tree => tree.rootNode.toString()));

		// Display a message box to the user
		vscode.window.showInformationMessage('A file parse happened!');
	});

	context.subscriptions.push(parseFile);
}

// this method is called when your extension is deactivated
export function deactivate() {}
