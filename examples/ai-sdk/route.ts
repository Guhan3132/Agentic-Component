// app/api/chat/route.ts in your project.
// A real agent behind the Agentic UI patterns: one tool that runs on its own, one that needs approval.
// Uses the Vercel AI SDK (npm i ai @ai-sdk/react zod). The model string goes through the AI Gateway;
// swap in any provider model you use.
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";

export const maxDuration = 60;

export const tools = {
  searchVenues: tool({
    description: "Search venues in a city that fit a budget.",
    inputSchema: z.object({ city: z.string(), budget: z.number() }),
    execute: async ({ city, budget }) => ({ count: 9, summary: `Found 9 venues in ${city} under $${budget}` }),
  }),
  bookVenue: tool({
    description: "Book a venue. Charges the team card on file.",
    inputSchema: z.object({ venue: z.string(), total: z.number() }),
    // The run pauses here until the person answers in the ApprovalStep.
    needsApproval: true,
    execute: async ({ venue, total }) => ({ ok: true, summary: `Booked ${venue} for $${total}` }),
  }),
};

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const result = streamText({
    model: "anthropic/claude-sonnet-5.5",
    system: "You plan team offsites. Search before you book, and always book with the bookVenue tool.",
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  });
  return result.toUIMessageStreamResponse();
}
