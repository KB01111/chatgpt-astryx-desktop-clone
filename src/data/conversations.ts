import type {
  Conversation,
  HistoryGroup,
  Message,
  MockResponse,
  SendOptions,
} from "../types";

export const models = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    shortName: "4o",
    description: "Smart, fast, and ready for anything",
    capability: "Vision",
  },
  {
    id: "o3-mini",
    name: "o3-mini",
    shortName: "o3-mini",
    description: "A little more thought for complex problems",
    capability: "Reasoning",
  },
  {
    id: "canvas",
    name: "Canvas",
    shortName: "Canvas",
    description: "A collaborative space for code and writing",
    capability: "Alpha",
  },
  {
    id: "web-search",
    name: "Web Search",
    shortName: "Search",
    description: "Explore a simulated web research workflow",
    capability: "Search",
  },
] as const;

const codeResponse = `The trick is to let TypeScript do the narrowing for you. A small type guard makes the code both safer and easier to read.

### Start with a clear data shape

\`\`\`typescript
type User = {
  id: string;
  name: string;
  email?: string;
};

function hasEmail(user: User): user is User & { email: string } {
  return typeof user.email === "string" && user.email.length > 0;
}

const emailList = users.filter(hasEmail).map(user => user.email);
\`\`\`

**Why this works:** the return type tells TypeScript that a successful check guarantees an email. No non-null assertions, no unsafe casts.

Paste your own snippet and we can adapt this pattern to your exact error.`;

const dataResponse = `Let's find the story behind the numbers. A useful analysis starts with three questions: **what changed, why it changed, and what to do next.**

### A simple starting point

| Metric | Previous quarter | This quarter | Change |
| --- | --- | --- | --- |
| Revenue | $84,000 | $102,000 | +21.4% |
| New customers | 420 | 510 | +21.4% |
| Average order | $200 | $200 | Flat |

*Illustrative sample data, not live financial information.*

The takeaway: growth is coming from **more customers**, not higher spending per customer. That's a useful signal for where to focus next.

Share the figures you'd like to work with, and we can turn them into a clear, actionable summary.`;

const ideaResponse = `Every great idea starts with a clear reason to exist. Let's give yours a little shape.

### The one-sentence pitch

**For people with too many ideas and too little time, a calmer workspace that turns the next big thing into the next small step.**

### Three directions to explore

1. **Less friction, more flow.** Focus on how quickly someone can go from a blank page to a first draft.
2. **A thinking partner, not another tool.** Make the experience feel collaborative, approachable, and genuinely helpful.
3. **Small steps. Real momentum.** Celebrate progress instead of overwhelming people with possibilities.

My pick? Start with the second direction. It leads with a feeling people recognize, not a feature they have to understand.

Tell me a little about your audience and we'll make the pitch unmistakably yours.`;

const writingResponse = `Let's make the words feel like you, just a little clearer.

### A fresh first draft

Good ideas don't always arrive fully formed. Sometimes they're a note in the margin, a question on a walk, or a thought you almost forget.

Give them a little room. Start before you're ready. Make the first version imperfect, then make the next one better.

**You don't need the whole picture to take the first step.**

We can take this in a few directions: warmer and more personal, sharper and more concise, or more playful. What are you writing, and who is it for?`;

const planResponse = `A good plan should make your day feel lighter, not more crowded. Here's a simple place to start.

### Make room for what matters

1. **Choose one meaningful thing.** What would make today feel worthwhile? Write it down before opening your inbox.
2. **Give it a little protected time.** Set aside 25 minutes with notifications off. Small, focused sessions add up.
3. **Leave some breathing room.** Plan for about two-thirds of your available time. Real life can have the rest.

### A gentler morning

Water, a few minutes of daylight, and a moment to think before you start scrolling. Nothing elaborate, just a small signal that the day is yours.

What's one thing you'd like a little more time for?`;

const travelResponse = `Copenhagen is best explored slowly, with comfortable shoes and room for one more pastry.

### Saturday: the classics, with a twist

Start with coffee in **Norrebro**, then wander along the lakes toward the city center. Spend the afternoon around the colorful waterfront at **Nyhavn** before finding a quiet table for dinner.

### Sunday: take the scenic route

Rent a bike, explore the harbor, and stop at a bakery that catches your eye. Leave the afternoon open for a museum or a long lunch.

**A small tip:** book popular restaurants ahead, but keep your days flexible. The best parts of a city are often the ones you didn't plan.

Would you like the itinerary to lean more toward food, design, or hidden neighborhood spots?`;

function seedThread(
  id: string,
  title: string,
  group: HistoryGroup,
  prompt: string,
  response: string,
): Conversation {
  const createdAt = "2026-06-18T09:41:00.000Z";
  const messages: Message[] = [
    { id: `${id}-user`, sender: "user", content: prompt, createdAt },
    {
      id: `${id}-assistant`,
      sender: "assistant",
      content: response,
      createdAt,
    },
  ];
  if (id === "typescript")
    messages[1].reasoning = [
      "Clarified the expected input and output types.",
      "Chose a type guard rather than an unsafe assertion.",
      "Included a small, reusable example.",
    ];
  if (id === "numbers")
    messages[1].toolCalls = [
      {
        name: "code_interpreter",
        target: "quarterly_growth.py (demo)",
        duration: "0.8s",
        status: "complete",
      },
    ];
  return { id, title, group, messages };
}

export const initialConversations: Conversation[] = [
  seedThread(
    "brand",
    "A brand voice that feels like us",
    "Today",
    "Help me find a fresh, approachable brand voice for our new productivity app.",
    ideaResponse,
  ),
  seedThread(
    "numbers",
    "Making sense of Q3 numbers",
    "Today",
    "How can I turn our quarterly numbers into a useful story?",
    dataResponse,
  ),
  seedThread(
    "typescript",
    "A little TypeScript help",
    "Today",
    "How do I safely filter an array of users that have an optional email in TypeScript?",
    codeResponse,
  ),
  seedThread(
    "copenhagen",
    "A weekend in Copenhagen",
    "Yesterday",
    "Plan a relaxed weekend in Copenhagen, with good coffee and a little design inspiration.",
    travelResponse,
  ),
  seedThread(
    "ideas",
    "Ideas worth waking up for",
    "Yesterday",
    "Help me brainstorm a product pitch that makes people feel inspired.",
    ideaResponse,
  ),
  seedThread(
    "morning",
    "A simpler morning routine",
    "Yesterday",
    "Can you help me design a simpler, calmer morning routine?",
    planResponse,
  ),
  seedThread(
    "design",
    "Designing with intention",
    "Previous 7 Days",
    "How can I bring more intention to the things I design?",
    ideaResponse,
  ),
  seedThread(
    "reading",
    "A reading list for curious minds",
    "Previous 7 Days",
    "Help me make a thoughtful reading plan.",
    planResponse,
  ),
  seedThread(
    "words",
    "Finding the right words",
    "Previous 7 Days",
    "Help me write something about starting before you feel ready.",
    writingResponse,
  ),
];

export function createMockResponse(
  prompt: string,
  options: SendOptions,
): MockResponse {
  let content: string;
  if (
    /code|typescript|javascript|react|debug|function|bug|program/i.test(
      prompt,
    ) ||
    options.model === "canvas"
  )
    content = codeResponse;
  else if (/data|stock|number|analy|revenue|quarter|finance/i.test(prompt))
    content = dataResponse;
  else if (/pitch|brand|idea|brainstorm|product|inspir/i.test(prompt))
    content = ideaResponse;
  else if (/write|draft|polish|email|story|word|poem/i.test(prompt))
    content = writingResponse;
  else if (/travel|trip|copenhagen|weekend|holiday/i.test(prompt))
    content = travelResponse;
  else if (/plan|routine|morning|time|habit|reading/i.test(prompt))
    content = planResponse;
  else
    content = `Let's explore that together. Here's a useful way to get started.\n\n### Find the next small step\n\n**Start with the outcome.** What would a good answer or a successful result look like for you?\n\nThen we can break it into something manageable:\n\n1. Clarify the most important part of the question.\n2. Look at a few possible approaches.\n3. Turn the best one into a practical next step.\n\nTell me a little more about the context, and we can make this more specific.\n\n*This is a local demo response. No message was sent to an AI service.*`;

  if (options.attachments.length)
    content = `I see **${options.attachments.map((a) => a.name).join(", ")}** attached. This local demo keeps file metadata only and does not read the file contents.\n\n${content}`;

  return {
    content,
    reasoning:
      options.reason || options.model === "o3-mini"
        ? [
            "Identified the goal and the available context.",
            "Compared a few practical approaches.",
            "Organized the answer around a clear next step.",
          ]
        : undefined,
    toolCalls:
      options.search || options.model === "web-search"
        ? [
            {
              name: "web_search",
              target: prompt.slice(0, 76),
              duration: "1.2s",
              status: "complete",
              resultDetail:
                "Simulated tool execution. No live web search was performed in this local demo.",
            },
          ]
        : /data|number|analy/i.test(prompt)
          ? [
              {
                name: "code_interpreter",
                target: "sample_analysis.py (demo)",
                duration: "0.8s",
                status: "complete",
                resultDetail:
                  "Illustrative analysis using the sample figures shown in the response.",
              },
            ]
          : undefined,
  };
}
