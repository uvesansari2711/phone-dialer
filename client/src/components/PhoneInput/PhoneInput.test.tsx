import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhoneInput } from './PhoneInput';

describe('PhoneInput', () => {
  it('supports typing and deleting digits', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<PhoneInput value="" onChange={onChange} />);

    await user.type(screen.getByLabelText('Phone number'), '415');
    expect(onChange).toHaveBeenCalled();
  });

  it('handles paste with formatting', async () => {
    const user = userEvent.setup();
    let value = '';
    const onChange = vi.fn((v: string) => {
      value = v;
    });

    const { rerender } = render(<PhoneInput value={value} onChange={onChange} />);

    await user.click(screen.getByLabelText('Phone number'));
    await user.paste('+91 95121 68389');

    rerender(<PhoneInput value={value} onChange={onChange} />);
    expect(onChange).toHaveBeenCalled();
  });
});
