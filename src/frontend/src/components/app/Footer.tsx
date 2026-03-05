export function Footer() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  return (
    <footer className="border-t border-border bg-[oklch(0.08_0_0)] mt-10">
      <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-baseline gap-1">
          <span className="font-display text-sm font-black uppercase tracking-tighter text-brand-red">
            Daily Brief
          </span>
          <span className="font-display text-sm font-black uppercase tracking-tighter text-foreground">
            Global
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground font-bold uppercase tracking-wider">
          <span>© {year}</span>
          <span>·</span>
          <a
            href={caffeineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-red transition-colors duration-200"
          >
            Built with ♥ on caffeine.ai
          </a>
        </div>

        {/* Tagline */}
        <p className="text-xs text-muted-foreground/50 font-bold uppercase tracking-widest">
          Viral. Raw. Unfiltered.
        </p>
      </div>
    </footer>
  );
}
