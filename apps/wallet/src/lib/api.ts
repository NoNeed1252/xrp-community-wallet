import { createMockAdapter, type MockScenario } from '@rc/api-client';
import rawMocks from '../mocks.json';

const adapter = createMockAdapter(rawMocks as unknown as Record<string, unknown>);

export function getApi() {
  return adapter;
}

export function readScenarioFromUrl(): MockScenario {
  if (typeof window === 'undefined') return 'happy';
  const s = new URLSearchParams(window.location.search).get('state');
  switch (s) {
    case 'loading':
    case 'empty':
    case 'error':
    case 'inactive':
      return s;
    default:
      return 'happy';
  }
}
