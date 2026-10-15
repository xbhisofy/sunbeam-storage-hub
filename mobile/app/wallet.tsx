import { Text, View } from "react-native";
import { AccountPage, Metric, PaymentAction, Status, accountStyles as s } from "../components/AccountUI";
import { Empty } from "../components/ui";
import { loadWallet, useAccountData } from "../lib/account-data";
import { inr, usd } from "../lib/feature-rules";
import { formatDate } from "../lib/files";

export default function Wallet() {
  const state = useAccountData(loadWallet);
  return <AccountPage title="Wallet" {...state}>
    <Text style={s.title}>Your wallet</Text>
    <Metric label="Current balance · USD" value={usd(state.data?.profile?.balance ?? 0)} icon="wallet-outline" accent />
    <PaymentAction target="wallet" label="Add funds on website" />
    <Text style={s.section}>Deposit history · INR</Text>
    {state.data?.deposits.length ? state.data.deposits.map(d => <View key={d.id} style={s.row}><View style={{ flex: 1, gap: 4 }}><Text style={s.value}>{inr(d.amount_inr)}</Text><Text style={s.text}>{formatDate(d.created_at)} · {d.purpose === "wallet" ? "Wallet deposit" : "Premium"}</Text><Text numberOfLines={1} style={s.text}>{d.order_id}</Text></View><Status value={d.status} /></View>) : <Empty icon="receipt-outline" title="No deposits yet" />}
  </AccountPage>;
}