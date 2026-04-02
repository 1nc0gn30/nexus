import { PublicAPI } from '../data/registry';

/**
 * Parses a markdown table into PublicAPI objects.
 * Expected format:
 * | API | Description | Auth | HTTPS | Cors | Link | Category |
 * | --- | --- | --- | --- | --- | --- | --- |
 * | Cat Facts | Daily cat facts | No | Yes | Yes | https://catfact.ninja/fact | Animals |
 */
export function parseMarkdownTable(markdown: string, category: string = 'General'): PublicAPI[] {
  const lines = markdown.trim().split('\n');
  if (lines.length < 3) return [];

  const entries: PublicAPI[] = [];
  
  // Skip header and separator
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('|')) continue;
    
    const cells = line.split('|').map(c => c.trim()).filter(c => c !== '');
    if (cells.length < 6) continue;

    entries.push({
      API: cells[0],
      Description: cells[1],
      Auth: cells[2] === 'No' ? '' : cells[2],
      HTTPS: cells[3].toLowerCase() === 'yes',
      Cors: cells[4].toLowerCase(),
      Link: cells[5],
      Category: cells[6] || category
    });
  }

  return entries;
}
