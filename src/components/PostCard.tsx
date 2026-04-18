import { ArrowUpRight, MessageSquare, ArrowUp } from "lucide-react";

export interface AnalyzedPost {
  id: string;
  title: string;
  selftext: string;
  subreddit: string;
  score: number;
  num_comments: number;
  permalink: string;
  created_utc: number;
  author: string;
  sentiment: "positive" | "neutral" | "negative" | string;
  reason: string;
}

const sentimentStyles: Record<string, { bg: string; label: string }> = {
  positive: { bg: "bg-positive text-white", label: "Positive" },
  neutral: { bg: "bg-neutral text-foreground", label: "Neutral" },
  negative: { bg: "bg-negative text-white", label: "Negative" },
};

export const PostCard = ({ post }: { post: AnalyzedPost }) => {
  const s = sentimentStyles[post.sentiment] ?? sentimentStyles.neutral;
  const date = new Date(post.created_utc * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-card border-2 border-foreground p-5 hover:bg-foreground hover:text-background transition-colors"
    >
      <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest mb-3">
        <span className="opacity-70">r/{post.subreddit} · {date}</span>
        <span className={`px-2 py-0.5 ${s.bg} group-hover:bg-background group-hover:text-foreground`}>
          {s.label}
        </span>
      </div>

      <h4 className="font-display font-bold text-lg leading-tight mb-2 line-clamp-3">
        {post.title}
      </h4>

      {post.reason && (
        <p className="text-sm opacity-80 italic mb-3 line-clamp-2">
          "{post.reason}"
        </p>
      )}

      <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest opacity-70">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><ArrowUp className="h-3 w-3" />{formatNum(post.score)}</span>
          <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{formatNum(post.num_comments)}</span>
        </div>
        <ArrowUpRight className="h-4 w-4" />
      </div>
    </a>
  );
};

const formatNum = (n: number) => (n >= 1000 ? (n / 1000).toFixed(1) + "k" : n.toString());
