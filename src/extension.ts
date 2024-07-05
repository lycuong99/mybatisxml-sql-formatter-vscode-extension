// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { format } from "sql-formatter";
import * as vscode from "vscode";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // 👎 formatter implemented as separate command
  vscode.commands.registerCommand("extension.format-foo", () => {
    const { activeTextEditor } = vscode.window;

    if (activeTextEditor && activeTextEditor.document.languageId === "xml") {
      activeTextEditor.edit((editBuilder) => {
        const selection = activeTextEditor.selection;
        if (selection && !selection.isEmpty) {
          const selectionRange = new vscode.Range(
            selection.start.line,
            selection.start.character,
            selection.end.line,
            selection.end.character
          );
          const highlighted = activeTextEditor.document.getText(selectionRange);
          console.log("Highlighted", highlighted);
		  //replace #{text} to '#{text}' or ${text} to '${text}'
		  let formatted =  highlighted.replaceAll(/#\{([^\}]*?)\}/g, "'${$1}'")
		 
		  formatted = highlighted.replaceAll(/\$\{(.*?)\}/g, '${$1}');
		  formatted = format(highlighted);
		  editBuilder.replace(selectionRange, formatted);
        }
      });
    //   const { document } = activeTextEditor;
    //   console.log("Formatting XML", document);

    //   const selection = activeTextEditor.selection;
    //   if (selection && !selection.isEmpty) {
    //     const selectionRange = new vscode.Range(
    //       selection.start.line,
    //       selection.start.character,
    //       selection.end.line,
    //       selection.end.character
    //     );
    //     const highlighted = activeTextEditor.document.getText(selectionRange);
    //     console.log("Highlighted", highlighted);
    //   }

      //   const firstLine = document.lineAt(0);
      //   if (firstLine.text !== "42") {
      //     const edit = new vscode.WorkspaceEdit();
      //     edit.insert(document.uri, firstLine.range.start, "42\n");
      //     return vscode.workspace.applyEdit(edit);
      //   }
    }
  });

  // // 👍 formatter implemented using API
  // vscode.languages.registerDocumentFormattingEditProvider('xml', {
  // 	provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
  // 		const firstLine = document.lineAt(0);
  // 		if (firstLine.text !== '42') {
  // 			return [vscode.TextEdit.insert(firstLine.range.start, '42\n')];
  // 		}

  // 		return [];
  // 	}
  // });
}

// This method is called when your extension is deactivated
export function deactivate() {}
