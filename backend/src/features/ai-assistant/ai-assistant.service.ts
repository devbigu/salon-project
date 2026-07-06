import { detectToolName } from "./ai-intent-router.js";
import { getAiToolByName } from "./ai-tool-registry.js";
import {
  canUseAiTool,
  hasValidAiDataScope,
} from "./ai-permission.service.js";
import { redactAiData } from "./ai-redaction.service.js";
import { AiProvider } from "./providers/ai.provider.js";
import type { AiToolContext, AiToolResult } from "./ai-tool.types.js";

const aiProvider = new AiProvider();

type UsedToolStatus = "SUCCESS" | "BLOCKED";

type AiAssistantResponse = {
  answer: string;
  usedTools: Array<{
    toolName: string;
    status: UsedToolStatus;
  }>;
};

export async function chatWithAiAssistant(params: {
  message: string;
  context: AiToolContext;
}): Promise<AiAssistantResponse> {
  const toolName = detectToolName(params.message);

  if (toolName === "BLOCKED") {
    return {
      answer:
        "I cannot perform that action. I can only answer read-only salon data questions.",
      usedTools: [{ toolName: "BLOCKED", status: "BLOCKED" }],
    };
  }

  if (!toolName) {
    const answer = await aiProvider.generateAnswer({
      userMessage: params.message,
      toolResults: [],
    });
    return { answer, usedTools: [] };
  }

  const tool = getAiToolByName(toolName);
  if (!tool) {
    return {
      answer: "That data tool is not available yet.",
      usedTools: [],
    };
  }

  if (
    !canUseAiTool(params.context.role, tool) ||
    !hasValidAiDataScope(params.context)
  ) {
    return {
      answer: "You do not have permission to access that information.",
      usedTools: [{ toolName, status: "BLOCKED" }],
    };
  }

  const rawResult = await tool.run({
    message: params.message,
    context: params.context,
  });
  const result: AiToolResult = {
    summary: rawResult.summary,
    ...(rawResult.data !== undefined
      ? { data: redactAiData(rawResult.data) }
      : {}),
  };
  const answer = await aiProvider.generateAnswer({
    userMessage: params.message,
    toolResults: [result],
  });

  return {
    answer,
    usedTools: [{ toolName, status: "SUCCESS" }],
  };
}
