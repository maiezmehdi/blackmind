import TurndownService from 'turndown';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
});

// <mark> has no standard Markdown syntax — keep it as literal inline HTML,
// which marked.parse() (used to render these blocks) passes straight
// through, exactly how handleFormatting() writes it into block.value.
turndownService.addRule('mark', {
  filter: 'mark',
  replacement: (content) => `<mark>${content}</mark>`,
});

// Content-editable blocks render via marked.parse(block.value), so on
// blur we must convert the edited DOM back to Markdown instead of reading
// .textContent — textContent strips every tag (bold, italic, highlight),
// silently discarding formatting the moment the block loses focus.
export const htmlToMarkdown = (html: string): string => {
  try {
    return turndownService.turndown(html || '').trim();
  } catch {
    return html;
  }
};
