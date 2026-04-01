import React, { useEffect, useRef } from 'react';

const ParticleBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    let particles = [];
    let mouse = { x: null, y: null, radius: 200 };

    const colors = ['#4f8ef7', '#6c63ff', '#8b5cf6', '#00f2fe', '#e0e7ff'];

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      init();
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseOut = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);

    class Particle {
      constructor(x, y, dx, dy, size, color) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.size = size;
        this.color = color;
        this.baseSize = size;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        ctx.fill();
        ctx.closePath();
      }
      update() {
        if (this.x > w || this.x < 0) this.dx = -this.dx;
        if (this.y > h || this.y < 0) this.dy = -this.dy;

        // Interaction
        if (mouse.x != null && mouse.y != null) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouse.radius) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouse.radius - distance) / mouse.radius;
            const directionX = forceDirectionX * force * 4;
            const directionY = forceDirectionY * force * 4;
            
            this.x -= directionX;
            this.y -= directionY;
            if (this.size < this.baseSize * 2) {
              this.size += 0.5;
            }
          } else if (this.size > this.baseSize) {
            this.size -= 0.1;
          }
        } else if (this.size > this.baseSize) {
            this.size -= 0.1;
        }

        this.x += this.dx;
        this.y += this.dy;
        // Bounce off bounds
        if(this.x < 0) this.x = 0; if (this.x > w) this.x = w;
        if(this.y < 0) this.y = 0; if (this.y > h) this.y = h;

        this.draw();
      }
    }

    function init() {
      particles = [];
      const numberOfParticles = Math.floor((w * h) / 9000); 
      for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 2) + 0.5;
        let x = (Math.random() * (w - size * 2) + size * 2);
        let y = (Math.random() * (h - size * 2) + size * 2);
        let dx = (Math.random() - 0.5) * 1.0;
        let dy = (Math.random() - 0.5) * 1.0;
        let color = colors[Math.floor(Math.random() * colors.length)];
        particles.push(new Particle(x, y, dx, dy, size, color));
      }
    }

    function connect() {
      let opacityValue = 1;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          let distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x)) + 
                         ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
          
          if (distance < 25000) { 
            opacityValue = 1 - (distance / 25000);
            if (opacityValue > 0) {
                // Enhance line glow when mouse is nearby
                const isNearMouse = mouse.x != null && Math.sqrt(
                  Math.pow(particles[a].x - mouse.x, 2) + Math.pow(particles[a].y - mouse.y, 2)
                ) < 250;
                
                ctx.strokeStyle = `rgba(${isNearMouse ? '139, 92, 246' : '108, 99, 255'}, ${opacityValue * (isNearMouse ? 0.8 : 0.3)})`;
                ctx.shadowBlur = isNearMouse ? 8 : 0;
                ctx.shadowColor = `rgba(139, 92, 246, 0.5)`;
                ctx.lineWidth = isNearMouse ? 1.5 : 0.8;
                
                ctx.beginPath();
                ctx.moveTo(particles[a].x, particles[a].y);
                ctx.lineTo(particles[b].x, particles[b].y);
                ctx.stroke();
            }
          }
        }
      }
    }

    let animationFrameId;
    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, w, h);
      
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, '#020610'); 
      gradient.addColorStop(0.5, '#05112B'); 
      gradient.addColorStop(1, '#020610'); 
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
      }
      connect();
    }

    init();
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
    }
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',  // So user can still click UI elements on top!
        background: 'transparent'
      }}
    />
  );
};

export default ParticleBackground;
