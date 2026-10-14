import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversationList } from './ConversationList';
import type { ConversationSummary } from '../../types';

const conversations: ConversationSummary[] = [
  {
    contactNumber: '+15555550100',
    lastBody: 'On my way',
    lastDirection: 'inbound',
    lastStatus: 'received',
    lastAt: new Date().toISOString(),
    ourNumber: '+14155552671',
    unreadCount: 2,
  },
];

describe('ConversationList', () => {
  it('renders a preview and unread indicator', () => {
    render(<ConversationList conversations={conversations} onSelect={vi.fn()} />);
    expect(screen.getByText(/On my way/)).toBeInTheDocument();
    expect(screen.getByLabelText('Unread')).toBeInTheDocument();
  });

  it('calls onSelect with the contact number', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ConversationList conversations={conversations} onSelect={onSelect} />);
    await user.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('+15555550100');
  });
});
