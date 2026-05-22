/**
 * Anthropic Claude API client wrapper for SEO Ops agents.
 *
 * Provides a preconfigured Anthropic SDK instance and a convenience
 * `callClaude()` helper for single-turn, tool-use-disabled calls.
 *
 * Model: claude-sonnet-4-5 by default (latest sonnet, fast + smart).
 * Override via SEO_OPS_CLAUDE_MODEL env var for testing.
 */
import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Cannot call Claude API."
      );
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export function getModel(): string {
  return process.env.SEO_OPS_CLAUDE_MODEL ?? "claude-sonnet-4-5";
}

/**
 * Single-turn Claude call — no tool use.
 * Returns the text content of the first message block.
 */
export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 4096
): Promise<string> {
  const client = getAnthropicClient();

  const msg = await client.messages.create({
    model: getModel(),
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = msg.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Claude returned no text block");
  }
  return block.text;
}
