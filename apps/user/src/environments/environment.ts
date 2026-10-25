declare global {
  interface Window {
    __ENV__?: {
      apiUrl?: string;
    };
  }
}

export const environment = {
  production: false,
  get apiUrl(): string {
    // 1. Injected at deploy time by CDK via env-config.js (AWS API Gateway URL)
    if (typeof window !== 'undefined' && window.__ENV__?.apiUrl) {
      return window.__ENV__.apiUrl;
    }
    // 2. Localhost fallback
    return 'http://localhost:3000/api';
  },
};
