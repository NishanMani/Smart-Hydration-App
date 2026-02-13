import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserProfile, updateUserProfile } from "../api/userApi";

export default function DailyGoalScreen() {

  const navigation = useNavigation();

  const [goal, setGoal] = useState("");

  // Load saved goal
  useEffect(() => {
    loadGoal();
  }, []);

  const loadGoal = async () => {
    try {
      const res = await getUserProfile().catch(() => null);
      const serverGoal = Number(res?.data?.dailyGoal || 0);
      if (serverGoal > 0) {
        setGoal(String(serverGoal));
        return;
      }

      const data = await AsyncStorage.getItem("hydrationData");

      if (!data) return;

      const parsed = JSON.parse(data);

      setGoal(String(parsed.goal || 2772));

    } catch (e) {
      console.log(e);
    }
  };

  // Save Goal
  const saveGoal = async () => {
    try {
      const parsedGoal = Number(goal);
      if (!Number.isFinite(parsedGoal) || parsedGoal <= 0) {
        Alert.alert("Invalid Goal", "Please enter a valid daily goal in ml.");
        return;
      }

      const data = await AsyncStorage.getItem("hydrationData");

      let parsed = data ? JSON.parse(data) : {};

      const updatedData = {
        ...parsed,
        goal: parsedGoal,
      };

      await updateUserProfile({ dailyGoal: String(parsedGoal) }).catch(() => null);

      await AsyncStorage.setItem(
        "hydrationData",
        JSON.stringify(updatedData)
      );

      navigation.goBack();

    } catch (e) {
      console.log(e);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* HEADER */}
      <View style={styles.headerRow}>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#111"
          />
        </TouchableOpacity>

        <Text style={styles.header}>
          Daily Goal
        </Text>

      </View>

      {/* CARD */}
      <View style={styles.card}>

        <Text style={styles.label}>
          Set your daily hydration goal
        </Text>

        <TextInput
          value={goal}
          onChangeText={setGoal}
          keyboardType="numeric"
          style={styles.input}
          placeholder="Enter ml"
        />

        <Text style={styles.helper}>
          Recommended: 2000 – 3500 ml
        </Text>

      </View>

      {/* SAVE BUTTON */}
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={saveGoal}
      >
        <Text style={styles.saveText}>
          Save Goal
        </Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: "#e6f0f4",
    padding: 20,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  header: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 10,
    color: "#111827",
  },

  card: {
    backgroundColor: "#f3f4f6",
    padding: 20,
    borderRadius: 18,
  },

  label: {
    fontWeight: "700",
    marginBottom: 10,
  },

  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
  },

  helper: {
    marginTop: 8,
    fontSize: 12,
    color: "#6b7280",
  },

  saveBtn: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
  },

  saveText: {
    color: "#fff",
    fontWeight: "700",
  },

});
