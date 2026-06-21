// Animate feature cards on scroll
const cards = document.querySelectorAll('.feat-card');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.animation = `fadeUp 0.5s ${i * 0.1}s ease both`;
    }
  });
}, { threshold: 0.1 });
cards.forEach(c => observer.observe(c));

// Parallax on scroll
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const hero = document.querySelector('.landing-hero');
  if (hero) hero.style.transform = `translateY(${scrollY * 0.1}px)`;
});
