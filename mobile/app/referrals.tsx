import { Alert, Share, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { AccountPage, Metric, accountStyles as s } from "../components/AccountUI";
import { Button, Empty } from "../components/ui";
import { loadReferrals, useAccountData } from "../lib/account-data";
import { WEB_URL } from "../lib/config";
import { pendingTotal, usd } from "../lib/feature-rules";
import { formatDate } from "../lib/files";

export default function Referrals() {
  const state = useAccountData(loadReferrals);
  const d = state.data;
  const link = d?.profile?.referral_code ? `${WEB_URL}/auth?mode=signup&ref=${encodeURIComponent(d.profile.referral_code)}` : null;
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  return <AccountPage title="Referrals" {...state}>
    <Text style={s.title}>Grow your circle.</Text>
    <Text style={s.text}>$0.10 per referral signup, plus 10% of your referrals’ eligible view earnings.</Text>
    {link && <View style={{ gap: 10 }}><Button label="Share referral link" icon="share-social-outline" onPress={() => { void Share.share({ message: `Join me on Tanyora\n${link}` }).catch(() => Alert.alert("Unable to share", "Please try again.")); }} /><Button label="Copy referral link" icon="copy-outline" variant="outline" onPress={() => { void Clipboard.setStringAsync(link).then(() => Alert.alert("Copied", "Your referral link is ready to share.")).catch(() => Alert.alert("Could not copy", "Please try again.")); }} /></View>}
    <View style={s.grid}>
      <Metric label="Referral earnings" value={usd(d?.profile?.referral_earnings ?? 0)} icon="people-outline" accent />
      <Metric label="Successfully invited" value={String(d?.people.length ?? 0)} icon="person-add-outline" />
      <Metric label="Yesterday" value={usd(d?.daily.filter(r => r.day === yesterday).reduce((sum, r) => sum + Number(r.signup_bonus) + Number(r.commission), 0) ?? 0)} icon="calendar-outline" />
      <Metric label="Available balance" value={usd(d?.profile?.balance ?? 0)} icon="wallet-outline" />
      <Metric label="On hold" value={usd(pendingTotal(d?.withdrawals ?? []))} icon="time-outline" />
      <Metric label="Paid" value={usd(d?.profile?.paid_total ?? 0)} icon="checkmark-circle-outline" />
    </View>
    <Text style={s.section}>People you invited</Text>
    {d?.people.length ? d.people.map((p, i) => <View key={`${p.joined}-${i}`} style={s.row}><View style={{ flex: 1 }}><Text style={s.name}>{p.name}</Text><Text style={s.text}>Joined {formatDate(p.joined)}</Text></View><Text style={s.value}>{usd(p.earned)}</Text></View>) : <Empty icon="people-outline" title="No referrals yet" />}
  </AccountPage>;
}