import { useEffect, useRef } from 'react';

export default function MouseAura() {
  const canvasRef = useRef(null);
  const spotlightRef = useRef(null);

  useEffect(() => {
    // Only run on devices with a fine pointer (mouse/trackpad), not touch-only
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!hasFinePointer || prefersReducedMotion) return;

    const canvas = canvasRef.current;
    const spotlight = spotlightRef.current;
    if (!canvas || !spotlight) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId = null;

    // Handle canvas sizing
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse coordinates tracking
    let targetX = -500;
    let targetY = -500;
    let currentX = -500;
    let currentY = -500;
    let isVisible = false;
    let isMouseDown = false;

    // Particles array
    const particles = [];
    const maxParticles = 60;

    // Warm Asian/Himalayan inspired palette
    const colorsLight = [
      'rgba(201, 154, 60, 0.75)',  // Warm gold
      'rgba(200, 54, 42, 0.65)',   // Seal red
      'rgba(224, 120, 60, 0.7)',   // Amber
      'rgba(46, 107, 87, 0.55)',   // Soft jade
    ];

    const colorsDark = [
      'rgba(255, 209, 102, 0.85)', // Radiant gold
      'rgba(238, 90, 78, 0.8)',    // Incandescent red
      'rgba(244, 162, 97, 0.8)',   // Glowing amber
      'rgba(74, 155, 129, 0.75)',  // Bright jade
    ];

    const getColors = () => {
      return document.documentElement.classList.contains('dark') ? colorsDark : colorsLight;
    };

    class Particle {
      constructor(x, y, isBurst = false) {
        this.x = x;
        this.y = y;
        const colors = getColors();
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.radius = Math.random() * (isBurst ? 2.8 : 2) + 0.8;
        this.originalRadius = this.radius;

        const speed = isBurst ? Math.random() * 3.5 + 1.2 : Math.random() * 1.4 + 0.3;
        const angle = isBurst ? Math.random() * Math.PI * 2 : Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - (isBurst ? 0.5 : 0.8); // float gently upward
        this.life = 1;
        this.decay = Math.random() * (isBurst ? 0.028 : 0.038) + 0.018;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.96;
        this.vy *= 0.96;
        this.life -= this.decay;
        this.radius = Math.max(0, this.originalRadius * this.life);
      }

      draw(c) {
        if (this.life <= 0) return;
        c.save();
        c.globalAlpha = Math.max(0, this.life);
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.shadowColor = this.color;
        c.shadowBlur = 6;
        c.fill();
        c.restore();
      }
    }

    const spawnParticles = (x, y, count = 2, isBurst = false) => {
      for (let i = 0; i < count; i++) {
        if (particles.length < maxParticles) {
          particles.push(new Particle(x, y, isBurst));
        }
      }
    };

    // Event listeners
    const onMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isVisible) {
        currentX = targetX;
        currentY = targetY;
        isVisible = true;
        spotlight.style.opacity = '1';
      }

      // Add 1-2 particles as cursor moves
      if (Math.random() > 0.35) {
        spawnParticles(targetX, targetY, 1);
      }
    };

    const onMouseDown = (e) => {
      isMouseDown = true;
      spotlight.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(1.35)`;
      // Click burst effect: small ring of ember sparks
      spawnParticles(e.clientX, e.clientY, 8, true);
    };

    const onMouseUp = () => {
      isMouseDown = false;
      spotlight.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(1)`;
    };

    const onMouseLeave = () => {
      isVisible = false;
      spotlight.style.opacity = '0';
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    // Animation Loop (lerp spotlight + render particles)
    const animate = () => {
      // Lerp spotlight position for smooth trailing momentum
      if (isVisible) {
        currentX += (targetX - currentX) * 0.14;
        currentY += (targetY - currentY) * 0.14;
        const scale = isMouseDown ? 1.35 : 1;
        spotlight.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(${scale})`;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render & update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="mouse-aura-container" aria-hidden="true">
      <div ref={spotlightRef} className="mouse-spotlight" />
      <canvas ref={canvasRef} className="mouse-particle-canvas" />
    </div>
  );
}
