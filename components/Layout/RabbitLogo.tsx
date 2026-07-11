import React from 'react';

const RabbitLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M5 2h4v8H5V2zm6 0h4v8h-4V2z" />
    <path d="M2 9h20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z" />
    <rect x="15" y="15" width="4" height="4" rx="1.2" fill="var(--gemini-bg)" />
  </svg>
);

export default RabbitLogo;