import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  TextInput,
} from "react-native";
import { VEHICLE_COLORS, type VehicleColor } from "@driver-intercom/shared";
import { useSessionStore } from "../store/sessionStore";
import { API_BASE_URL } from "../lib/constants";

const POPULAR_MAKES = [
  "Toyota", "Honda", "Ford", "Chevrolet", "Nissan", "BMW", "Mercedes-Benz",
  "Audi", "Tesla", "Volkswagen", "Hyundai", "Kia", "Subaru", "Mazda",
  "Ram", "GMC", "Jeep", "Dodge", "Lexus", "Acura",
];

const COLOR_HEX: Record<string, string> = {
  Red: "#ef4444", Blue: "#3b82f6", Silver: "#94a3b8", Gray: "#6b7280",
  Black: "#1f2937", White: "#f1f5f9", Yellow: "#eab308", Green: "#22c55e",
  Orange: "#f97316", Brown: "#92400e", Purple: "#a855f7", Gold: "#f59e0b",
  Beige: "#d4b896",
};

interface Props {
  onComplete: () => void;
}

export function VehicleSetupScreen({ onComplete }: Props): React.ReactElement {
  const { sessionId, setVehicle } = useSessionStore();
  const [color, setColor] = useState<VehicleColor>("Silver");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = make.trim().length > 0 && model.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || !sessionId) return;
    setSaving(true);

    const vehicle = {
      color,
      make: make.trim(),
      model: model.trim(),
      year: year.trim() || null,
      nickname: nickname.trim() || null,
    };

    try {
      await fetch(`${API_BASE_URL}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, vehicle }),
      });
    } catch {
      // Non-fatal — store locally and sync later
    }

    setVehicle(vehicle);
    onComplete();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Your Vehicle</Text>
        <Text style={styles.subtitle}>
          This is how you'll appear to nearby drivers.{"\n"}No name, no face — just your car.
        </Text>

        {/* Color picker */}
        <Text style={styles.sectionLabel}>Color</Text>
        <View style={styles.colorGrid}>
          {VEHICLE_COLORS.map((c) => (
            <Pressable
              key={c}
              style={[
                styles.colorSwatch,
                { backgroundColor: COLOR_HEX[c] ?? "#94a3b8" },
                color === c && styles.colorSwatchSelected,
              ]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        {/* Make */}
        <Text style={styles.sectionLabel}>Make</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.makeScroll}>
          {POPULAR_MAKES.map((m) => (
            <Pressable
              key={m}
              style={[styles.makeChip, make === m && styles.makeChipSelected]}
              onPress={() => setMake(m)}
            >
              <Text style={[styles.makeChipText, make === m && styles.makeChipTextSelected]}>
                {m}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <TextInput
          style={styles.input}
          placeholder="Or type your make..."
          placeholderTextColor="#475569"
          value={make}
          onChangeText={setMake}
        />

        {/* Model */}
        <Text style={styles.sectionLabel}>Model</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Civic, F-150, Model 3"
          placeholderTextColor="#475569"
          value={model}
          onChangeText={setModel}
        />

        {/* Year (optional) */}
        <Text style={styles.sectionLabel}>Year (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2019"
          placeholderTextColor="#475569"
          value={year}
          onChangeText={setYear}
          keyboardType="number-pad"
          maxLength={4}
        />

        {/* Nickname (optional) */}
        <Text style={styles.sectionLabel}>Nickname (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder='e.g. "The Blue Rocket"'
          placeholderTextColor="#475569"
          value={nickname}
          onChangeText={setNickname}
          maxLength={30}
        />

        <Pressable
          style={[styles.btn, (!canSave || saving) && styles.btnDisabled]}
          onPress={handleSave}
          disabled={!canSave || saving}
        >
          <Text style={styles.btnText}>{saving ? "Saving..." : "Hit the Road"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0d0d0d" },
  container: { padding: 24, gap: 12, paddingBottom: 48 },
  title: { color: "#f1f5f9", fontSize: 28, fontWeight: "800" },
  subtitle: { color: "#64748b", fontSize: 15, lineHeight: 22 },
  sectionLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 8,
  },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSwatchSelected: { borderColor: "#22d3ee" },
  makeScroll: { marginHorizontal: -24, paddingLeft: 24 },
  makeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginRight: 8,
  },
  makeChipSelected: { backgroundColor: "#0e7490" },
  makeChipText: { color: "#94a3b8", fontSize: 14 },
  makeChipTextSelected: { color: "#fff", fontWeight: "700" },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 14,
    color: "#f1f5f9",
    fontSize: 15,
  },
  btn: {
    backgroundColor: "#0e7490",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 16,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
