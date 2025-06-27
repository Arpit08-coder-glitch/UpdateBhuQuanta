import { useEffect } from 'react';

// Custom hook for disabling developer tools
export const useDevTools = () => {
  useEffect(() => {
    const disableDevTools = () => {
      window.oncontextmenu = () => false;  // Disable right-click
      window.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
          e.preventDefault();  // Disable F12 and Ctrl+Shift+I
        }
      });
    };

    disableDevTools();

    return () => {
      window.oncontextmenu = null;  // Re-enable right-click
      window.removeEventListener('keydown', disableDevTools);  // Remove keydown event
    };
  }, []);
}; 