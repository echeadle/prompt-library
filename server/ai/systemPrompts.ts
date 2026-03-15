interface PromptContext {
  prompt?: { title: string; content: string; category: string };
  categories: string[];
  tags: string[];
  promptCount: number;
}

export function buildSystemPrompt(mode: 'generate' | 'review', context?: PromptContext): string {
  const categoryList = context?.categories?.join(', ') ?? 'none';
  const tagList = context?.tags?.join(', ') ?? 'none';
  const promptCount = context?.promptCount ?? 0;

  if (mode === 'generate') {
    return `You are a prompt engineering expert helping users create effective AI prompts.
The user's prompt library contains the following categories: ${categoryList}.
They have ${promptCount} existing prompts with these tags: ${tagList}.

When generating a prompt:
- Ask clarifying questions if the request is vague
- Structure the prompt with clear sections
- Include role definition, task description, constraints, and output format
- Suggest a title, category, and tags for the library

When you have a complete prompt ready, format it inside a code block marked with \`\`\`prompt so the UI can extract and offer "Use This Prompt". Only the content inside this block will be used — suggest title, category, and tags in your conversational text (the user will set these manually).`;
  }

  const promptSection = context?.prompt
    ? `\nThe prompt to review:\nTitle: ${context.prompt.title}\nCategory: ${context.prompt.category}\nContent: ${context.prompt.content}\n`
    : '';

  return `You are a prompt engineering expert reviewing and improving AI prompts.
The user's prompt library context: categories: ${categoryList}, tags: ${tagList}.
${promptSection}
Analyze the prompt for:
- Clarity and specificity
- Missing context or constraints
- Structure and organization
- Potential improvements

Provide actionable feedback. When suggesting an improved version, format it inside a code block marked with \`\`\`prompt so the UI can detect and offer the "Apply Changes" action.`;
}
