import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import { EXPIRY, formatSize, type FileRow } from '../lib/files';
import { Button } from './ui';

type Props = {
  file: FileRow; ready: boolean; hours: number | null; expiresAt: string | null;
  link: string; busy: boolean; copied: boolean; error: string | null;
  select: (hours: number | null) => void; create: () => void; copy: () => void;
  share: () => void; changeExpiry: () => void; close: () => void;
};

export function ShareLinkPanel(p: Props) {
  const expiry = p.expiresAt === null ? 'Never expires' : `Expires ${new Date(p.expiresAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
  return <View style={s.panel}>
    {p.ready && <View style={s.success}>
      <View style={s.check}><Ionicons name="checkmark" size={36} color={theme.onPrimary} /></View>
      <Text style={s.successTitle}>Share Link Ready!</Text>
      <Text style={s.description}>Open this file in Tanyora using the link below.</Text>
      <View style={s.expiryBadge}><Ionicons name="time-outline" size={15} color={theme.primary} /><Text style={s.expiryText}>{expiry}</Text></View>
    </View>}
    <View style={s.file}>
      <View style={s.fileIcon}><Ionicons name={p.file.file_type === 'image' ? 'image-outline' : p.file.file_type === 'video' ? 'film-outline' : 'document-text-outline'} size={26} color={theme.primary} /></View>
      <View style={s.fileCopy}><Text style={s.fileTitle} numberOfLines={1}>{p.ready ? p.file.name : 'Share File'}</Text><Text style={s.description} numberOfLines={1}>{p.ready ? `${formatSize(p.file.size)} · ${p.file.name.split('.').pop()?.toUpperCase() ?? 'FILE'}` : p.file.name}</Text></View>
    </View>
    {p.ready ? <>
      <View style={s.linkRow}>
        <Ionicons name="link-outline" size={22} color={theme.primary} />
        <Text selectable numberOfLines={1} style={s.link}>{p.link}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Copy share link" onPress={p.copy} style={({ pressed }) => [s.copy, pressed && s.pressed]}><Ionicons name={p.copied ? 'checkmark' : 'copy-outline'} size={18} color={theme.primary} /><Text style={s.copyText}>{p.copied ? 'Copied' : 'Copy'}</Text></Pressable>
      </View>
      <Button label="Share via…" icon="share-social-outline" onPress={p.share} busy={p.busy} />
      <View style={s.footer}><Button label="Change Expiry" icon="options-outline" variant="outline" onPress={p.changeExpiry} style={s.footerButton} busy={p.busy} /><Button label="Done" variant="outline" onPress={p.close} style={s.footerButton} busy={p.busy} /></View>
    </> : <>
      <View style={s.labelRow}><Ionicons name="timer-outline" size={22} color={theme.primary} /><Text style={s.label}>Link Expiration</Text></View>
      <View style={s.options}>{EXPIRY.map(option => <Pressable key={option.label} accessibilityRole="radio" accessibilityState={{ checked: p.hours === option.hours, disabled: p.busy }} disabled={p.busy} onPress={() => p.select(option.hours)} style={({ pressed }) => [s.option, p.hours === option.hours && s.selected, pressed && s.pressed]}>
        {p.hours === option.hours && <Ionicons name="checkmark-circle" size={18} color={theme.primary} />}
        <Text style={[s.optionText, p.hours === option.hours && s.selectedText]}>{option.label}</Text>
      </Pressable>)}</View>
      <Button label="Create Share Link" icon="link-outline" onPress={p.create} busy={p.busy} />
    </>}
    {p.error && <Text accessibilityRole="alert" style={s.error}>{p.error}</Text>}
  </View>;
}

const s = StyleSheet.create({
  panel: { gap: 18 }, file: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: theme.subtle, borderRadius: 16, borderWidth: 1, borderColor: theme.border },
  fileIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center' }, fileCopy: { flex: 1, minWidth: 0 }, fileTitle: { fontSize: 16, fontWeight: '600', color: theme.text },
  description: { color: theme.muted, fontSize: 13, lineHeight: 20 }, labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, label: { fontSize: 16, fontWeight: '600', color: theme.text },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, option: { minHeight: 48, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.subtle },
  selected: { borderColor: theme.primary, backgroundColor: theme.primarySoft }, optionText: { fontSize: 14, color: theme.text }, selectedText: { color: theme.primary, fontWeight: '600' },
  success: { alignItems: 'center', gap: 10, paddingVertical: 8 }, check: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.success, alignItems: 'center', justifyContent: 'center' }, successTitle: { fontSize: 20, fontWeight: '700', color: theme.text },
  expiryBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: theme.primarySoft, maxWidth: '100%' }, expiryText: { fontSize: 12, color: theme.primary, flexShrink: 1 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 8 }, link: { flex: 1, fontSize: 12, color: theme.muted }, copy: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, backgroundColor: theme.primarySoft, borderRadius: 8 }, copyText: { fontSize: 13, color: theme.primary, fontWeight: '600' },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, footerButton: { flex: 1, minWidth: 140 }, pressed: { opacity: 0.7 }, error: { color: theme.danger, fontSize: 13, lineHeight: 20 },
});