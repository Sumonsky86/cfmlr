declare global {
  interface Window {
    __cefemActivateLitePlayer?: (container: HTMLElement) => void;
    __cefemYoutubeLiteInitialized?: boolean;
  }
}

// Define the function to activate a YouTube iframe inside a lite container
if (!window.__cefemActivateLitePlayer) {
  window.__cefemActivateLitePlayer = (container: HTMLElement) => {
    if (!container || container.classList.contains('loaded')) return;
    const id = container.getAttribute('data-id');
    if (!id) return;

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    iframe.title = 'YouTube video player';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    (iframe as any).allowFullscreen = true;
    iframe.loading = 'lazy';
    iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;';

    container.textContent = '';
    container.appendChild(iframe);
    container.classList.add('loaded');

    try {
      window.dispatchEvent(new CustomEvent('cefem:video_play', { detail: { id } }));
    } catch {}
  };
}

// One-time initialization to attach the click handler
if (!window.__cefemYoutubeLiteInitialized) {
  window.__cefemYoutubeLiteInitialized = true;
  document.addEventListener('click', (event) => {
    const target = (event.target as Element | null)?.closest?.('.yt-lite') as HTMLElement | null;
    if (!target) return;
    window.__cefemActivateLitePlayer?.(target);
  });
}

export {};

