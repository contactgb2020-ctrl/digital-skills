@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    scroll-behavior: smooth;
  }
  body {
    @apply bg-sage-50 text-secondary-600 dark:bg-secondary-700 dark:text-neutral-100 font-sans antialiased;
    transition: background-color 0.3s ease, color 0.3s ease;
  }
  h1, h2, h3, h4, h5, h6 {
    @apply font-heading font-extrabold tracking-tight;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary-500 text-white px-6 py-3 rounded-[10px] font-semibold hover:bg-primary-600 active:scale-95 transition-all duration-200;
  }
  .btn-secondary {
    @apply bg-secondary-600 text-white px-6 py-3 rounded-[10px] font-semibold hover:bg-secondary-500 active:scale-95 transition-all duration-200;
  }
  .btn-outline {
    @apply border-2 border-primary-500 text-primary-500 px-6 py-3 rounded-[10px] font-semibold hover:bg-primary-50 dark:hover:bg-secondary-600 active:scale-95 transition-all duration-200;
  }
  .card {
    @apply bg-white dark:bg-secondary-700 rounded-2xl border border-slate-100 dark:border-secondary-500 transition-all duration-300;
  }
  .input-field {
    @apply w-full px-4 py-3 rounded-[10px] border border-slate-200 dark:border-secondary-500 bg-slate-50 dark:bg-secondary-800 text-secondary-600 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all;
  }
  .nav-link {
    @apply text-secondary-600 dark:text-neutral-100 hover:text-primary-500 dark:hover:text-primary-400 font-medium transition-colors duration-200;
  }
  .pill-badge {
    @apply inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 dark:bg-secondary-600 text-primary-500 text-sm font-semibold;
  }
  .hero-gradient {
    background: linear-gradient(180deg, #E8EEE8 0%, #FFFFFF 100%);
  }
  .hero-gradient-dark {
    background: linear-gradient(180deg, #0C1219 0%, #0F1720 100%);
  }
}

/* Scroll reveal */
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Slow connection: reduce animations */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #F2703D;
  border-radius: 4px;
}
