"use client";

import dynamic from "next/dynamic";

const TacticsBoard = dynamic(
  () => import("@/components/board/TacticsBoard"),
  { ssr: false }
);

export default function Home() {
  return <TacticsBoard />;
}
