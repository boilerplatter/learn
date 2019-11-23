import * as vscode from "vscode";
import * as Parser from "web-tree-sitter";
import { capitalize, filter, flatten, flow, get, kebabCase, map, replace, uniqBy } from 'lodash/fp'


const getParent = get('parent.type')

function flattenNodes(root: Parser.SyntaxNode): Parser.SyntaxNode[] {
  return flatten([root, ...root.children.map(flattenNodes)])
}

class Explore implements vscode.Command {
  title: string
  command: string 

  constructor(title: string, command: string) {
    this.title = title
    this.command = command
  }
}

// represents a single concept that appears in the "concepts" tree view
// TODO: open webview of blurb on click
// TODO: add icons and state representing viewed vs un-viewed concepts
class Concept extends vscode.TreeItem {
  command: vscode.Command

  constructor(label: string) {
    const command = `concepts.explore.${kebabCase(label)}`

    super(label)

    vscode.commands.registerCommand(command, () => console.log(`exploring ${label}`))

    this.command = new Explore(label, command)
  }
}

// represents the collection of concepts a user needs to learn for a particular file
export class ConceptProvider implements vscode.TreeDataProvider<Concept> {
  parser: Parser
  snippets: Record<string, any>

  constructor(parser: Parser, snippets: Record<string, any>) {
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
        map(({ title }) => {
          const label = flow(
            replace(/`/g)(''),
            capitalize,
          )(title)

          return new Concept(label)
        }) // TODO: expand Concept mapping a bit
      )(tree)
    }

    return [];
  }
}
