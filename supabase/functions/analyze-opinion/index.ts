// Analyze public opinion on a topic using Reddit + Lovable AI
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  subreddit: string;
  score: number;
  num_comments: number;
  permalink: string;
  created_utc: number;
  author: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic } = await req.json();
    if (!topic || typeof topic !== "string" || topic.length > 200) {
      return new Response(
        JSON.stringify({ error: "Invalid topic" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1) Fetch Reddit posts (public JSON endpoint)
    const redditUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(
      topic,
    )}&sort=relevance&t=month&limit=25`;
    const redditRes = await fetch(redditUrl, {
      headers: { "User-Agent": "OpinionTracker/1.0 (lovable.dev)" },
    });

    if (!redditRes.ok) {
      console.error("Reddit fetch failed:", redditRes.status);
      return new Response(
        JSON.stringify({ error: "Could not reach Reddit. Try again in a moment." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const redditJson = await redditRes.json();
    const posts: RedditPost[] = (redditJson?.data?.children ?? [])
      .map((c: any) => c.data)
      .filter((p: any) => p && (p.title || p.selftext))
      .slice(0, 20)
      .map((p: any) => ({
        id: p.id,
        title: p.title ?? "",
        selftext: (p.selftext ?? "").slice(0, 600),
        subreddit: p.subreddit ?? "",
        score: p.score ?? 0,
        num_comments: p.num_comments ?? 0,
        permalink: `https://reddit.com${p.permalink}`,
        created_utc: p.created_utc ?? 0,
        author: p.author ?? "unknown",
      }));

    if (posts.length === 0) {
      return new Response(
        JSON.stringify({
          topic,
          totalPosts: 0,
          summary: `No recent Reddit discussion found for "${topic}". Try a broader term.`,
          sentiment: { positive: 0, neutral: 0, negative: 0 },
          themes: [],
          posts: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2) Send to Lovable AI for structured analysis
    const compact = posts.map((p, i) => ({
      i,
      sub: p.subreddit,
      title: p.title,
      body: p.selftext.slice(0, 300),
      score: p.score,
    }));

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a public opinion analyst. Read Reddit posts and produce a sharp editorial summary, classify sentiment per post, and surface dominant themes. Be objective and concise. Use plain language.",
          },
          {
            role: "user",
            content: `Topic: "${topic}"\n\nReddit posts (JSON):\n${JSON.stringify(
              compact,
            )}\n\nClassify each post's sentiment about the topic and produce overall analysis.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_opinion",
              description: "Return structured public opinion analysis",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "2-3 sentence editorial summary of overall opinion",
                  },
                  overall_sentiment: {
                    type: "string",
                    enum: ["positive", "neutral", "negative", "mixed"],
                  },
                  themes: {
                    type: "array",
                    description: "3-6 dominant themes or talking points",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        description: { type: "string" },
                        sentiment: {
                          type: "string",
                          enum: ["positive", "neutral", "negative"],
                        },
                      },
                      required: ["label", "description", "sentiment"],
                    },
                  },
                  classifications: {
                    type: "array",
                    description: "Sentiment per post in input order, by index i",
                    items: {
                      type: "object",
                      properties: {
                        i: { type: "number" },
                        sentiment: {
                          type: "string",
                          enum: ["positive", "neutral", "negative"],
                        },
                        reason: { type: "string" },
                      },
                      required: ["i", "sentiment", "reason"],
                    },
                  },
                },
                required: ["summary", "overall_sentiment", "themes", "classifications"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_opinion" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, t);
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments
      ? JSON.parse(toolCall.function.arguments)
      : null;

    if (!args) {
      console.error("No tool call returned", aiJson);
      return new Response(
        JSON.stringify({ error: "AI returned no analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Merge classifications back into posts
    const sentimentByIndex = new Map<number, { sentiment: string; reason: string }>();
    for (const c of args.classifications ?? []) {
      sentimentByIndex.set(c.i, { sentiment: c.sentiment, reason: c.reason });
    }

    const enrichedPosts = posts.map((p, i) => ({
      ...p,
      sentiment: sentimentByIndex.get(i)?.sentiment ?? "neutral",
      reason: sentimentByIndex.get(i)?.reason ?? "",
    }));

    const counts = { positive: 0, neutral: 0, negative: 0 };
    for (const p of enrichedPosts) {
      counts[p.sentiment as keyof typeof counts] =
        (counts[p.sentiment as keyof typeof counts] ?? 0) + 1;
    }

    return new Response(
      JSON.stringify({
        topic,
        totalPosts: enrichedPosts.length,
        summary: args.summary,
        overallSentiment: args.overall_sentiment,
        themes: args.themes ?? [],
        sentiment: counts,
        posts: enrichedPosts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("analyze-opinion error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
