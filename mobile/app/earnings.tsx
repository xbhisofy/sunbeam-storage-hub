import { Text, View } from "react-native";
import { AccountPage, Metric, PaymentAction, Status, DailyActivity, accountStyles as s } from "../components/AccountUI";
import { Empty } from "../components/ui";
import { loadEarnings, useAccountData } from "../lib/account-data";
import { pendingTotal, usd } from "../lib/feature-rules";
import { formatDate } from "../lib/files";

export default function Earnings() {
  const state = useAccountData(loadEarnings);
  const d = state.data;
  const held = pendingTotal(d?.withdrawals ?? []);
  return <AccountPage title="Earnings" {...state}>
    <Text style={s.title}>Your earnings</Text>
    <View style={s.grid}>
      <Metric label="Current balance" value={usd(Number(d?.profile?.balance ?? 0) + held)} icon="wallet-outline" accent />
      <Metric label="Available" value={usd(d?.profile?.balance ?? 0)} icon="cash-outline" />
      <Metric label="On hold" value={usd(held)} icon="time-outline" />
      <Metric label="Paid" value={usd(d?.profile?.paid_total ?? 0)} icon="checkmark-circle-outline" />
    </View>
    <Text style={s.section}>Views + Referrals</Text>
    <View style={s.row}><Text style={s.name}>View earnings · $3 / 1,000 eligible views</Text><Status value="active" /></View>
    <View style={s.row}><Text style={s.name}>Referral signups · $0.10 each</Text><Status value="active" /></View>
    <View style={s.row}><Text style={s.text}>Referral earnings</Text><Text style={s.value}>{usd(d?.profile?.referral_earnings ?? 0)}</Text></View>
    <Text style={s.section}>Withdraw funds</Text>
    <Text style={s.text}>Minimum $5.00 · Subject to review</Text>
    <PaymentAction target="earnings" label="Request withdrawal" />
    <Text style={s.section}>Eligible views · Last 14 days</Text>
    <DailyActivity rows={d?.views ?? []} />
    <Text style={s.section}>Payout history</Text>
    {d?.withdrawals.length ? d.withdrawals.map(w => <View key={w.id} style={s.row}><View style={{ flex: 1, gap: 5 }}><Text style={s.name}>{usd(w.amount)} · {w.method.toUpperCase()}</Text><Text style={s.text}>{formatDate(w.created_at)}</Text>{w.admin_note ? <Text style={s.text}>{w.admin_note}</Text> : null}</View><Status value={w.status} /></View>) : <Empty icon="cash-outline" title="No payouts yet" />}
  </AccountPage>;
}