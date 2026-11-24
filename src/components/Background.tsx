"use client";

import { useEffect, useRef } from "react";

type Star = { x: number; y: number; z: number; r: number; phase: number; speed: number };
type Meteor = { x: number; y: number; progress: number; speed: number };

// Wallpaper: lantai grid (CSS) + bintang & bintang jatuh (canvas)
export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let meteors: Meteor[] = [];
    let mouseX = 0;
    let mouseY = 0;
    let offsetX = 0;
    let offsetY = 0;
    let frame = 0;

    function resize() {
      const small = window.innerWidth < 700; // di HP dibikin lebih ringan
      const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);

      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round((width * height) / (small ? 9000 : 5500));
      stars = Array.from({ length: count }, () => {
        const z = Math.random(); // z = kedalaman, makin besar makin dekat
        return {
          x: Math.random() * width,
          y: Math.random() * height * 0.8,
          z,
          r: 0.3 + z * 1.3,
          phase: Math.random() * Math.PI * 2,
          speed: 0.3 + Math.random() * 0.9,
        };
      });
    }

    function handlePointerMove(e: PointerEvent) {
      mouseX = e.clientX / width - 0.5;
      mouseY = e.clientY / height - 0.5;
    }

    function draw(time: number) {
      // gerak parallax dibikin halus
      offsetX += (mouseX - offsetX) * 0.05;
      offsetY += (mouseY - offsetY) * 0.05;
      ctx.clearRect(0, 0, width, height);

      for (const s of stars) {
        const twinkle = reduceMotion ? 0.6 : 0.2 + 0.8 * Math.abs(Math.sin((time / 1000) * s.speed + s.phase));
        ctx.fillStyle = `rgba(235,235,240,${twinkle * (0.35 + s.z * 0.65)})`;
        ctx.beginPath();
        ctx.arc(s.x - offsetX * s.z * 26, s.y - offsetY * s.z * 26, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (reduceMotion) return;

      if (meteors.length < 2 && Math.random() < 0.007) {
        meteors.push({
          x: Math.random() * width * 0.8,
          y: Math.random() * height * 0.35,
          progress: 0,
          speed: 9 + Math.random() * 7,
        });
      }

      meteors = meteors.filter((m) => {
        m.progress += m.speed;
        const headX = m.x + m.progress * 0.87;
        const headY = m.y + m.progress * 0.5;
        const gradient = ctx.createLinearGradient(headX, headY, headX - 130, headY - 75);
        gradient.addColorStop(0, "rgba(255,255,255,0.95)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(headX - 130, headY - 75);
        ctx.stroke();

        return m.progress < 800;
      });

      frame = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove);
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <>
      <div className="bg" aria-hidden="true">
        <div className="floor" />
      </div>
      <canvas ref={canvasRef} id="fx" aria-hidden="true" />
    </>
  );
}
