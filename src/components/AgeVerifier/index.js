import React, { useEffect } from 'react';

export default function AgeVerifier() {
  useEffect(() => {
    const src = 'https://www.ageverif.com/checker.js?key=Uix6XhTuYK2pTwiitjtF25gY2zZ4LbNIng6tCG9F';
    if (document.querySelector(`script[src="${src}"]`)) return;
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    document.body.appendChild(s);
    return () => {
      if (s.parentNode) s.parentNode.removeChild(s);
    };
  }, []);

  return null;
}
