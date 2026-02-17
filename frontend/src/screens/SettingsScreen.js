import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { removeToken } from "../services/storageService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useState } from "react";
import { getUserProfile } from "../api/userApi";
import { normalizeUnit, toDisplayAmount } from "../utils/unit";

export default function SettingsScreen() {

  const navigation = useNavigation();
  const [profileName, setProfileName] = useState("User");
  const [profileEmail, setProfileEmail] = useState("No email");
  const [dailyGoal, setDailyGoal] = useState(2772);
  const [unit, setUnit] = useState("ml");

  const loadSettingsData = async () => {
    try {
      const [profileRes, profileData, hydrationData] = await Promise.all([
        getUserProfile().catch(() => null),
        AsyncStorage.getItem("userProfile"),
        AsyncStorage.getItem("hydrationData"),
      ]);

      const serverProfile = profileRes?.data;

      if (serverProfile) {
        setProfileName(serverProfile?.name?.trim() || "User");
        setProfileEmail(serverProfile?.email?.trim() || "No email");
        setUnit(normalizeUnit(serverProfile?.unit));
        const serverGoal = Number(serverProfile?.dailyGoal || 0);
        if (serverGoal > 0) setDailyGoal(serverGoal);
      }

      if (!serverProfile && profileData) {
        const parsedProfile = JSON.parse(profileData);
        setProfileName(parsedProfile?.name?.trim() || "User");
        setProfileEmail(parsedProfile?.email?.trim() || "No email");
        setUnit(normalizeUnit(parsedProfile?.unit));
      } else if (!serverProfile) {
        setProfileName("User");
        setProfileEmail("No email");
        setUnit("ml");
      }

      if (hydrationData && !serverProfile?.dailyGoal) {
        const parsedHydration = JSON.parse(hydrationData);
        setDailyGoal(Number(parsedHydration?.goal || 2772));
      } else if (!serverProfile?.dailyGoal) {
        setDailyGoal(2772);
      }
    } catch (e) {
      console.log("Settings load error", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSettingsData();
    }, [])
  );

  const handleLogout = () => {
    Alert.alert("Logout", "Do you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await removeToken();
            navigation.replace("Auth");
          } catch (e) {
            Alert.alert("Error", "Unable to logout. Try again.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

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
            Settings
          </Text>

        </View>

        {/* PROFILE CARD */}
        <View style={styles.profileCard}>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profileName?.charAt(0)?.toUpperCase() || "U"}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>
              {profileName}
            </Text>

            <Text style={styles.email}>
              {profileEmail}
            </Text>
          </View>

        </View>

        {/* MENU LIST */}

        {/* EDIT PROFILE */}
        <TouchableOpacity
  style={styles.menuCard}
  onPress={() =>
    navigation.navigate("EditProfile")
  }
>

          <View style={styles.menuLeft}>

            <View
              style={[
                styles.iconCircle,
                { backgroundColor: "#dbeafe" }
              ]}
            >
              <Ionicons
                name="person-outline"
                size={18}
                color="#3b82f6"
              />
            </View>

            <View>
              <Text style={styles.menuTitle}>
                Edit Profile
              </Text>
              <Text style={styles.menuSub}>
                Update your personal information
              </Text>
            </View>

          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color="#9ca3af"
          />

        </TouchableOpacity>

        {/* REMINDERS */}
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() =>
            navigation.navigate("Reminders")
          }
        >

          <View style={styles.menuLeft}>

            <View
              style={[
                styles.iconCircle,
                { backgroundColor: "#ede9fe" }
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={18}
                color="#8b5cf6"
              />
            </View>

            <View>
              <Text style={styles.menuTitle}>
                Reminders
              </Text>
              <Text style={styles.menuSub}>
                Manage notification settings
              </Text>
            </View>

          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color="#9ca3af"
          />

        </TouchableOpacity>

        {/* DAILY GOAL */}
       <TouchableOpacity
  style={styles.menuCard}
  onPress={() =>
    navigation.navigate("DailyGoal")
  }
>

          <View style={styles.menuLeft}>

            <View
              style={[
                styles.iconCircle,
                { backgroundColor: "#ccfbf1" }
              ]}
            >
              <Ionicons
                name="water-outline"
                size={18}
                color="#06b6d4"
              />
            </View>

            <View>
              <Text style={styles.menuTitle}>
                Daily Goal
              </Text>
              <Text style={styles.menuSub}>
                Currently: {toDisplayAmount(dailyGoal, unit)} {normalizeUnit(unit)}
              </Text>
            </View>

          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color="#9ca3af"
          />

        </TouchableOpacity>

        {/* LOGOUT */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
        >

          <Ionicons
            name="log-out-outline"
            size={18}
            color="#ef4444"
          />

          <Text style={styles.logoutText}>
            Logout
          </Text>

        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: "#e6f0f4",
  },

  scroll: {
    padding: 20,
    paddingBottom: 40,
  },

  /* HEADER */

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

  /* PROFILE */

  profileCard: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },

  name: {
    fontWeight: "700",
    fontSize: 16,
    color: "#111827",
  },

  email: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },

  /* MENU */

  menuCard: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  menuTitle: {
    fontWeight: "700",
    color: "#111827",
  },

  menuSub: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },

  /* LOGOUT */

  logoutBtn: {
    backgroundColor: "#fee2e2",
    padding: 16,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  logoutText: {
    color: "#ef4444",
    fontWeight: "700",
    marginLeft: 6,
  },

});
