/**
 * Test Setup Configuration for FastRevEd Kids Frontend-Diamond
 * Configures testing environment, mocks, and global settings
 */

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// =============================================================================
// GLOBAL MOCKS
// =============================================================================

// Mock IntersectionObserver (used by some UI libraries)
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];
  
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
  takeRecords() { return []; }
} as any;

// Mock ResizeObserver (used by some UI libraries)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
};

// Mock matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  // Execute immediately in tests to avoid timeouts
  callback(performance.now());
  return 1;
});

global.cancelAnimationFrame = jest.fn();

// =============================================================================
// WEBGL / CANVAS MOCKS FOR THREE.JS
// =============================================================================

// Mock HTMLCanvasElement.getContext for Three.js
const mockWebGLContext = {
  canvas: document.createElement('canvas'),
  drawingBufferWidth: 1024,
  drawingBufferHeight: 768,
  clearColor: jest.fn(),
  clear: jest.fn(),
  useProgram: jest.fn(),
  createShader: jest.fn(() => ({})),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  getShaderParameter: jest.fn(() => true),
  createProgram: jest.fn(() => ({})),
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
  getProgramParameter: jest.fn(() => true),
  createBuffer: jest.fn(() => ({})),
  bindBuffer: jest.fn(),
  bufferData: jest.fn(),
  getAttribLocation: jest.fn(() => 0),
  enableVertexAttribArray: jest.fn(),
  vertexAttribPointer: jest.fn(),
  getUniformLocation: jest.fn(() => ({})),
  uniformMatrix4fv: jest.fn(),
  uniform3fv: jest.fn(),
  uniform1f: jest.fn(),
  drawArrays: jest.fn(),
  viewport: jest.fn(),
  enable: jest.fn(),
  disable: jest.fn(),
  blendFunc: jest.fn(),
  depthMask: jest.fn(),
  getExtension: jest.fn(() => ({})),
  getParameter: jest.fn(() => 'Mock WebGL Renderer'),
};

// Mock 2D context
const mock2DContext = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '10px sans-serif',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  clearRect: jest.fn(),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  measureText: jest.fn(() => ({ width: 10 })),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  rect: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  scale: jest.fn(),
  drawImage: jest.fn(),
};

// Override getContext to return appropriate context based on type
HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
  if (contextType === '2d') {
    return mock2DContext;
  }
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return mockWebGLContext;
  }
  return null;
}) as any;

// =============================================================================
// WEB AUDIO API MOCKS
// =============================================================================

const mockAudioContext = {
  createOscillator: jest.fn(() => ({
    frequency: { value: 440 },
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  })),
  createGain: jest.fn(() => ({
    gain: { value: 1 },
    connect: jest.fn(),
  })),
  destination: {},
  currentTime: 0,
};

global.AudioContext = jest.fn(() => mockAudioContext) as any;
// @ts-ignore
global.webkitAudioContext = jest.fn(() => mockAudioContext);

// Mock HTMLAudioElement
global.HTMLAudioElement.prototype.play = jest.fn(() => Promise.resolve());
global.HTMLAudioElement.prototype.pause = jest.fn();
global.HTMLAudioElement.prototype.load = jest.fn();

// =============================================================================
// CRYPTO API MOCK
// =============================================================================

const mockCrypto = {
  getRandomValues: jest.fn((array: any) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
});

// =============================================================================
// LIBRARY MOCKS
// =============================================================================

// Mock useGPUPerformance hook (specific to this project)
jest.mock('./hooks/useGPUPerformance', () => ({
  useGPUPerformance: () => ({
    getOptimalDuration: () => 1000,
    getOptimalParticleCount: () => 50,
    shouldUseComplexAnimation: () => true,
    performanceTier: 'high',
    gpuInfo: { vendor: 'test', renderer: 'test' },
    canUseAdvancedEffects: true
  })
}));

// =============================================================================
// TESTING CONFIGURATION
// =============================================================================

// Increase timeout for integration tests and complex animations
jest.setTimeout(30000);

// Configure test environment
process.env.REACT_APP_API_BASE_URL = 'http://localhost:3003';
process.env.REACT_APP_ENVIRONMENT = 'test';
