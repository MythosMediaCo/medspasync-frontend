import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from './App.jsx';

beforeEach(() => {
  global.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({ cors_enabled: true }) });
});

describe('App', () => {
  it('renders uploader', () => {
    render(<App />);
    expect(screen.getByText(/drag & drop files/i)).toBeTruthy();
  });
});
