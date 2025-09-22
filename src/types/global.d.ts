declare global {
  interface Window {
    CefemModal?: Record<string, { open: () => void; close: () => void }>;
  }
}

export {};

