export interface MessageToken {
  name: string;
  prefix: string;
}

export interface ParsedMessage {
  suffix: string;
  tokens: readonly MessageToken[];
}

export const parseMessage = (message: string): ParsedMessage => {
  const tokens: MessageToken[] = [];
  let cursor = 0;
  while (cursor < message.length) {
    const opening = message.indexOf("{", cursor);
    if (opening < 0) break;
    const closing = message.indexOf("}", opening + 1);
    if (closing < 0) break;
    const name = message.slice(opening + 1, closing);
    if (name.length === 0) {
      cursor = closing + 1;
      continue;
    }
    tokens.push({ name, prefix: message.slice(cursor, opening) });
    cursor = closing + 1;
  }
  return { suffix: message.slice(cursor), tokens };
};

export const messagePlaceholders = (message: string): string[] =>
  parseMessage(message)
    .tokens.map(({ name }) => name)
    .sort();
