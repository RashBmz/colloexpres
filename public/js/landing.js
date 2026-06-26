const cards = document.querySelectorAll('.feat-card');
if ('IntersectionObserver' in window && cards.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '80px 0px', threshold: 0.01 });
  cards.forEach((card) => observer.observe(card));
}
