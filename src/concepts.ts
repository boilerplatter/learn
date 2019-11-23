import * as vscode from "vscode";
import * as Parser from "web-tree-sitter";
import * as Markdown from "markdown-it";
import {
  capitalize,
  filter,
  flatten,
  flow,
  get,
  groupBy,
  kebabCase,
  map,
  replace,
  reverse,
  sortBy,
  values
} from "lodash/fp";
import { buildBlurb } from "./helpers";

const getParent = get("parent.type");
const markdown = new Markdown();

function flattenNodes(root: Parser.SyntaxNode): Parser.SyntaxNode[] {
  return flatten([root, ...root.children.map(flattenNodes)]);
}

class Explore implements vscode.Command {
  title: string;
  command: string;

  constructor(title: string, command: string) {
    this.title = title;
    this.command = command;
  }
}

// represents a single concept that appears in the "concepts" tree view
// TODO: add icons and state representing viewed vs un-viewed concepts
// TODO: refresh concepts and webview as the user types
class Concept extends vscode.TreeItem {
  command: vscode.Command;
  handle: vscode.Disposable;

  constructor(label: string, blurb: string) {
    const internalLabel = kebabCase(label);
    const command = `concepts.explore.${internalLabel}`;

    super(label);

    this.handle = vscode.commands.registerCommand(command, () => {
      const panel = vscode.window.createWebviewPanel(
        internalLabel,
        label,
        vscode.ViewColumn.One,
        {}
      );

      panel.webview.html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${label}</title>
        </head>
        <body>
          ${blurb}
        </body>
      </html>
      `;
    });

    this.command = new Explore(label, command);
  }
}

// represents the collection of concepts a user needs to learn for a particular file
export class ConceptProvider implements vscode.TreeDataProvider<Concept> {
  children: Concept[];
  parser: Parser;
  snippets: Record<string, any>;

  private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

  constructor(parser: Parser, snippets: Record<string, any>) {
    this.parser = parser;
    this.snippets = snippets;
    this.children = []

    vscode.workspace.onDidChangeTextDocument(uri => {
      this._onDidChangeTreeData.fire()
    })
  }

  getTreeItem(element: Concept): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Concept) {
    const { activeTextEditor } = vscode.window;

    this.children.forEach(child => child.handle.dispose())

    if (activeTextEditor) {
      const tree = this.parser.parse(activeTextEditor.document.getText());

      this.children = flow(
        get("rootNode"),
        flattenNodes,
        groupBy(getParent),
        values,
        sortBy(nodes => nodes.length),
        reverse,
        map(nodes => this.snippets[getParent(nodes[0])]),
        filter(Boolean),
        map(
          ({
            title,
            example,
            explanation: { text, sourceUrls } = {} as Record<string, any>
          }) => {
            const label = flow(replace(/`/g)(""), capitalize)(title);
            const { value: rawBlurb } = buildBlurb(title, text, sourceUrls);
            const rawBlurbWithExample = example ? `${rawBlurb}\n\n **Example:** ${example}\n` : rawBlurb;
            const blurb = markdown.render(rawBlurbWithExample);

            return new Concept(label, blurb);
          }
        )
      )(tree);
    } else {
      this.children = []
    }

    return this.children;
  }
}
