// Simple scrollytelling reveal using IntersectionObserver

document.addEventListener("DOMContentLoaded", () => {
  const projects = document.querySelectorAll(".project");

  if (!("IntersectionObserver" in window)) {
    projects.forEach((project) => project.classList.add("in-view"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.25,
    }
  );

  projects.forEach((project) => observer.observe(project));

  // Cursor pixelation effect
  const canvas = document.getElementById("pixel-canvas");
  const wrapper = document.querySelector(".cursor-pixel-wrapper");
  if (!canvas || !wrapper) return;

  const ctx = canvas.getContext("2d");
  const radius = 80; // Display radius around cursor
  const zoomFactor = 2.5; // How much to zoom in (larger = more zoom)
  const captureRadius = radius / zoomFactor; // Smaller capture area = more zoom
  const pixelSize = 2; // Minimal pixelation for readability
  
  canvas.width = radius * 2;
  canvas.height = radius * 2;

  let mouseX = 0;
  let mouseY = 0;
  let isHovering = false;
  let animationFrame = null;
  let pixelEnabled = true;

  let lastCaptureTime = 0;
  const captureThrottle = 50; // ms between captures

  function captureAndPixelate() {
    if (!isHovering || !pixelEnabled) return;

    const now = Date.now();
    if (now - lastCaptureTime < captureThrottle) {
      if (isHovering) {
        animationFrame = requestAnimationFrame(captureAndPixelate);
      }
      return;
    }
    lastCaptureTime = now;

    // Calculate absolute position accounting for scroll
    const absoluteX = mouseX + window.scrollX;
    const absoluteY = mouseY + window.scrollY;

    // Try to capture the screen using html2canvas if available
    if (typeof html2canvas !== "undefined") {
      // Capture a larger area around cursor for better quality
      const captureArea = captureRadius * 2;
      
      html2canvas(document.body, {
        x: absoluteX - captureRadius,
        y: absoluteY - captureRadius,
        width: captureArea,
        height: captureArea,
        scale: zoomFactor,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scrollX: 0,
        scrollY: 0,
        logging: false,
      }).then((capturedCanvas) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // First draw the zoomed content smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(capturedCanvas, 0, 0, radius * 2, radius * 2);
        
        // Then apply subtle pixelation effect
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        tempCanvas.width = Math.floor((radius * 2) / pixelSize);
        tempCanvas.height = Math.floor((radius * 2) / pixelSize);
        
        tempCtx.imageSmoothingEnabled = false;
        tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, radius * 2, radius * 2);
      }).catch((error) => {
        console.log("Capture error:", error);
        // Fallback if html2canvas fails
        drawFallbackPixelation();
      });
    } else {
      // Fallback: visual pixelation effect
      drawFallbackPixelation();
    }

    if (isHovering) {
      animationFrame = requestAnimationFrame(captureAndPixelate);
    }
  }

  function drawFallbackPixelation() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create a pixelated grid effect
    const gridSize = pixelSize;
    for (let x = 0; x < canvas.width; x += gridSize) {
      for (let y = 0; y < canvas.height; y += gridSize) {
        // Create a checkerboard-like pixelation
        const isEven = ((x / gridSize) + (y / gridSize)) % 2 === 0;
        const gray = isEven ? 200 : 50;
        ctx.fillStyle = `rgba(${gray}, ${gray}, ${gray}, 0.4)`;
        ctx.fillRect(x, y, gridSize, gridSize);
      }
    }
  }

  document.addEventListener("mousemove", (e) => {
    if (!pixelEnabled) return;

    mouseX = e.clientX;
    mouseY = e.clientY;
    canvas.style.left = `${mouseX}px`;
    canvas.style.top = `${mouseY}px`;
    
    if (!isHovering) {
      isHovering = true;
      captureAndPixelate();
    }
  });

  document.addEventListener("mouseleave", () => {
    isHovering = false;
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  // Toggle pixelation on double-click (left mouse)
  document.addEventListener("dblclick", (e) => {
    // Only react to primary button
    if (e.button !== 0) return;

    pixelEnabled = !pixelEnabled;

    if (!pixelEnabled) {
      // Turn effect off
      wrapper.classList.add("pixel-off");
      isHovering = false;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    } else {
      // Turn effect on
      wrapper.classList.remove("pixel-off");
    }
  });

  // Update capture on scroll
  let scrollTimeout;
  window.addEventListener("scroll", () => {
    if (isHovering && pixelEnabled) {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (isHovering && pixelEnabled) {
          lastCaptureTime = 0; // Force immediate recapture
          captureAndPixelate();
        }
      }, 100);
    }
  });

  // Simple slider for project media
  const sliders = document.querySelectorAll(".project-slider");
  sliders.forEach((slider) => {
    const slides = slider.querySelectorAll("img");
    if (slides.length === 0) return;

    let current = 0;
    const intervalMs = 3500;
    slides[current].classList.add("is-active");

    setInterval(() => {
      slides[current].classList.remove("is-active");
      current = (current + 1) % slides.length;
      slides[current].classList.add("is-active");
    }, intervalMs);
  });
});

