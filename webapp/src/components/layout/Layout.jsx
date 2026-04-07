import { useEffect } from 'react';

export default function Layout({ children }) {
  useEffect(() => {
    const savedColor = localStorage.getItem('navi_community_color');
    if (savedColor) {
      document.documentElement.style.setProperty('--theme-color', savedColor);
    }
  }, []);
  return (
    <div className="min-h-screen w-full px-3 py-3 text-gray-900 selection:bg-brand-200 sm:px-5 sm:py-5">
      <main className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col rounded-[30px] border border-white/70 shell-panel sm:min-h-[calc(100vh-2.5rem)]">
        <div className="flex items-center justify-between px-6 pb-2 pt-6 sm:px-10">
          <div className="text-left">
            <p className="navi-eyebrow">Mentoría Estudiantil</p>
            <p className="mt-2 font-display text-[1.5rem] font-semibold tracking-[-0.04em] text-[var(--navy-700)]">
              Ruta guiada de acompañamiento
            </p>
          </div>
          <div className="hidden text-right text-xs font-medium text-[var(--ink-700)] sm:block">
            <p className="text-sm">Tecnológico de Monterrey</p>
          </div>
        </div>

        <div className="flex-1 px-6 pb-8 pt-2 sm:px-10 sm:pb-10">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>

        <footer className="px-6 pb-6 text-center text-sm text-[var(--ink-700)] sm:px-10">
          <p>Tecnológico de Monterrey &copy; {new Date().getFullYear()}</p>
        </footer>
      </main>
    </div>
  );
}
