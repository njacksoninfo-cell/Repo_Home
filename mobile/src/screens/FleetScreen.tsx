import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { API_BASE_URL } from "../lib/constants";
import { useSessionStore } from "../store/sessionStore";
import { useFleetAccess, useIsPro } from "../hooks/useFeatureGate";
import { PaywallModal } from "../components/PaywallModal";
import { livekitService } from "../services/LiveKitService";
import type { Fleet } from "@proximity/shared";

export function FleetScreen(): React.ReactElement {
  const { sessionId } = useSessionStore();
  const isPro = useIsPro();
  const hasFleetAccess = useFleetAccess();
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [newFleetName, setNewFleetName] = useState("");
  const [newFleetType, setNewFleetType] = useState<"car_club" | "fleet_business">("car_club");
  const [activeFleetId, setActiveFleetId] = useState<string | null>(null);

  useEffect(() => {
    loadFleets();
  }, [sessionId]);

  const loadFleets = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fleets?sessionId=${sessionId}`);
      if (res.ok) {
        const data = (await res.json()) as { fleets: Fleet[] };
        setFleets(data.fleets);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const handleJoin = async () => {
    if (!sessionId || !joinCode.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/fleets/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, inviteCode: joinCode.trim().toUpperCase() }),
      });
      if (res.ok) {
        const data = (await res.json()) as { fleet: Fleet; token: string; livekitUrl: string };
        setFleets((prev) => [...prev, data.fleet]);
        setJoinCode("");
        setShowJoinInput(false);
        Alert.alert("Joined!", `Welcome to ${data.fleet.name}`);
      } else {
        Alert.alert("Error", "Invite code not found. Check the code and try again.");
      }
    } catch {
      Alert.alert("Error", "Could not join fleet. Try again.");
    }
  };

  const handleCreate = async () => {
    if (!sessionId || !newFleetName.trim()) return;
    if (!isPro) { setShowPaywall(true); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/api/fleets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, name: newFleetName.trim(), type: newFleetType }),
      });
      if (res.status === 402) { setShowPaywall(true); return; }
      if (res.ok) {
        const data = (await res.json()) as { fleet: Fleet };
        setFleets((prev) => [...prev, data.fleet]);
        setNewFleetName("");
        setShowCreateForm(false);
        Alert.alert("Created!", `"${data.fleet.name}" is live. Share your invite code: ${data.fleet.inviteCode}`);
      }
    } catch {
      Alert.alert("Error", "Could not create fleet. Try again.");
    }
  };

  const handleTalkOnChannel = async (fleet: Fleet) => {
    if (!sessionId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/fleets/${fleet.id}/token?sessionId=${sessionId}`
      );
      if (res.ok) {
        const { token, livekitUrl } = (await res.json()) as { token: string; livekitUrl: string };
        await livekitService.connect(livekitUrl, token);
        setActiveFleetId(fleet.id);
      }
    } catch {
      Alert.alert("Error", "Could not connect to fleet channel.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ flex: 1 }} color="#22d3ee" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        featureHint="Create fleets and car clubs"
      />

      <View style={styles.header}>
        <Text style={styles.title}>Fleets & Clubs</Text>
        <Text style={styles.subtitle}>Private channels for your crew</Text>
      </View>

      {fleets.length === 0 && !showJoinInput && !showCreateForm && (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No fleets yet</Text>
          <Text style={styles.emptyDesc}>
            Create a car club or trucking fleet — your own private channel that works regardless of distance.
          </Text>
        </View>
      )}

      <FlatList
        data={fleets}
        keyExtractor={(f) => f.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.fleetCard}>
            <View style={styles.fleetInfo}>
              <Text style={styles.fleetName}>{item.name}</Text>
              <Text style={styles.fleetMeta}>
                {item.type === "car_club" ? "Car Club" : "Fleet"} · {item.memberCount} member{item.memberCount !== 1 ? "s" : ""}
              </Text>
              <Text style={styles.inviteCode}>Code: {item.inviteCode}</Text>
            </View>
            <Pressable
              style={[styles.talkBtn, activeFleetId === item.id && styles.talkBtnActive]}
              onPress={() => handleTalkOnChannel(item)}
            >
              <Text style={styles.talkBtnText}>
                {activeFleetId === item.id ? "On Channel" : "Join Channel"}
              </Text>
            </Pressable>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.actions}>
            {showJoinInput ? (
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-char invite code"
                  placeholderTextColor="#475569"
                  value={joinCode}
                  onChangeText={setJoinCode}
                  autoCapitalize="characters"
                  maxLength={6}
                />
                <View style={styles.inputBtns}>
                  <Pressable style={styles.btnSecondary} onPress={() => setShowJoinInput(false)}>
                    <Text style={styles.btnSecondaryText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.btn} onPress={handleJoin}>
                    <Text style={styles.btnText}>Join</Text>
                  </Pressable>
                </View>
              </View>
            ) : showCreateForm ? (
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Fleet or club name"
                  placeholderTextColor="#475569"
                  value={newFleetName}
                  onChangeText={setNewFleetName}
                  maxLength={40}
                />
                <View style={styles.typeRow}>
                  {(["car_club", "fleet_business"] as const).map((t) => (
                    <Pressable
                      key={t}
                      style={[styles.typeChip, newFleetType === t && styles.typeChipActive]}
                      onPress={() => setNewFleetType(t)}
                    >
                      <Text style={[styles.typeChipText, newFleetType === t && styles.typeChipTextActive]}>
                        {t === "car_club" ? "Car Club" : "Fleet / Business"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.inputBtns}>
                  <Pressable style={styles.btnSecondary} onPress={() => setShowCreateForm(false)}>
                    <Text style={styles.btnSecondaryText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.btn} onPress={handleCreate}>
                    <Text style={styles.btnText}>Create</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.actionBtns}>
                <Pressable style={styles.btnSecondary} onPress={() => setShowJoinInput(true)}>
                  <Text style={styles.btnSecondaryText}>Join with Code</Text>
                </Pressable>
                <Pressable
                  style={styles.btn}
                  onPress={() => isPro ? setShowCreateForm(true) : setShowPaywall(true)}
                >
                  <Text style={styles.btnText}>
                    {isPro ? "Create Fleet" : "Create Fleet (Pro)"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0d0d0d" },
  header: { padding: 20, paddingBottom: 8 },
  title: { color: "#f1f5f9", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#64748b", fontSize: 14, marginTop: 2 },
  list: { padding: 16, gap: 10 },
  empty: { padding: 40, alignItems: "center", gap: 10 },
  emptyTitle: { color: "#f1f5f9", fontSize: 18, fontWeight: "700" },
  emptyDesc: { color: "#475569", fontSize: 14, textAlign: "center", lineHeight: 22 },
  fleetCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fleetInfo: { flex: 1, gap: 3 },
  fleetName: { color: "#f1f5f9", fontSize: 16, fontWeight: "700" },
  fleetMeta: { color: "#64748b", fontSize: 13 },
  inviteCode: { color: "#22d3ee", fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  talkBtn: {
    backgroundColor: "#0e7490",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  talkBtnActive: { backgroundColor: "#0f766e" },
  talkBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  actions: { paddingTop: 8 },
  actionBtns: { flexDirection: "row", gap: 10 },
  inputGroup: { gap: 10 },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 14,
    color: "#f1f5f9",
    fontSize: 15,
  },
  typeRow: { flexDirection: "row", gap: 8 },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  typeChipActive: { backgroundColor: "#0e7490" },
  typeChipText: { color: "#64748b", fontSize: 13 },
  typeChipTextActive: { color: "#fff", fontWeight: "700" },
  inputBtns: { flexDirection: "row", gap: 10 },
  btn: {
    flex: 1,
    backgroundColor: "#0e7490",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  btnSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnSecondaryText: { color: "#94a3b8", fontSize: 15 },
});
