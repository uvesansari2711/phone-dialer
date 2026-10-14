import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageComposer } from './MessageComposer';

describe('MessageComposer', () => {
  it('disables send when the draft is empty', () => {
    render(<MessageComposer value="" onChange={vi.fn()} onSend={vi.fn()} />);
    expect(screen.getByLabelText('Send')).toBeDisabled();
  });

  it('updates the character counter as the user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MessageComposer value="Hi" onChange={onChange} onSend={vi.fn()} />);

    expect(screen.getByText(/2\/1600/)).toBeInTheDocument();
    expect(screen.getByText(/1 segment/)).toBeInTheDocument();

    await user.type(screen.getByLabelText('Message text'), '!');
    expect(onChange).toHaveBeenCalled();
  });
});
