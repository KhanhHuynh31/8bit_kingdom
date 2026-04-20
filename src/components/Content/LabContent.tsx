"use client";
// src/components/Content/LabContent.tsx

import { useState } from "react";
import { Building } from "@/stores/types";
import LabPanel from "./lab/LabPanel";
import BattlePanel from "./lab/BattlePanel";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function LabContent({ data: _data }: { data: Building }) {
  const [activeTab, setActiveTab] = useState<"lab" | "battle">("lab");

  return (
    <div style={{ minHeight: 400 }}>
      {activeTab === "lab" ? (
        <LabPanel onSwitchBattle={() => setActiveTab("battle")} />
      ) : (
        <BattlePanel onSwitchLab={() => setActiveTab("lab")} />
      )}
    </div>
  );
}
