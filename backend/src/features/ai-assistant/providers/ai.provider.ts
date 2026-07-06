import type { AiToolResult } from "../ai-tool.types.js";

export class AiProvider {
  async generateAnswer(params: {
    userMessage: string;
    toolResults: AiToolResult[];
  }): Promise<string> {
    if (!params.toolResults.length) {
      return "I could not understand that question yet. Try asking about appointments, revenue, low stock, outstanding customers, packages, or memberships.";
    }

    return params.toolResults.map((result) => result.summary).join("\n");
  }
}
