import { View } from "react-native";
import { router } from "expo-router";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { Screen } from "../../components/ui";
import { HomeDashboard } from "../../components/HomeDashboard";
import { FileCard } from "../../components/FileCard";
import { useProfile } from "../../lib/useProfile";
import { currentPlan } from "../../lib/account-rules";
import { useSession } from "../_layout";
import { useFiles } from "../../lib/useFiles";
import { CATEGORIES, formatSize } from "../../lib/files";
import { ADS } from "../../lib/config";
import { homeTheme } from "../../lib/home-theme";

export default function Home() {
  const session = useSession();
  const { files, loading, refreshing, error, reload } = useFiles();
  const { profile } = useProfile();
  const plan = currentPlan(profile);
  const fullName = profile?.display_name || (session?.user.user_metadata?.display_name as string | undefined) || "";
  const name = fullName.split(" ")[0] || "there";
  const used = files.reduce((n, f) => n + (f.size || 0), 0);
  const pct = Math.min(100, (used / plan.storage) * 100);
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return <Screen><View style={{ flex: 1, backgroundColor: homeTheme.background }}><HomeDashboard
    name={name} greeting={greet} used={formatSize(used)} capacity={formatSize(plan.storage)} percent={pct} plan={plan.name}
    categories={CATEGORIES.map(c => ({ ...c, count: files.filter(f => f.file_type === c.kind).length }))}
    loading={loading} refreshing={refreshing} error={error} hasFiles={files.length > 0}
    recentFiles={files.slice(0, 3).map(f => <FileCard key={f.id} file={f} onChange={reload} presentation="home" />)}
    ad={<BannerAd unitId={ADS.banner} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />}
    onUpload={() => router.push("/uploader")} onFiles={() => router.push("/content")}
    onProfile={() => router.push("/profile")} onCategory={kind => router.push({ pathname: "/content", params: { kind } })} onRefresh={reload}
  /></View></Screen>;
}
