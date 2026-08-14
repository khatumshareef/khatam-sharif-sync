import { createFileRoute } from "@tanstack/react-router";
import { KhatamPlayer } from "@/components/KhatamPlayer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Khatam Sharif — Interactive Quran Recitation" },
      {
        name: "description",
        content:
          "Listen to Khatam Sharif with word-by-word live highlighting, tap any Arabic word to jump, adjust speed and follow along in a calm, elegant reader.",
      },
      { property: "og:title", content: "Khatam Sharif — Interactive Quran Recitation" },
      {
        property: "og:description",
        content:
          "Word-synced Khatam Sharif recitation with live highlighting, click-to-seek and full playback controls.",
      },
    ],
  }),
  component: KhatamPlayer,
});
