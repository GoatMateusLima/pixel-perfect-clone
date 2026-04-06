/**
 * Primeiro elemento focalizável recomendado: pula navegação repetitiva.
 */
export function SkipToMainLink() {
  return (
    <a
      href="#main"
      className={
        "fixed left-4 top-0 z-[10001] -translate-y-[120%] px-4 py-3 rounded-md font-accent text-sm font-bold " +
        "bg-primary text-primary-foreground shadow-lg transition-transform duration-200 " +
        "outline-none focus:translate-y-4 focus-visible:ring-2 focus-visible:ring-ring " +
        "focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      }
    >
      Pular para o conteúdo
    </a>
  );
}
