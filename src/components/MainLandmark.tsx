import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type MainLandmarkProps = {
  children: ReactNode;
  className?: string;
} & Omit<HTMLAttributes<HTMLElement>, "id">;

/**
 * Conteúdo principal da página — alvo do link “Pular para o conteúdo”.
 */
export function MainLandmark({ children, className, ...rest }: MainLandmarkProps) {
  return (
    <main
      id="main"
      tabIndex={-1}
      className={cn("outline-none", className)}
      {...rest}
    >
      {children}
    </main>
  );
}
