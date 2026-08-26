import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DialPad } from './DialPad';

describe('DialPad', () => {
  it('calls onKeyPress when a key is tapped', async () => {
    const user = userEvent.setup();
    const onKeyPress = vi.fn();

    render(<DialPad onKeyPress={onKeyPress} />);

    await user.click(screen.getByLabelText('Key 5, JKL'));
    expect(onKeyPress).toHaveBeenCalledWith('5');
  });
});
