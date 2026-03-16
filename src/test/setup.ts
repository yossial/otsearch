import '@testing-library/jest-dom';

// Radix UI components (Select, etc.) use ResizeObserver which jsdom doesn't provide
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
