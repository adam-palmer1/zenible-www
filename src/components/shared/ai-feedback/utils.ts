export function markdownToPlainText(markdown: string): string {
  if (!markdown) return '';

  let text = markdown;

  // Remove code blocks (```...```)
  text = text.replace(/```[\s\S]*?```/g, (match) => {
    // Extract code content between ``` markers
    return match.replace(/```\w*\n?/g, '').replace(/```$/g, '');
  });

  // Remove inline code (`...`)
  text = text.replace(/`([^`]+)`/g, '$1');

  // Remove images ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Remove links [text](url) - keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove headers (# ## ### etc)
  text = text.replace(/^#{1,6}\s+/gm, '');

  // Remove bold (**text** or __text__)
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');

  // Remove italic (*text* or _text_)
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');

  // Remove strikethrough (~~text~~)
  text = text.replace(/~~(.*?)~~/g, '$1');

  // Remove blockquotes (> )
  text = text.replace(/^>\s+/gm, '');

  // Remove horizontal rules (---, ***, ___)
  text = text.replace(/^(\*{3,}|-{3,}|_{3,})$/gm, '');

  // Remove unordered list markers (-, *, +)
  text = text.replace(/^[*\-+]\s+/gm, '');

  // Remove ordered list markers (1., 2., etc)
  text = text.replace(/^\d+\.\s+/gm, '');

  // Remove HTML tags if any
  text = text.replace(/<[^>]+>/g, '');

  return text;
}
