import { useLocalSearchParams } from "expo-router";
import { PlayerScreen } from "../../components/Player";

// Opens shared links inside the app: https://<site>/s/<slug> app link or tanyora://s/<slug>
export default function SharePage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <PlayerScreen slug={slug ?? ""} />;
}
