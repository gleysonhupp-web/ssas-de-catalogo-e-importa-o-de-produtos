"use client";

import { useEffect } from "react";

// Movimento da landing: revela as seções ao rolar, inclina o palco 3D do topo conforme o mouse
// e inclina os cartões marcados com data-tilt. Quem pede menos movimento no sistema recebe a página parada.
export function LandingMotion() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealed = document.querySelectorAll<HTMLElement>("[data-reveal]");

    if (reduce || !("IntersectionObserver" in window)) {
      revealed.forEach((el) => el.classList.add("is-in"));
      return;
    }
    root.classList.add("lp-motion");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    revealed.forEach((el) => io.observe(el));

    const hero = document.querySelector<HTMLElement>(".lp-hero");
    let frame = 0;
    let px = 0;
    let py = 0;
    function paint() {
      frame = 0;
      if (!hero) return;
      const progress = Math.min(window.scrollY / Math.max(hero.offsetHeight, 1), 1);
      hero.style.setProperty("--mx", px.toFixed(3));
      hero.style.setProperty("--my", py.toFixed(3));
      hero.style.setProperty("--scroll", progress.toFixed(3));
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(paint);
    }
    function onPointer(e: PointerEvent) {
      px = e.clientX / window.innerWidth - 0.5;
      py = e.clientY / window.innerHeight - 0.5;
      schedule();
    }
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    paint();

    const tilts = Array.from(document.querySelectorAll<HTMLElement>("[data-tilt]"));
    const cleanups = tilts.map((el) => {
      function move(e: PointerEvent) {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--tx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        el.style.setProperty("--ty", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      }
      function leave() {
        el.style.setProperty("--tx", "0");
        el.style.setProperty("--ty", "0");
      }
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      return () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      };
    });

    return () => {
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", schedule);
      if (frame) cancelAnimationFrame(frame);
      cleanups.forEach((c) => c());
      root.classList.remove("lp-motion");
    };
  }, []);

  return null;
}
