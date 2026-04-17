/**
 * Parse "suggested_questions:" block from the end of an assistant message.
 * Returns { cleanContent, questions }.
 */
export function parseSuggestedQuestions(content: string): { cleanContent: string; questions: string[] } {
  // Match a block like:
  //   suggested_questions:
  //   Question one?
  //   Question two?
  // or with bullet points:
  //   suggested_questions:
  //   - Question one?
  //   - Question two?
  const pattern = /\n*suggested_questions:\s*\n([\s\S]*?)$/i;
  const match = content.match(pattern);

  if (!match) {
    return { cleanContent: content, questions: [] };
  }

  const cleanContent = content.slice(0, match.index).trimEnd();
  const questionsBlock = match[1].trim();
  const questions = questionsBlock
    .split('\n')
    .map(line => line.replace(/^[-*•]\s*/, '').trim())
    .filter(line => line.length > 0);

  return { cleanContent, questions };
}
