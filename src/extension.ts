// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { format } from "sql-formatter";
import * as vscode from "vscode";
import formatXML from 'xml-formatter';

function formatMyBatisSQL(text: string) {
  //replace #{text} to '#{text}' or ${text} to '${text}
  var formatted = text.replaceAll(/#\{([^\}]*?)\}/g, "'#{$1}'");
  formatted = formatted.replaceAll(/$\{([^\}]*?)\}/g, "'${$1}'");

  const xmmlTagRegex =
    /<\s*(if|choose|when|otherwise|foreach|where|select|insert|update|delete)([^>]*)>([\s\S]*?)<\/\s*\1\s*>/g;

  formatted = formatted.replaceAll(xmmlTagRegex, (match, group1, group2, group3) => {
    console.log(group1, group2);

    return `--<${group1}${group2}>\n${group3}\n--</${group1}>`;
  });

  var formatted = format(formatted);

  //recover
  formatted = formatted.replaceAll(/'#\{([^\}]*?)\}'/g, "#{$1}");
  formatted = formatted.replaceAll(/'${([^\}]*?)\}'/g, "${$1}");

  const xmmlTagRegexRecover =
    /--<\s*(if|choose|when|otherwise|foreach|where|select|insert|update|delete)([^>]*)>([\s\S]*?)--<\/\s*\1\s*>/g;
  formatted = formatted.replaceAll(xmmlTagRegexRecover, (match, group1, group2, group3) => {
    return `\n<${group1}${group2}>${group3}</${group1}>\n`;
  });

  return formatted;
}

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
          // var formatted = formatMyBatisSQL(highlighted);
          var formatted = formatMyBatisXML(highlighted);
          editBuilder.replace(selectionRange, formatted);
        }
      });
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

// Function to format the MyBatis XML content with embedded SQL
function formatMyBatisXML(xmlContent: string): string {
  // Format the overall XML content to handle indentation and structure
  let formattedXML = formatXML(xmlContent, { collapseContent: true });

  // Regular expression to find MyBatis SQL tags and their content
  const sqlTagPattern = /<\s*(select|insert|update|delete|if|choose|when|otherwise|foreach|where)([^>]*)>\r\n*(\s*)([\s\S]*?)<\/\s*\1\s*>/g;

  // Replace each SQL section with formatted SQL while preserving dynamic SQL tags
  formattedXML = formattedXML.replace(sqlTagPattern, (match, tag,attribute,space: string, content) => {
    // If it's a SQL tag with actual SQL, format the SQL content inside
    if (['select', 'insert', 'update', 'delete'].includes(tag)) {
      let sqlFormatted = formatMyBatisSQL(content);
      sqlFormatted = sqlFormatted.replace(/\n/g, '\n' + space);
      let spaceArr = space.split('');
      spaceArr.pop();
      spaceArr.pop();
      spaceArr.pop();
      spaceArr.pop();
      let spaceMinue1 = spaceArr.join('');
      return `<${tag}${attribute}>\n${space}${sqlFormatted}\r\n${spaceMinue1}</${tag}>`;
    }

    // Otherwise, it's a dynamic SQL tag, which we should format carefully
    return `<${tag}>${content.trim()}</${tag}>`;
  });

  return formattedXML;
}

// Function to format SQL content with MyBatis dynamic tags inside
function formatSQLWithMyBatisTags(sqlContent: string): string {
  // Regular expression to find MyBatis dynamic tags inside SQL content
  const dynamicTagPattern = /<\s*(if|choose|when|otherwise|foreach|where)[^>]*>[\s\S]*?<\/\s*\1\s*>/g;

  // Split the SQL content into segments around the MyBatis tags
  const segments = [];
  let lastIndex = 0;

  let match;
  while ((match = dynamicTagPattern.exec(sqlContent)) !== null) {
    // Push the SQL segment before the dynamic tag
    segments.push(sqlContent.substring(lastIndex, match.index));

    // Push the dynamic tag itself
    segments.push(match[0]);

    lastIndex = match.index + match[0].length;
  }

  // Push the remaining SQL content after the last dynamic tag
  segments.push(sqlContent.substring(lastIndex));

  // Format each SQL segment separately, preserving dynamic tags
  return segments.map(segment => {
    // If the segment is a dynamic tag, return it as is
    if (dynamicTagPattern.test(segment)) {
      return segment;
    }
    // Otherwise, format the SQL segment
    return format(segment, { language: 'sql'});
  }).join('\n'); // Join the formatted segments with newlines
}
// This method is called when your extension is deactivated
export function deactivate() {}
