import { Text, View } from "react-native";
import { AccountPage, DailyActivity, Metric, accountStyles as s } from "../components/AccountUI";
import { loadBonus, useAccountData } from "../lib/account-data";
import { usd } from "../lib/feature-rules";

export default function Bonus() {
  const state = useAccountData(loadBonus);
  const rows = state.data ?? [];
  const since = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
  const recent = rows.filter(r => r.day >= since);
  return <AccountPage title="OC Bonus" {...state}>
    <Text style={s.title}>Original content pays.</Text>
    <Text style={s.text}>Earn a 5% bonus on eligible view earnings from links others convert from your file, while your original link stays active. Their earnings are not reduced.</Text>
    <View style={s.grid}>
      <Metric label="Total bonus" value={usd(rows.reduce((sum, r) => sum + Number(r.amount), 0))} icon="gift-outline" accent />
      <Metric label="Last 15 days" value={usd(recent.reduce((sum, r) => sum + Number(r.amount), 0))} icon="calendar-outline" />
      <Metric label="Bonus views · 15 days" value={recent.reduce((sum, r) => sum + Number(r.views), 0).toLocaleString()} icon="eye-outline" />
    </View>
    <Text style={s.section}>Bonus earnings · Last 15 days</Text><DailyActivity rows={recent} money />
    <Text style={s.section}>Bonus-earning views</Text><DailyActivity rows={recent} />
  </AccountPage>;
}