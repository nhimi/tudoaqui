/* TudoAqui Standalone Site - JavaScript */

// Mobile Menu Toggle
function toggleMenu() {
  const links = document.querySelector('.nav-links');
  const actions = document.querySelector('.nav-actions');
  if (links.style.display === 'flex') {
    links.style.display = 'none';
    actions.style.display = 'none';
  } else {
    links.style.display = 'flex';
    links.style.flexDirection = 'column';
    links.style.position = 'absolute';
    links.style.top = '64px';
    links.style.left = '0';
    links.style.right = '0';
    links.style.background = '#0a0a0a';
    links.style.padding = '16px 24px';
    links.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
    actions.style.display = 'flex';
    actions.style.position = 'absolute';
    actions.style.top = links.offsetHeight + 64 + 'px';
    actions.style.left = '0';
    actions.style.right = '0';
    actions.style.background = '#0a0a0a';
    actions.style.padding = '8px 24px 16px';
    actions.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
  }
}

// FAQ Toggle
function toggleFaq(btn) {
  const item = btn.parentElement;
  const answer = item.querySelector('.faq-answer');
  const isOpen = answer.classList.contains('show');
  
  // Close all
  document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('show'));
  document.querySelectorAll('.faq-question').forEach(q => q.classList.remove('active'));
  
  if (!isOpen) {
    answer.classList.add('show');
    btn.classList.add('active');
  }
}

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Close mobile menu
    if (window.innerWidth < 768) {
      const links = document.querySelector('.nav-links');
      const actions = document.querySelector('.nav-actions');
      links.style.display = 'none';
      actions.style.display = 'none';
    }
  });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (window.scrollY > 50) {
    nav.style.borderBottomColor = 'rgba(255,255,255,0.1)';
  } else {
    nav.style.borderBottomColor = 'rgba(255,255,255,0.05)';
  }
});

// Intersection Observer for animations
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

document.querySelectorAll('.feature-card, .step, .testimonial, .price-card, .team-card, .roadmap-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

console.log('TudoAqui Site loaded — Sincesoft');
