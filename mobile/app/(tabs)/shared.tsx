import { FlatList, RefreshControl, View } from "react-native";
import { Screen, Empty } from "../../components/ui";
import { FileCard } from "../../components/FileCard";
import { useFiles } from "../../lib/useFiles";
import { theme } from "../../lib/theme";

// Every file has a share link; this list shows each link's expiry status.
export default function Shared() {
  const { files, loading, refreshing, reload } = useFiles();
  return (
    <Screen title="Shared links">
      <FlatList
        data={files}
        keyExtractor={(f) => f.id}
        renderItem={({ item }) => <FileCard file={item} onChange={reload} showExpiry />}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.border, marginLeft: 74 }} />}
        style={{ backgroundColor: theme.card }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} colors={[theme.primary]} />}
        ListEmptyComponent={<Empty icon="share-social-outline" title={loading ? "Loading…" : "No shared links yet"} text={loading ? undefined : "Upload a file, then tap Share."} />}
      />
    </Screen>
  );
}
