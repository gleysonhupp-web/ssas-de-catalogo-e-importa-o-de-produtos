"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

// O tema escolhido fica no navegador; sem escolha, vale o do sistema.
// O script em layout.tsx aplica o tema antes da página aparecer, para não piscar.
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("tema", next);
    } catch {
      // Navegação privada ou armazenamento bloqueado: o tema vale só para esta página.
    }
    setTheme(next);
  }

  const label = theme === "dark" ? "Tema claro" : "Tema escuro";
  return (
    <button type="button" className="side-link side-button" onClick={toggle} aria-label={`Mudar para ${label.toLowerCase()}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {theme === "dark" ? (
          <path d="M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        ) : (
          <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
        )}
      </svg>
      <span>{theme ? label : "Tema"}</span>
    </button>
  );
}
