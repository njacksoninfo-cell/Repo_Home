import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { HomeScreen } from "./screens/HomeScreen";
import { ConvoyHistoryScreen } from "./screens/ConvoyHistoryScreen";
import { RegularsScreen } from "./screens/RegularsScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { VehicleSetupScreen } from "./screens/VehicleSetupScreen";

import { initSession } from "./services/SessionService";
import {
  configureLocationService,
  startLocationTracking,
} from "./services/LocationService";
import { wsService } from "./services/WebSocketService";
import { useSessionStore } from "./store/sessionStore";
import { CarPlayProvider } from "./carplay/CarPlayProvider";

const Tab = createBottomTabNavigator();

type AppPhase = "loading" | "onboarding" | "vehicle_setup" | "ready";

export default function App(): React.ReactElement {
  const [phase, setPhase] = useState<AppPhase>("loading");
  const { sessionId, vehicle } = useSessionStore();

  useEffect(() => {
    (async () => {
      const sid = await initSession();
      if (!sid) {
        setPhase("onboarding");
        return;
      }
      // Check if vehicle is set
      const { vehicle: v } = useSessionStore.getState();
      if (!v) {
        setPhase("vehicle_setup");
        return;
      }
      await bootstrap(sid);
      setPhase("ready");
    })();
  }, []);

  const handleOnboardingComplete = async () => {
    setPhase("vehicle_setup");
  };

  const handleVehicleComplete = async () => {
    const sid = useSessionStore.getState().sessionId;
    if (sid) {
      await bootstrap(sid);
    }
    setPhase("ready");
  };

  if (phase === "loading") {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#22d3ee" size="large" />
      </View>
    );
  }

  if (phase === "onboarding") {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </SafeAreaProvider>
    );
  }

  if (phase === "vehicle_setup") {
    return (
      <SafeAreaProvider>
        <VehicleSetupScreen onComplete={handleVehicleComplete} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <CarPlayProvider />
      <NavigationContainer theme={{ dark: true, colors: { primary: "#22d3ee", background: "#0d0d0d", card: "#111827", text: "#f1f5f9", border: "#1e293b", notification: "#22d3ee" } }}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: { backgroundColor: "#111827", borderTopColor: "#1e293b" },
            tabBarActiveTintColor: "#22d3ee",
            tabBarInactiveTintColor: "#475569",
          }}
        >
          <Tab.Screen
            name="Intercom"
            component={HomeScreen}
            options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🎙</Text> }}
          />
          <Tab.Screen
            name="Convoy"
            component={ConvoyHistoryScreen}
            options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🚗</Text> }}
          />
          <Tab.Screen
            name="Regulars"
            component={RegularsScreen}
            options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⭐</Text> }}
          />
          <Tab.Screen
            name="Settings"
            options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text> }}
          >
            {() => <SettingsScreen onEditVehicle={() => setPhase("vehicle_setup")} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

async function bootstrap(sessionId: string): Promise<void> {
  wsService.connect(sessionId);
  await configureLocationService();
  await startLocationTracking();
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    alignItems: "center",
    justifyContent: "center",
  },
});
