export default function Header() {
  return (
    <header className="border-b border-[var(--color-celeste-light)] bg-white/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
        <img src="/logo.jpg" alt="Celeste Logo" className="w-8 h-8 rounded-xl shadow-sm object-cover" />
        <h1 className="text-xl font-bold text-[var(--color-celeste-text)]">Celeste</h1>
      </div>
    </header>
  );
}
