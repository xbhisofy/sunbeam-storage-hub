export const theme = {
  bg: "#F5F7FB",
  card: "#FFFFFF",
  border: "#E4E9F2",
  text: "#0F172A",
  muted: "#64748B",
  primary: "#2563EB",
  primarySoft: "#E8F0FE",
  danger: "#DC2626",
  success: "#16A34A",
  radius: 16,
  cat: {
    pdf: { fg: "#DC2626", bg: "#FEE9E9" },
    image: { fg: "#0891B2", bg: "#E0F7FB" },
    video: { fg: "#7C3AED", bg: "#F0E9FF" },
    audio: { fg: "#EA580C", bg: "#FFF0E5" },
    other: { fg: "#475569", bg: "#EEF2F7" },
  } as Record<string, { fg: string; bg: string }>,
};
