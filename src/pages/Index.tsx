import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Search, TrendingUp, MessageCircle, ArrowUpRight, Sparkles } from "lucide-react";
import { SentimentChart } from "@/components/SentimentChart";
import { PostCard, type AnalyzedPost } from "@/components/PostCard";
import { ThemeChip } from "@/components/ThemeChip";

interface Analysis {
  topic: string;
  totalPosts: number;
  summary: string;
  overallSentiment?: "positive" | "neutral" | "negative" | "mixed";
  themes: { label: string; description: string; sentiment: "positive" | "neutral" | "negative" }[];
  sentiment: { positive: number; neutral: number; negative: number };
  posts: AnalyzedPost[];
}

const SUGGESTED = ["Artificial Intelligence", "Tesla", "Climate Change", "Bitcoin", "Remote Work"];

const Index = () => {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Analysis | null>(null);
  const [istTime, setIstTime] = useState<string>(() =>
    new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour12: false })
  );

  useEffect(() => {
    const id = setInterval(() => {
      setIstTime(
        new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour12: false })
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const analyze = async (q: string) => {
    const term = q.trim();
    if (!term) {
      toast.error("Enter a topic to analyze");
      return;
    }
    setLoading(true);
    setData(null);
    try {
      const { data: res, error } = await supabase.functions.invoke("analyze-opinion", {
        body: { topic: term },
      });
      if (error) throw error;
      if ((res as any)?.error) throw new Error((res as any).error);
      setData(res as Analysis);
      if ((res as Analysis).totalPosts === 0) {
        toast.info("No posts found — try a broader topic");
      } else {
        toast.success(`Analyzed ${(res as Analysis).totalPosts} posts`);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    analyze(topic);
  };

  return (
    <div className="min-h-screen bg-background grain">
      {/* Masthead */}
      <header className="border-b-[3px] border-foreground">
        <div className="container py-3 flex items-center justify-between text-xs font-mono uppercase tracking-widest">
          <span>{istTime} IST</span>
          <span className="hidden sm:inline">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          <span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> AI Edition</span>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-foreground/20">
        <div className="container py-10 md:py-16">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-accent text-accent-foreground text-xs font-bold uppercase tracking-widest px-2 py-1">Live</span>
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Public Opinion Tracker</span>
          </div>
          <h1 className="font-display font-black text-5xl md:text-7xl lg:text-8xl leading-[0.9] mb-6">
            What does the<br />
            <span className="italic text-accent">internet</span> think
            <br />about <span className="underline decoration-highlight decoration-[6px] underline-offset-4">anything</span>?
          </h1>
          <p className="text-lg md:text-xl max-w-2xl text-muted-foreground font-display">
            Type a topic. We'll pull the latest Reddit chatter and let AI read the room — sentiment, themes, the whole pulse.
          </p>

          <form onSubmit={onSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. ChatGPT, electric cars, Taylor Swift…"
                className="pl-12 h-14 text-base border-2 border-foreground rounded-none bg-card focus-visible:ring-accent focus-visible:ring-offset-0"
                disabled={loading}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-14 px-8 rounded-none bg-foreground text-background hover:bg-accent uppercase tracking-widest font-bold text-sm"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "ANALYZE"}
            </Button>
          </form>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground mr-1">Try:</span>
            {SUGGESTED.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setTopic(s); analyze(s); }}
                disabled={loading}
                className="text-xs font-medium px-3 py-1.5 border border-foreground/40 hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Loading skeleton */}
      {loading && (
        <section className="container py-16 text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-accent" />
          <p className="mt-4 font-mono uppercase tracking-widest text-sm text-muted-foreground">
            Pulling Reddit · Analyzing sentiment · Distilling themes
          </p>
        </section>
      )}

      {/* Results */}
      {data && !loading && (
        <>
          {/* Headline + summary */}
          <section className="border-b border-foreground/20">
            <div className="container py-12 grid md:grid-cols-3 gap-10">
              <div className="md:col-span-2">
                <div className="text-xs font-mono uppercase tracking-widest text-accent mb-3">The Verdict on</div>
                <h2 className="font-display font-black text-4xl md:text-6xl leading-[0.95] mb-6 capitalize">
                  {data.topic}
                </h2>
                <p className="font-display text-xl md:text-2xl leading-snug">
                  {data.summary}
                </p>
              </div>
              <aside className="space-y-4">
                <Stat label="Posts analyzed" value={data.totalPosts} icon={MessageCircle} />
                <Stat
                  label="Overall mood"
                  value={(data.overallSentiment ?? "mixed").toUpperCase()}
                  icon={TrendingUp}
                  highlight
                />
              </aside>
            </div>
          </section>

          {/* Sentiment chart */}
          <section className="border-b border-foreground/20 bg-card">
            <div className="container py-12 grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Section II</div>
                <h3 className="font-display font-bold text-3xl md:text-4xl mb-4">By the Numbers</h3>
                <p className="text-muted-foreground">
                  How the conversation breaks down across the {data.totalPosts} most relevant posts from the past month.
                </p>
                <div className="mt-6 space-y-2 font-mono text-sm">
                  <Row color="positive" label="Positive" v={data.sentiment.positive} total={data.totalPosts} />
                  <Row color="neutral" label="Neutral" v={data.sentiment.neutral} total={data.totalPosts} />
                  <Row color="negative" label="Negative" v={data.sentiment.negative} total={data.totalPosts} />
                </div>
              </div>
              <div className="h-[320px]">
                <SentimentChart data={data.sentiment} />
              </div>
            </div>
          </section>

          {/* Themes */}
          {data.themes.length > 0 && (
            <section className="border-b border-foreground/20">
              <div className="container py-12">
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Section III</div>
                <h3 className="font-display font-bold text-3xl md:text-4xl mb-8">Dominant Themes</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.themes.map((t, i) => (
                    <ThemeChip key={i} {...t} index={i + 1} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Posts */}
          {data.posts.length > 0 && (
            <section>
              <div className="container py-12">
                <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
                  <div>
                    <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">Section IV</div>
                    <h3 className="font-display font-bold text-3xl md:text-4xl">Voices from the Field</h3>
                  </div>
                  <a
                    href={`https://www.reddit.com/search/?q=${encodeURIComponent(data.topic)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono uppercase tracking-widest flex items-center gap-1 hover:text-accent"
                  >
                    See on Reddit <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  {data.posts.map((p) => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* Empty footer */}
      {!data && !loading && (
        <section className="container py-20 text-center text-muted-foreground">
          <p className="font-mono text-xs uppercase tracking-widest">Awaiting your topic</p>
        </section>
      )}

      <footer className="border-t-[3px] border-foreground mt-10">
        <div className="container py-6 flex items-center justify-end text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <span>Powered by Reddit + AI</span>
        </div>
      </footer>
    </div>
  );
};

const Stat = ({ label, value, icon: Icon, highlight }: { label: string; value: string | number; icon: any; highlight?: boolean }) => (
  <div className={`border-2 border-foreground p-5 ${highlight ? "bg-accent text-accent-foreground" : "bg-card"}`}>
    <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest opacity-70">
      <span>{label}</span>
      <Icon className="h-4 w-4" />
    </div>
    <div className="font-display font-black text-4xl mt-2">{value}</div>
  </div>
);

const Row = ({ color, label, v, total }: { color: "positive" | "neutral" | "negative"; label: string; v: number; total: number }) => {
  const pct = total ? Math.round((v / total) * 100) : 0;
  const bg = color === "positive" ? "bg-positive" : color === "neutral" ? "bg-neutral" : "bg-negative";
  return (
    <div className="flex items-center gap-3">
      <span className={`w-3 h-3 ${bg}`} />
      <span className="w-20 uppercase">{label}</span>
      <div className="flex-1 h-2 bg-secondary relative overflow-hidden">
        <div className={`h-full ${bg}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right">{pct}%</span>
    </div>
  );
};

export default Index;
