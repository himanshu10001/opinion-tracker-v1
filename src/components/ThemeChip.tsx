interface Props {
  label: string;
  description: string;
  sentiment: "positive" | "neutral" | "negative";
  index: number;
}

const dot: Record<string, string> = {
  positive: "bg-positive",
  neutral: "bg-neutral",
  negative: "bg-negative",
};

export const ThemeChip = ({ label, description, sentiment, index }: Props) => (
  <div className="border-2 border-foreground bg-card p-5 hover:bg-foreground hover:text-background transition-colors group">
    <div className="flex items-center justify-between mb-3">
      <span className="font-mono text-xs uppercase tracking-widest opacity-60">
        №{String(index).padStart(2, "0")}
      </span>
      <span className={`w-2.5 h-2.5 ${dot[sentiment]}`} />
    </div>
    <h4 className="font-display font-bold text-xl leading-tight mb-2">{label}</h4>
    <p className="text-sm opacity-80 leading-snug">{description}</p>
  </div>
);
