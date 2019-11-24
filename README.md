# Learn

![learn logo](./docs/learn_logo.png)
![example gif](./docs/screencast-small3.gif)

## Who's it for?

Software devs who want to learn codebases, languages, and frameworks faster.

## What is it?

Learn is a Visual Studio Code extension which takes advantage of a few newer technologies to provide developer learning opportunities where they matter most: directly inline with the codebases and languages you are working on. It helps you stay in the flow of editing and building, while providing you several new ways to traverse the codebase at hand expressly for learning purposes. Since we had 24 hours, we focused on one particular language: Rust, which gives programmers several new mental models and tools for solving problems with code, but which has a (fair) reputation for having a significant learning curve.

### Features

#### Code intelligence based on deep syntax parsing

We use a duo of newer code parsing technologies, language server protocol and tree-sitter, in order to have live references not only to the normal call-site -> definition and docstring navigation most tools come with, but to the actual underlying concrete syntax tree which represents Rust's language constructs and how they compose directly.

This allows us to do things like differentiate reserved keywords from each other (which most code editing tools fail in an epic way at), linking to the higher-level docs which get at the "why" of the language, not just the what. We can also parse, differentiate, and document symbols and operators, of which Rust has notoriously many, and which are often the hardest parts of a language to "just Google." Furthermore, by linking this information to the relatively few syntax types and tokens in the language instead of to individual lines or files of code, we have created documentation which can give you a conceptual overview of any line of code, whether written now or in your product's future.

#### Concept sequencing for acquisition

The higher level of curated conceptual linking that this rich code metadata gives us also enables to capture and order for teaching and acquisition the language mechanisms and concepts which particular codebases and files make use of. With this data, we can provide purpose-built learning tracks which will help you learn just what you need to to understand the code you are looking at, fast.

#### Future: team code curation

All of the above data we have captured in comments, documentary links, and examples which don't just show up at particular lines in the code: they are linked to the underlying concepts and language primitives of Rust, as expressed first in [./src/data/nodeTypeToConcept.json](./src/data/nodeTypeToConcept.json). This is a declarative format, which we intend in future work to attach to tools that let teams capture important codebase- and language-specific knowledge. Instead of sending a teammate to a README or even worse a wiki, this will allow documentation to show up wherever concepts are, as they move around or pop back up in code that doesn't even exist today.

#### (and all the other stuff too)

We have implemented this all in the context of Visual Studio Code, an [increasingly popular tool](https://www.zdnet.com/article/facebook-microsofts-visual-studio-code-is-now-our-default-development-platform/) which provides compatibility with many teams' workflow and preferred toolchains. This is the perfect place to develop Learn into a learning tool for any language or framework, to be able to support every developer or team's personal learning and development workflow.

## Requirements

VSCode. It'll tell you if it's too old. Make sure to install RLS (the CLI and server, but *NOT* the VS Code extension) too: we rely on it as an external dep for some of our code parsing in this proof of concept.

Clone this repo, `cd` into it, and run `yarn && code .` That will download the necessary dependencies and open up an editor with this codebase. If you then run `F5`, you'll launch the extension in a second test instance of Visual Code Studio. Simply navigate that instance to a Rust source file to start trying and developing Learn.

## Anything else?

Thanks, and hit us up at hello@platter.dev if you're interested in collaborating, sharing your stories and wishlist for dev tooling and learning, or just hanging out together in person or online. Cheers!
