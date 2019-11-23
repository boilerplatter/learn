import * as vscode from "vscode";
import * as Parser from "web-tree-sitter";
import { filter, flatten, flow, get, map, uniqBy } from 'lodash/fp'

const getParent = get('parent.type')

function flattenNodes(root: Parser.SyntaxNode): Parser.SyntaxNode[] {
  return flatten([root, ...root.children.map(flattenNodes)])
}

// represents a single concept that appears in the "concepts" tree view
// TODO: evaluate collapsible state vs markdown or web view (for example)
class Concept extends vscode.TreeItem {}

// represents the collection of concepts a user needs to learn for a particular file
export class ConceptProvider implements vscode.TreeDataProvider<Concept> {
  parser: Parser
  snippets?: any

  constructor(parser: Parser, snippets?: any) {
    this.parser = parser
    this.snippets = snippets
  }

  getTreeItem(element: Concept): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Concept) {
    const { activeTextEditor } = vscode.window;

    if(activeTextEditor) {
      const tree = this.parser.parse(activeTextEditor.document.getText())

      return flow(
        get('rootNode'),
        flattenNodes,
        uniqBy(getParent),
        map(node => this.snippets[getParent(node)]),
        filter(Boolean),
        map(({ title }) => new Concept(title)) // TODO: expand Concept mapping a bit
      )(tree)
    }

    return [];
  }
}
