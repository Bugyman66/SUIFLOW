(function(window) {
  const Suiflow = {
    init({ productId, onSuccess }) {
      // Create overlay
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = 0;
      overlay.style.left = 0;
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.background = 'rgba(0,0,0,0.5)';
      overlay.style.zIndex = 9999;
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';

      // Create iframe
      const iframe = document.createElement('iframe');
      iframe.src = `http://localhost:5173/pay/${productId}`; // Use your frontend domain in production
      iframe.style.width = '420px';
      iframe.style.height = '600px';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '12px';
      iframe.style.background = '#fff';

      // Close on overlay click (optional)
      overlay.onclick = (e) => {
        if (e.target === overlay) document.body.removeChild(overlay);
      };

      overlay.appendChild(iframe);
      document.body.appendChild(overlay);

      // Listen for postMessage from iframe
      window.addEventListener('message', function handler(event) {
        // Optionally check event.origin
        if (event.data && event.data.suiflowSuccess) {
          if (typeof onSuccess === 'function') onSuccess(event.data.txHash);
          document.body.removeChild(overlay);
          window.removeEventListener('message', handler);
        }
      });
    }
  };

  window.Suiflow = Suiflow;
})(window); 