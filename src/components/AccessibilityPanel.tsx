import { useId, useState } from "react";
import { Accessibility, RotateCcw } from "lucide-react";
import { useAccessibility } from "@/contexts/AccessibilityContext";
import type { ReduceMotionPreference, TextScale } from "@/contexts/AccessibilityContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const TEXT_SCALE_OPTIONS: { value: TextScale; label: string }[] = [
  { value: "base", label: "Padrão" },
  { value: "lg", label: "Maior" },
  { value: "xl", label: "Muito maior" },
];

const MOTION_OPTIONS: { value: ReduceMotionPreference; label: string }[] = [
  { value: "system", label: "Automático (sistema)" },
  { value: "on", label: "Reduzir animações" },
  { value: "off", label: "Animações normais" },
];

type AccessibilityTriggerProps = {
  variant: "hero" | "header";
  className?: string;
};

export function AccessibilityTrigger({ variant, className }: AccessibilityTriggerProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descId = useId();

  const {
    preferences,
    setTextScale,
    setHighContrast,
    setReduceMotion,
    setReadingSpacing,
    setUnderlineLinks,
    setStrongFocus,
    resetPreferences,
    systemPrefersReducedMotion,
  } = useAccessibility();

  const motionHint =
    preferences.reduceMotion === "system"
      ? systemPrefersReducedMotion
        ? "O sistema está com “reduzir movimento” ativo."
        : "O sistema permite animações."
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md border border-primary/40 bg-background/90 text-foreground shadow-md backdrop-blur-sm",
          "transition-colors hover:bg-primary/15 hover:border-primary/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          variant === "hero" &&
            "absolute right-4 top-[4.5rem] z-20 px-3 py-2 text-xs font-accent font-bold uppercase tracking-widest sm:right-8",
          variant === "header" && "h-9 w-9 sm:h-10 sm:w-10 shrink-0 p-0",
          className,
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Accessibility className="h-[1.1rem] w-[1.1rem] sm:h-5 sm:w-5 text-primary" aria-hidden />
        {variant === "hero" && <span>Acessibilidade</span>}
        {variant === "header" && (
          <span className="sr-only">Abrir painel de acessibilidade</span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto border-primary/25 sm:max-w-md"
          aria-describedby={descId}
        >
          <DialogHeader>
            <DialogTitle id={titleId}>Acessibilidade</DialogTitle>
            <DialogDescription id={descId}>
              Ajuste a leitura e o contraste. As opções são salvas neste dispositivo.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6 py-2">
            <a
              href="#main"
              className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/90"
              onClick={() => setOpen(false)}
            >
              Pular para o conteúdo principal
            </a>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Tamanho do texto</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Tamanho do texto">
                {TEXT_SCALE_OPTIONS.map(({ value, label }) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={preferences.textScale === value ? "default" : "outline"}
                    className="font-accent"
                    onClick={() => setTextScale(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Animações e movimento</p>
              <div className="flex flex-col gap-2" role="radiogroup" aria-label="Animações">
                {MOTION_OPTIONS.map(({ value, label }) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={preferences.reduceMotion === value ? "default" : "outline"}
                    className="w-full justify-start font-accent font-semibold"
                    onClick={() => setReduceMotion(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              {motionHint && (
                <p className="text-xs text-muted-foreground">{motionHint}</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 rounded-md border border-border/60 px-3 py-3">
              <Label htmlFor="a11y-contrast" className="text-sm font-medium leading-snug cursor-pointer">
                Contraste aumentado
              </Label>
              <Switch
                id="a11y-contrast"
                checked={preferences.highContrast}
                onCheckedChange={setHighContrast}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-md border border-border/60 px-3 py-3">
              <Label htmlFor="a11y-spacing" className="text-sm font-medium leading-snug cursor-pointer">
                Espaçamento de leitura
              </Label>
              <Switch
                id="a11y-spacing"
                checked={preferences.readingSpacing}
                onCheckedChange={setReadingSpacing}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-md border border-border/60 px-3 py-3">
              <Label htmlFor="a11y-links" className="text-sm font-medium leading-snug cursor-pointer">
                Sublinhar links
              </Label>
              <Switch
                id="a11y-links"
                checked={preferences.underlineLinks}
                onCheckedChange={setUnderlineLinks}
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-md border border-border/60 px-3 py-3">
              <Label htmlFor="a11y-focus" className="text-sm font-medium leading-snug cursor-pointer">
                Foco do teclado mais visível
              </Label>
              <Switch
                id="a11y-focus"
                checked={preferences.strongFocus}
                onCheckedChange={setStrongFocus}
              />
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              className="w-full font-accent"
              onClick={() => {
                resetPreferences();
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar padrões
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
