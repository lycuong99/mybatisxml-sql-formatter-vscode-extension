// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { format as formatSQL } from "sql-formatter";
import * as vscode from "vscode";
import formatXML from "xml-formatter";
import { createConfig } from "./config";
import {
  commentXmlInSql,
  convertMyBatisToSql,
  convertMyBatisToSqlInDBeaver,
  convertSQLToMyBatis,
  convertSQLToMyBatisInDBeaver,
  coverEntityXml,
  coverValueMybatisSlots,
  isXMLContent,
  recoverEntityXml,
  recoverValueMybatisSlots,
  uncommentXmlInSql,
} from "./utils";

const editorFormattingOptions = (editor: vscode.TextEditor) => ({
  // According to types, these editor.options properties can also be strings or undefined,
  // but according to docs, the string|undefined value is only applicable when setting,
  // so it should be safe to cast them.
  tabSize: editor.options.tabSize as number,
  insertSpaces: editor.options.insertSpaces as boolean,
});

const createConfigForEditor = (editor: vscode.TextEditor) =>
  createConfig(vscode.workspace.getConfiguration("SQL-Formatter-VSCode"), editorFormattingOptions(editor), "sql");

function formatMyBatisSQL(text: string) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return text;
  }

  //replace #{text} to '#{text}' or ${text} to '${text}
  let formatted = coverValueMybatisSlots(text);

  formatted = coverEntityXml(formatted);

  formatted = commentXmlInSql(formatted);

  formatted = formatSQL(formatted, {
    keywordCase: "upper",
    language: "sql",
    newlineBeforeSemicolon: true,
    linesBetweenQueries: 1,
    tabWidth: editor.options.tabSize as number,
    useTabs: !editor.options.insertSpaces,
  });

  //recover
  formatted = uncommentXmlInSql(formatted);
  formatted = recoverEntityXml(formatted);
  formatted = recoverValueMybatisSlots(formatted);

  return formatted;
}

// Function to format the MyBatis XML content with embedded SQL
function formatMyBatisXML(xmlContent: string): string {
  // Format the overall XML content to handle indentation and structure

  let formattedXML = formatXML(xmlContent);

  // Regular expression to find MyBatis SQL tags and their content
  const sqlTagPattern =
    /<\s*(select|insert|update|delete|if|choose|when|otherwise|foreach|where)([^>]*)>\r\n*(\s*)([\s\S]*?)<\/\s*\1\s*>/g;

  // Replace each SQL section with formatted SQL while preserving dynamic SQL tags
  formattedXML = formattedXML.replace(sqlTagPattern, (match, tag, attribute, space: string, content) => {
    // If it's a SQL tag with actual SQL, format the SQL content inside
    if (["select", "insert", "update", "delete"].includes(tag)) {
      let sqlFormatted = formatMyBatisSQL(content);
      sqlFormatted = sqlFormatted.replace(/\n/g, "\n" + space);
      let spaceArr = space.split("");
      spaceArr.pop();
      spaceArr.pop();
      spaceArr.pop();
      spaceArr.pop();
      let spaceMinue1 = spaceArr.join("");
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
  return segments
    .map((segment) => {
      // If the segment is a dynamic tag, return it as is
      if (dynamicTagPattern.test(segment)) {
        return segment;
      }
      // Otherwise, format the SQL segment
      return formatSQL(segment, { language: "sql" });
    })
    .join("\n"); // Join the formatted segments with newlines
}

function getSelectedText() {
  const { activeTextEditor } = vscode.window;
  if (!activeTextEditor) {
    return;
  }
  const selection = activeTextEditor.selection;
  if (!selection || selection.isEmpty) {
    return;
  }

  const selectionRange = new vscode.Range(
    selection.start.line,
    selection.start.character,
    selection.end.line,
    selection.end.character
  );
  const highlighted = activeTextEditor.document.getText(selectionRange);
  return {
    selectedText: highlighted,
    selectionRange,
  };
}

const formatSelect = () => {
  const { activeTextEditor } = vscode.window;
  if (!activeTextEditor) {
    return;
  }
  if (activeTextEditor.document.languageId === "xml") {
    activeTextEditor.edit((editBuilder) => {
      const selectTextData = getSelectedText();
      if (!selectTextData) {
        return;
      }

      const { selectedText, selectionRange } = selectTextData;
      let formatted;
      if (isXMLContent(selectedText)) {
        formatted = formatMyBatisXML(selectedText);
      } else {
        formatted = formatMyBatisSQL(selectedText);
      }
      editBuilder.replace(selectionRange, formatted);
    });
  }
};

function workWithSelectedText(fn: (selectedText: string) => string) {
  const { activeTextEditor } = vscode.window;
  if (!activeTextEditor) {
    return;
  }
  if (activeTextEditor.document.languageId === "xml") {
    activeTextEditor.edit((editBuilder) => {
      const selectTextData = getSelectedText();
      if (!selectTextData) {
        return;
      }

      const { selectedText, selectionRange } = selectTextData;
      let formatted = fn(selectedText);

      editBuilder.replace(selectionRange, formatted);
    });
  }
}

const convertMybatisToSQLCommand = () => {
  workWithSelectedText(convertMyBatisToSqlInDBeaver);
};

const convertSQLToMyBatisCommand = () => {
  workWithSelectedText(convertSQLToMyBatisInDBeaver);
};

export function activate(context: vscode.ExtensionContext) {
  // 👎 formatter implemented as separate command
  vscode.commands.registerCommand("extension.format-foo", formatSelect);
  vscode.commands.registerCommand("extension.to-sql", convertMybatisToSQLCommand);
  vscode.commands.registerCommand("extension.to-mybatis", convertSQLToMyBatisCommand);
}
// This method is called when your extension is deactivated
export function deactivate() {}
