// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as Parser from "web-tree-sitter";
import * as path from "path";
import * as child_process from "child_process";

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from "vscode-languageclient";

const RUST_WASM_MODULE = "tree-sitter-rust";
const RUST_HOVER_SCHEME = { language: "rust", scheme: "file" };
const PROVIDED_LESSONS: Record<string, string> = {
  try_expression: "This is some crazy-ass Result-unwrapping magic",
  type_arguments: "These angle-y bois aren't HTML, we promise (see: JSX.rs)",
  generic_type: "This type isn't basic... it's just generic",
  unit_type: "This type is an absolute UNIT"
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  console.log("Initializing learn extension...");

  // block on parser initialization from WASM
  await Parser.init(); // TODO: double-check that this doesn't crash, as the tree-sitter extension suggests

  // load Rust language module
  const absoluteRustPath = path.join(
    context.extensionPath,
    "parsers",
    `${RUST_WASM_MODULE}.wasm`
  );
  const Rust = await Parser.Language.load(absoluteRustPath); // TODO: cache these parsers between files or init on workspace open
  const parser = new Parser();

  // set Rust as standard tree-sitter language module
  parser.setLanguage(Rust);

  // TODO: this should probably be constrained a bit
  function getTree(document: any) {
    // TODO: investigate getText vs Parser.input()

    // parse tree of given document
    return parser.parse(document.getText());
  }

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const parseFile = vscode.commands.registerCommand(
    "extension.parseFile",
    () => {
      // register the hover action for Rust files
      vscode.languages.registerHoverProvider(RUST_HOVER_SCHEME, {
        provideHover(document, { line: row, character: column }, token) {
          const tree = getTree(document);
          
          // TODO: check and refine this "parent" assumption
          const { parent } = tree.rootNode.descendantForPosition({ row, column });

          if(parent) {
            let { nodeType } = parent.walk();

            return new vscode.Hover(PROVIDED_LESSONS[nodeType] || "")
          }

          return null;
        }
      });

      // Display a message box to the user
      vscode.window.showInformationMessage(
        "A hover provider was registered for Rust files"
      );
    }
  );

  spawnRustLSP();
  context.subscriptions.push(parseFile);
}

async function spawnRustLSP() {
  const rlsPath = "rls";

  // TODO: actually get the current workspace folder
  // const cwd = workspace.getWorkspaceFolder
  const cwd = "/home/nik/Code";
  let env = {};

  const serverOptions: ServerOptions = async () => {
    let childProcess: child_process.ChildProcess;

    childProcess = child_process.spawn(rlsPath, [], {
      env,
      cwd,
      shell: true
    });

    childProcess.on("error", (err: { code?: string; message: string }) => {
      if (err.code === "ENOENT") {
        console.error(`Could not spawn RLS: ${err.message}`);
        vscode.window.showWarningMessage(
          `Could not spawn RLS: \`${err.message}\``
        );
      }
    });
    return childProcess;
  };

  const pattern = `${cwd}/**`;

  const clientOptions: LanguageClientOptions = {
    // Register the server for Rust files

    documentSelector: [
      { language: "rust", scheme: "file", pattern },
      { language: "rust", scheme: "untitled", pattern }
    ],
    /*diagnosticCollectionName: collectionName,*/
    synchronize: { configurationSection: "rust" },
    // Controls when to focus the channel rather than when to reveal it in the drop-down list
    /*revealOutputChannelOn: this.config.revealOutputChannelOn,*/
    initializationOptions: {
      omitInitBuild: true,
      cmdRun: true
    }
    /*workspaceFolder: cwd,*/
  };

  let client = new LanguageClient(
    "languageServerExample",
    "Language Server Example",
    serverOptions,
    clientOptions
  );

  console.log("Client is: ", client);
}

// this method is called when your extension is deactivated
export function deactivate() {}
