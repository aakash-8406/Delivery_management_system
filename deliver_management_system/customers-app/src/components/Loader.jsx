const Loader = ({ text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div className="w-12 h-12 border-4 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin" />
    <p className="text-[var(--muted-foreground)] text-sm">{text}</p>
  </div>
);
export default Loader;
