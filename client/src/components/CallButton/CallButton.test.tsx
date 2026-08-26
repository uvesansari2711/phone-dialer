import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CallButton } from './CallButton';

describe('CallButton', () => {
  it('is disabled when disabled prop is true', () => {
    render(<CallButton onClick={vi.fn()} disabled />);
    expect(screen.getByLabelText('Call')).toBeDisabled();
  });

  it('shows loading state', () => {
    render(<CallButton onClick={vi.fn()} loading />);
    expect(screen.getByLabelText('Calling')).toBeDisabled();
  });
});
