import { useLocalSearchParams } from "expo-router";
import { PlayerScreen } from "../components/Player";

// Deep-link entry: tanyora://player?slug=xxxx
export default function PlayerPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <PlayerScreen slug={slug ?? ""} />;
}
