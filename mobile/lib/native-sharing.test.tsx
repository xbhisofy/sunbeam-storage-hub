import { createElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const actions = vi.hoisted(() => ({ expiry: vi.fn(), clipboard: vi.fn(), share: vi.fn() }));
vi.mock('../node_modules/react-native/index.js', () => {
  const box = ({ children }: any) => createElement('div', null, children);
  return {
    View: box, Text: ({ children }: any) => createElement('span', null, children), ScrollView: box, KeyboardAvoidingView: box,
    Pressable: ({ children, onPress, accessibilityLabel, disabled, accessibilityState }: any) => createElement('button', { onClick: onPress, 'aria-label': accessibilityLabel, disabled, 'aria-checked': accessibilityState?.checked }, children),
    Modal: ({ children, visible }: any) => visible ? box({ children }) : null,
    TextInput: ({ value, onChangeText }: any) => createElement('input', { value, onChange: (e: any) => onChangeText(e.target.value) }),
    StyleSheet: { create: (value: any) => value }, Platform: { OS: 'android' }, Alert: { alert: vi.fn() }, Share: { share: actions.share },
  };
});
vi.mock('../node_modules/@expo/vector-icons/build/Icons.js', () => ({ Ionicons: () => null }));
vi.mock('../node_modules/expo-clipboard/build/Clipboard.js', () => ({ setStringAsync: actions.clipboard }));
vi.mock('../node_modules/expo-router/build/index.js', () => ({ router: { push: vi.fn() } }));
vi.mock('../node_modules/react-native-safe-area-context/lib/commonjs/index.js', () => ({ useSafeAreaInsets: () => ({ bottom: 24 }) }));
vi.mock('../../mobile/components/HomeThumbnail', () => ({ HomeThumbnail: () => null }));
vi.mock('../../mobile/components/ui', () => ({ Button: ({ label, onPress, busy }: any) => createElement('button', { onClick: onPress, disabled: busy }, label) }));
vi.mock('../../mobile/lib/config', () => ({ shareLink: (slug: string) => `https://tanyora.com/s/${slug}` }));
vi.mock('../../mobile/lib/files', () => ({
  setExpiry: actions.expiry, deleteFile: vi.fn(), renameFile: vi.fn(), formatDate: () => '27 Oct 2026', formatSize: () => '162 KB', iconFor: () => 'image',
  EXPIRY: [{ label: '1 hour', hours: 1 }, { label: '24 hours', hours: 24 }, { label: '7 days', hours: 168 }, { label: '30 days', hours: 720 }, { label: 'Never', hours: null }],
}));
import { FileCard } from '../../mobile/components/FileCard';
const file = { id: 'file-1', name: 'photo.jpg', file_type: 'image', size: 162000, storage_path: 'owner/photo.jpg', slug: 'abc', created_at: '2026-10-27T00:00:00Z', expires_at: null, source: 'original', mime: 'image/jpeg' };

describe('Native sharing actions', () => {
  beforeEach(() => { vi.clearAllMocks(); actions.expiry.mockResolvedValue(undefined); actions.clipboard.mockResolvedValue(undefined); actions.share.mockResolvedValue({}); });
  function open() {
    render(<FileCard file={file} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Actions for photo.jpg' }));
    fireEvent.click(screen.getByRole('button', { name: /^Share$/ }));
  }
  it('selects 24 hours without changing expiry until explicit creation', async () => {
    open(); fireEvent.click(screen.getByRole('button', { name: '24 hours' }));
    expect(actions.expiry).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Create Share Link' }));
    await waitFor(() => expect(actions.expiry).toHaveBeenCalledWith('file-1', 24));
    expect(actions.share).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole('button', { name: 'Copy share link' }));
    await waitFor(() => expect(actions.clipboard).toHaveBeenCalledWith('https://tanyora.com/s/abc'));
    fireEvent.click(screen.getByRole('button', { name: 'Share via…' }));
    await waitFor(() => expect(actions.share).toHaveBeenCalledWith({ message: 'photo.jpg\nhttps://tanyora.com/s/abc' }));
  });
  it('keeps failed expiry creation out of ready state and clipboard', async () => {
    actions.expiry.mockRejectedValue(new Error('Safety restriction'));
    open(); fireEvent.click(screen.getByRole('button', { name: 'Create Share Link' }));
    await waitFor(() => expect(actions.expiry).toHaveBeenCalledWith('file-1', null));
    expect(actions.clipboard).not.toHaveBeenCalled(); expect(actions.share).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Copy share link' })).toBeNull();
  });
});