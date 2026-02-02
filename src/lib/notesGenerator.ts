import { GeneratedNotes, VocabularyTopic, Bookmark } from '@/types';

export function generateNotes(
  transcript: string,
  selectedTopic?: VocabularyTopic
): GeneratedNotes {
  const sentences = transcript
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  const summary = generateSummary(sentences);
  const bulletPoints = extractBulletPoints(sentences);
  const keyTerms = extractKeyTerms(transcript, selectedTopic);
  const formulas = extractFormulas(transcript);

  return {
    summary,
    bulletPoints,
    keyTerms,
    formulas,
  };
}

function generateSummary(sentences: string[]): string {
  if (sentences.length === 0) {
    return 'No content to summarize.';
  }

  if (sentences.length <= 3) {
    return sentences.join('. ') + '.';
  }

  const importantSentences = sentences
    .filter(s => {
      const lowerS = s.toLowerCase();
      return (
        lowerS.includes('important') ||
        lowerS.includes('key') ||
        lowerS.includes('main') ||
        lowerS.includes('remember') ||
        lowerS.includes('definition') ||
        lowerS.includes('means') ||
        lowerS.includes('is called') ||
        lowerS.includes('refers to') ||
        s.length > 50
      );
    })
    .slice(0, 5);

  if (importantSentences.length > 0) {
    return importantSentences.join('. ') + '.';
  }

  return sentences.slice(0, 3).join('. ') + '.';
}

function extractBulletPoints(sentences: string[]): string[] {
  const bulletPoints: string[] = [];

  for (const sentence of sentences) {
    const lowerS = sentence.toLowerCase();

    if (
      lowerS.includes('first') ||
      lowerS.includes('second') ||
      lowerS.includes('third') ||
      lowerS.includes('finally') ||
      lowerS.includes('next') ||
      lowerS.includes('then') ||
      lowerS.includes('step')
    ) {
      bulletPoints.push(sentence);
      continue;
    }

    if (
      lowerS.includes('important') ||
      lowerS.includes('note that') ||
      lowerS.includes('remember') ||
      lowerS.includes('key point')
    ) {
      bulletPoints.push(sentence);
      continue;
    }

    if (
      lowerS.includes('for example') ||
      lowerS.includes('such as') ||
      lowerS.includes('including')
    ) {
      bulletPoints.push(sentence);
      continue;
    }
  }

  if (bulletPoints.length === 0 && sentences.length > 0) {
    return sentences.slice(0, Math.min(5, sentences.length));
  }

  return bulletPoints.slice(0, 10);
}

function extractKeyTerms(
  transcript: string,
  selectedTopic?: VocabularyTopic
): { term: string; definition: string }[] {
  const keyTerms: { term: string; definition: string }[] = [];
  const lowerTranscript = transcript.toLowerCase();

  if (selectedTopic) {
    for (const vocabTerm of selectedTopic.terms) {
      if (lowerTranscript.includes(vocabTerm.term.toLowerCase())) {
        keyTerms.push({
          term: vocabTerm.term,
          definition: vocabTerm.definition || 'Definition mentioned in lecture',
        });
      }
    }
  }

  const definitionPatterns = [
    /(\w+(?:\s+\w+)?)\s+(?:is|are|means|refers to|is defined as)\s+([^.]+)/gi,
    /(?:the\s+)?(\w+(?:\s+\w+)?)\s*[:]\s*([^.]+)/gi,
  ];

  for (const pattern of definitionPatterns) {
    let match;
    while ((match = pattern.exec(transcript)) !== null) {
      const term = match[1].trim();
      const definition = match[2].trim();

      if (
        term.length > 2 &&
        definition.length > 5 &&
        !keyTerms.some(kt => kt.term.toLowerCase() === term.toLowerCase())
      ) {
        keyTerms.push({ term, definition });
      }
    }
  }

  return keyTerms.slice(0, 15);
}

function extractFormulas(transcript: string): string[] {
  const formulas: string[] = [];

  const formulaPatterns = [
    /[A-Za-z]\s*=\s*[A-Za-z0-9\s+\-*/^()]+/g,
    /\d+\s*[+\-*/^]\s*\d+\s*=\s*\d+/g,
    /(?:formula|equation)(?:\s+is)?\s*[:]\s*([^.]+)/gi,
  ];

  for (const pattern of formulaPatterns) {
    const matches = transcript.match(pattern);
    if (matches) {
      for (const match of matches) {
        const cleaned = match.trim();
        if (cleaned.length > 3 && !formulas.includes(cleaned)) {
          formulas.push(cleaned);
        }
      }
    }
  }

  return formulas.slice(0, 10);
}

export function formatNotesAsText(notes: GeneratedNotes): string {
  let text = '# Lecture Notes\n\n';

  text += '## Summary\n';
  text += notes.summary + '\n\n';

  if (notes.bulletPoints.length > 0) {
    text += '## Key Points\n';
    for (const point of notes.bulletPoints) {
      text += `- ${point}\n`;
    }
    text += '\n';
  }

  if (notes.keyTerms.length > 0) {
    text += '## Key Terms & Definitions\n';
    for (const { term, definition } of notes.keyTerms) {
      text += `**${term}**: ${definition}\n`;
    }
    text += '\n';
  }

  if (notes.formulas.length > 0) {
    text += '## Formulas\n';
    for (const formula of notes.formulas) {
      text += `- ${formula}\n`;
    }
    text += '\n';
  }

  return text;
}

export function downloadAsFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function chunkText(text: string, maxCharsPerLine: number = 80): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export function addPunctuation(text: string): string {
  let result = text.trim();
  
  result = result.replace(/\s+/g, ' ');
  
  result = result.replace(/\bi\b/g, 'I');
  
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  
  const sentenceEnders = /[.!?]$/;
  if (!sentenceEnders.test(result) && result.length > 0) {
    const lastChar = result.charAt(result.length - 1);
    if (lastChar !== ',' && lastChar !== ':' && lastChar !== ';') {
      result += '.';
    }
  }
  
  return result;
}

export function formatCaptionsForReadability(captions: { text: string; speaker?: string }[]): string {
  const chunks: string[] = [];
  let currentChunk = '';
  let currentSpeaker = '';

  for (const caption of captions) {
    const speaker = caption.speaker || 'unknown';
    const text = addPunctuation(caption.text);

    if (speaker !== currentSpeaker && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }

    currentSpeaker = speaker;
    
    if (currentChunk.length + text.length > 200) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = text;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + text;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.join('\n\n');
}

export function formatNotesAsHTML(notes: GeneratedNotes, bookmarks?: Bookmark[]): string {
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lecture Notes</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 { 
      font-size: 28px;
      margin-bottom: 30px;
      color: #1a1a1a;
      border-bottom: 3px solid #4f46e5;
      padding-bottom: 10px;
    }
    h2 { 
      font-size: 20px;
      margin: 25px 0 15px;
      color: #4f46e5;
    }
    p { margin-bottom: 15px; }
    ul { margin-left: 20px; margin-bottom: 20px; }
    li { margin-bottom: 8px; }
    .term { 
      background: #f0f9ff;
      padding: 12px 15px;
      border-radius: 8px;
      margin-bottom: 10px;
      border-left: 4px solid #3b82f6;
    }
    .term strong { color: #1e40af; }
    .formula {
      background: #fef3c7;
      padding: 10px 15px;
      border-radius: 8px;
      margin-bottom: 8px;
      font-family: 'Courier New', monospace;
      border-left: 4px solid #f59e0b;
    }
    .bookmark {
      background: #fef2f2;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
      border-left: 4px solid #ef4444;
    }
    .bookmark-time { 
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
    }
    @media print {
      body { padding: 20px; }
      h1 { font-size: 24px; }
      h2 { font-size: 18px; }
    }
  </style>
</head>
<body>
  <h1>Lecture Notes</h1>
  
  <h2>Summary</h2>
  <p>${escapeHtml(notes.summary)}</p>
`;

  if (notes.bulletPoints.length > 0) {
    html += `
  <h2>Key Points</h2>
  <ul>
    ${notes.bulletPoints.map(point => `<li>${escapeHtml(point)}</li>`).join('\n    ')}
  </ul>
`;
  }

  if (notes.keyTerms.length > 0) {
    html += `
  <h2>Key Terms & Definitions</h2>
  ${notes.keyTerms.map(({ term, definition }) => 
    `<div class="term"><strong>${escapeHtml(term)}</strong>: ${escapeHtml(definition)}</div>`
  ).join('\n  ')}
`;
  }

  if (notes.formulas.length > 0) {
    html += `
  <h2>Formulas</h2>
  ${notes.formulas.map(formula => 
    `<div class="formula">${escapeHtml(formula)}</div>`
  ).join('\n  ')}
`;
  }

  if (bookmarks && bookmarks.length > 0) {
    html += `
  <h2>Bookmarked Moments (Review Later)</h2>
  ${bookmarks.map(bookmark => `
    <div class="bookmark">
      <div class="bookmark-time">${new Date(bookmark.timestamp).toLocaleTimeString()}</div>
      ${bookmark.note ? `<p><strong>Note:</strong> ${escapeHtml(bookmark.note)}</p>` : ''}
      <p>${bookmark.captions.map(c => escapeHtml(c.text)).join(' ')}</p>
    </div>
  `).join('')}
`;
  }

  html += `
</body>
</html>
`;

  return html;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}

export function downloadAsPDF(notes: GeneratedNotes, bookmarks?: Bookmark[]): void {
  const html = formatNotesAsHTML(notes, bookmarks);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

export function formatNotesWithBookmarks(notes: GeneratedNotes, bookmarks?: Bookmark[]): string {
  let text = formatNotesAsText(notes);
  
  if (bookmarks && bookmarks.length > 0) {
    text += '\n## Bookmarked Moments (Review Later)\n\n';
    for (const bookmark of bookmarks) {
      const time = new Date(bookmark.timestamp).toLocaleTimeString();
      text += `### ${time}\n`;
      if (bookmark.note) {
        text += `**Note:** ${bookmark.note}\n`;
      }
      text += bookmark.captions.map(c => c.text).join(' ') + '\n\n';
    }
  }
  
  return text;
}
