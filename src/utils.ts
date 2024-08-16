export function coverEntityXml(text: string): string {
  let formatted = text.replaceAll(/&gt;/g, ">");
  formatted = formatted.replaceAll(/&lt;/g, "<");
  return formatted;
}

export function recoverEntityXml(text: string): string {
  let formatted = text.replaceAll(/\s>=\s/g, " &gt;= ");
  formatted = formatted.replaceAll(/\s<=\s/g, " &lt;= ");
  formatted = formatted.replaceAll(/\s<>\s/g, " &lt;&gt; ");
  formatted = formatted.replaceAll(/\s>\s/g, " &gt; ");
  formatted = formatted.replaceAll(/\s<\s/g, " &lt; ");
  return formatted;
}
// -----
export function coverValueMybatisSlots(text: string): string {
  let formatted = text.replaceAll(/#\{([^\}]*?)\}/g, "'#{$1}'");

  // const $reggex = /\s[^']\$\}/g;
  // formatted = formatted.replaceAll(/\$\{([^\}]*?)\}/g, "'${$1}'");
  return formatted;
}
export function coverValueMybatisSlotsInDBeaver(text: string): string {
  let formatted = text.replaceAll(/#\{([^\}]*?)\}/g, "${$1}");
  formatted = formatted.replaceAll(/$\{([^\}]*?)\}/g, "${$1}");
  return formatted;
}

export function recoverValueMybatisSlots(text: string): string {
  let formatted = text.replaceAll(/'#\{([^\}]*?)\}'/g, "#{$1}");
  formatted = formatted.replaceAll(/'\${([^\}]*?)\}'/g, "${$1}");
  return formatted;
}

export function recoverValueMybatisSlotsInDBeaver(text: string): string {
  let formatted = text.replaceAll(/([^\%])\$\{([^\}]*?)\}/g, "$1#{$2}");
  return formatted;
}
// -----
export function commentXmlInSql(text: string): string {
  const xmmlTagRegex =
    /<\s*(if|choose|when|otherwise|foreach|where|select|insert|update|delete)([^>]*)>([\s\S]*?)<\/\s*\1\s*>/g;

  let formatted = text.replaceAll(xmmlTagRegex, (match, tag, attribute, group3) => {
    console.log(tag, attribute);

    return `--<${tag}${attribute}>\n${group3}\n--</${tag}>`;
  });

  const xmlTagSelfClosingRegex = /<\s*(include)([^>]*)\/>/g;
  formatted = formatted.replaceAll(xmlTagSelfClosingRegex, (match, tag, attribute, group3) => {
    console.log(tag, attribute);
    return `--<${tag}${attribute}/>`;
  });

  return formatted;
}

export function commentMultiLineXmlInSql(text: string): string {
  const xmmlTagRegex =
    /<\s*(if|choose|when|otherwise|foreach|where|select|insert|update|delete)([^>]*)>([\s\S]*?)<\/\s*\1\s*>/g;

  let formatted = text.replaceAll(xmmlTagRegex, (match, tag, attribute, body) => {
    console.log(tag, attribute);

    body = commentMultiLineXmlInSql(body);

    return `/*<${tag}${attribute}>*/${body}/*</${tag}>*/`;
  });

  const xmlTagSelfClosingRegex = /<\s*(include)([^>]*)\/>/g;
  formatted = formatted.replaceAll(xmlTagSelfClosingRegex, (match, tag, attribute, group3) => {
    console.log(tag, attribute);
    return `/*<${tag}${attribute}/>*/`;
  });

  return formatted;
}

export function uncommentXmlInSql(text: string): string {
  const xmmlTagRegexRecover =
    /--<\s*(if|choose|when|otherwise|foreach|where|select|insert|update|delete)([^>]*)>([\s\S]*?)--<\/\s*\1\s*>/g;
  let formatted = text.replaceAll(xmmlTagRegexRecover, (match, tag, attribute, content) => {
    const contentTrim = content.trimStart();
    return `\n<${tag}${attribute}>\n\t${contentTrim}\n</${tag}>`;
  });

  const xmlTagSelfClosingRegexRecover = /--<\s*(include)([^>]*)>$/g;
  formatted = formatted.replaceAll(xmlTagSelfClosingRegexRecover, (match, tag, attribute, group3) => {
    return `\n<${tag.trim()}${attribute}/>`;
  });
  return formatted;
}
export function uncommentMultiLineXmlInSql(text: string): string {
  const xmmlTagRegexRecover =
    /\/\*\s*<\s*(if|choose|when|otherwise|foreach|where|select|insert|update|delete)([^>]*)>\*\/([\s\S]*?)\/\*<\/\s*\1\s*>\*\//g;
  let formatted = text.replaceAll(xmmlTagRegexRecover, (match, tag, attribute, content) => {
    const contentTrim = uncommentMultiLineXmlInSql(content);
    return `<${tag}${attribute}>${contentTrim}</${tag}>`;
  });

  const xmlTagSelfClosingRegexRecover = /\/\*\s*<\s*(include)([^>]*)>\s*\*\//g;
  formatted = formatted.replaceAll(xmlTagSelfClosingRegexRecover, (match, tag, attribute, group3) => {
    return `<${tag.trim()}${attribute}/>`;
  });
  return formatted;
}
// -----
export function isXMLContent(text: string) {
  const xmlTagRegex = /^\s*<\s*([^>]*?)>/g;
  return xmlTagRegex.test(text);
}

export function convertSQLToMyBatis(text: string) {
  let formatted = uncommentXmlInSql(text);
  formatted = uncommentMultiLineXmlInSql(formatted);
  formatted = recoverEntityXml(formatted);
  formatted = recoverValueMybatisSlots(formatted);

  return formatted;
}

export function convertSQLToMyBatisInDBeaver(text: string) {
  let formatted = recoverEntityXml(text);
  formatted = recoverValueMybatisSlotsInDBeaver(formatted);
  formatted = uncommentXmlInSql(formatted);
  formatted = uncommentMultiLineXmlInSql(formatted);

  return formatted;
}

export function convertMyBatisToSql(text: string) {
  let formatted = coverValueMybatisSlots(text);
  formatted = coverEntityXml(formatted);
  formatted = commentXmlInSql(formatted);

  return formatted;
}

export function convertMyBatisToSqlInDBeaver(text: string) {
  let formatted = coverValueMybatisSlotsInDBeaver(text);
  formatted = coverEntityXml(formatted);
  formatted = commentMultiLineXmlInSql(formatted);

  return formatted;
}
