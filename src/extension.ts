// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as Parser from "web-tree-sitter";
import * as path from "path";
import * as child_process from "child_process";
import { getOr, keyBy } from "lodash/fp";
import * as nodeTypeHovers from "./data/nodeTypeToConcept.json";
import { existsSync } from "fs";
import { buildBlurb } from "./helpers";
import { ConceptProvider } from "./concepts";

import {
  HoverRequest,
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from "vscode-languageclient";

const RUST_WASM_MODULE = "tree-sitter-rust";
const RUST_HOVER_SCHEME = { language: "rust", scheme: "file" };
const PROVIDED_HOVERS = keyBy("nodeType")(nodeTypeHovers);

async function spawnRustLSP(workspace: any) {
  let rlsPath = "~/.cargo/bin/rls";

  if (!existsSync(rlsPath)) {
    rlsPath = "rls";
  }

  // TODO: validate that first array item exists (altho docs say it always will)
  const cwd = workspace.workspaceFolders[0].uri.fsPath;
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

  return client;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  console.log("Initializing learn extension...");

  let lspClient = await spawnRustLSP(vscode.workspace);
  lspClient.start();
  await lspClient.onReady();
  console.log("Rust lsp server ready.");

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

  // register the hover action for Rust files
  vscode.languages.registerHoverProvider(RUST_HOVER_SCHEME, {
    provideHover(document, { line: row, character: column }, token) {
      const tree = getTree(document);

      // TODO: check and refine this "parent" assumption
      const { parent } = tree.rootNode.descendantForPosition({
        row,
        column
      });

      if (parent) {
        const { nodeType } = parent.walk();
        const {
          title,
          explanation: { text, sourceUrls } = {} as Record<string, any>
        } = getOr({} as any)(nodeType)(PROVIDED_HOVERS as any);

        const entry = buildBlurb(title, text, sourceUrls);

        return new vscode.Hover(entry);
      }

      return null;
    }
  });

  vscode.languages.registerHoverProvider(RUST_HOVER_SCHEME, {
    async provideHover(document, position, token) {
      const lspResponse = await lspClient.sendRequest(
        HoverRequest.type,
        lspClient.code2ProtocolConverter.asTextDocumentPositionParams(
          document,
          position.translate(0, -1)
        ),
        token
      );

      lspClient.protocol2CodeConverter.asHover(lspResponse);

      return null;
    }
  });

  // Build a tree (not a graph!) of concepts for learnin' within a single file
  vscode.window.registerTreeDataProvider(
    "concepts",
    new ConceptProvider(parser, PROVIDED_HOVERS)
  );

  // Display a message box to the user
  vscode.window.showInformationMessage(
    "A hover provider was registered for Rust files"
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
