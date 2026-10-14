import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SmsButton } from './SmsButton';

describe('SmsButton', () => {
  it('is disabled when disabled prop is true', () => {
    render(<SmsButton onClick={vi.fn()} disabled />);
    expect(screen.getByLabelText('Message')).toBeDisabled();
  });

  it('is enabled by default', () => {
    render(<SmsButton onClick={vi.fn()} />);
    expect(screen.getByLabelText('Message')).toBeEnabled();
  });
});
