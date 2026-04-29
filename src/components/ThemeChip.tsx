import { ArrowUpRight } from "lucide-react";

interface Props {
  label: string;
  description: string;
  sentiment: "positive" | "neutral" | "negative";
  index: number;
  topic?: string;
}

const dot: Record<string, string> = {
  positive: "bg-positive",
  neutral: "bg-neutral",
  negative: "bg-negative",
};

export const ThemeChip = ({ label, description, sentiment, index, topic }: Props) => {
  const query = topic ? `${topic} ${label}` : label;
  const href = `https://www.reddit.com/search/?q=${encodeURIComponent(query)}&sort=relevance`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block border-2 border-foreground bg-card p-5 hover:bg-foreground hover:text-background transition-colors"
      aria-label={`Search Reddit for ${label}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs uppercase tracking-widest opacity-60">
          №{String(index).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 ${dot[sentiment]}`} />
          <ArrowUpRight className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <h4 className="font-display font-bold text-xl leading-tight mb-2">{label}</h4>
      <p className="text-sm opacity-80 leading-snug">{description}</p>
    </a>
  );
};
