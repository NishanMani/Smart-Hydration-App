import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserProfile, updateUserProfile } from "../api/userApi";

const ACTIVITY_OPTIONS = [
  "Sedentary",
  "Light",
  "Moderate",
  "Active",
  "Very Active",
];

const CLIMATE_OPTIONS = ["Cold", "Moderate", "Hot"];
const CONDITION_OPTIONS = ["None", "Pregnant", "Breastfeeding"];
const LIFESTYLE_OPTIONS = [
  "Standard",
  "Athlete",
  "Office Worker",
  "Outdoor Worker",
  "Senior citizen",
];
const UNIT_OPTIONS = ["ml", "oz"];

export default function EditProfileScreen() {
  const navigation = useNavigation();

  /* STATE */

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [activityLevel, setActivityLevel] = useState("Moderate");
  const [climate, setClimate] = useState("Moderate");
  const [condition, setCondition] = useState("None");
  const [lifestyle, setLifestyle] = useState("Standard");
  const [unit, setUnit] = useState("ml");

  const parseNumeric = (value) => Number(String(value).trim());
  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
  };

  /* LOAD EXISTING DATA */

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const [res, data] = await Promise.all([
        getUserProfile().catch(() => null),
        AsyncStorage.getItem("userProfile"),
      ]);
      const user = res?.data;
      const parsed = data ? JSON.parse(data) : null;

      if (user) {
        setName(user.name || "");
        setEmail(user.email || "");
        setWeight(
          user.weight
            ? String(user.weight)
            : parsed?.weight
              ? String(parsed.weight)
              : ""
        );
        setHeight(
          user.height
            ? String(user.height)
            : parsed?.height
              ? String(parsed.height)
              : ""
        );
        setAge(
          user.age
            ? String(user.age)
            : parsed?.age
              ? String(parsed.age)
              : ""
        );
        setGender(user.gender || "Male");
        setActivityLevel(user.activityLevel || "Moderate");
        setClimate(user.climate || "Moderate");
        setLifestyle(user.lifestyle || "Standard");
        setUnit(user.unit || "ml");
        setCondition(
          user.pregnant
            ? "Pregnant"
            : user.breastfeeding
              ? "Breastfeeding"
              : "None"
        );
        return;
      }
      if (!parsed) return;

      setName(parsed.name || "");
      setEmail(parsed.email || "");
      setWeight(parsed.weight ? String(parsed.weight) : "");
      setHeight(parsed.height ? String(parsed.height) : "");
      setAge(parsed.age ? String(parsed.age) : "");
      setGender(parsed.gender || "Male");
      setActivityLevel(parsed.activityLevel || "Moderate");
      setClimate(parsed.climate || "Moderate");
      setLifestyle(parsed.lifestyle || "Standard");
      setUnit(parsed.unit || "ml");
      setCondition(
        parsed.pregnant
          ? "Pregnant"
          : parsed.breastfeeding
            ? "Breastfeeding"
            : "None"
      );
    } catch (e) {
      console.log(e);
    }
  };

  const calculateGoal = () => {
    let base = weight ? Number(weight) * 35 : 2000;

    if (activityLevel === "Active") base += 300;
    if (activityLevel === "Very Active") base += 500;
    if (climate === "Hot") base += 300;
    if (climate === "Cold") base -= 100;

    return Math.round(base);
  };

  /* SAVE PROFILE */

  const saveProfile = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert("Error", "Name and email are required.");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    try {
      const parsedWeight = parseNumeric(weight);
      const parsedHeight = parseNumeric(height);
      const parsedAge = parseNumeric(age);

      if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
        Alert.alert("Invalid Input", "Please enter a valid weight.");
        return;
      }

      if (!Number.isFinite(parsedHeight) || parsedHeight <= 0) {
        Alert.alert("Invalid Input", "Please enter a valid height.");
        return;
      }

      if (!Number.isFinite(parsedAge) || parsedAge <= 0) {
        Alert.alert("Invalid Input", "Please enter a valid age.");
        return;
      }

      const profile = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        weight: parsedWeight,
        height: parsedHeight,
        age: parsedAge,
        gender,
        activityLevel,
        climate,
        lifestyle,
        unit,
        pregnant: condition === "Pregnant",
        breastfeeding: condition === "Breastfeeding",
        dailyGoal: String(calculateGoal()),
      };

      const updateRes = await updateUserProfile(profile);
      const updatedProfile = updateRes?.data || profile;

      await AsyncStorage.setItem("userProfile", JSON.stringify(updatedProfile));

      const existingHydration = await AsyncStorage.getItem("hydrationData");
      const parsedHydration = existingHydration ? JSON.parse(existingHydration) : {};
      await AsyncStorage.setItem(
        "hydrationData",
        JSON.stringify({
          ...parsedHydration,
          goal: calculateGoal(),
        })
      );

      Alert.alert("Success", "Profile Updated");

      navigation.goBack();
    } catch (e) {
      console.log("Profile update failed", e);
      Alert.alert(
        "Update Failed",
        e?.response?.data?.message || "Could not update profile. Please try again."
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#0f172a" />
          </TouchableOpacity>

          <View style={styles.headerTextWrap}>
            <Text style={styles.header}>Edit Profile</Text>
            <Text style={styles.subHeader}>Keep your hydration plan accurate</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Basic Details</Text>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Enter name"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholder="Enter email"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldBlockNoMargin}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.optionRow}>
              {["Male", "Female", "Other"].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.optionBtn,
                    gender === item && styles.optionBtnActive,
                  ]}
                  onPress={() => setGender(item)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      gender === item && styles.optionTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Body Metrics</Text>

          <View style={styles.inlineFields}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                value={weight}
                onChangeText={(text) => setWeight(text.replace(/[^0-9.]/g, ""))}
                style={styles.input}
                keyboardType="numeric"
                placeholder="e.g. 70"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.halfField}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                value={height}
                onChangeText={(text) => setHeight(text.replace(/[^0-9.]/g, ""))}
                style={styles.input}
                keyboardType="numeric"
                placeholder="e.g. 170"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.fieldBlockNoMargin}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              value={age}
              onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ""))}
              style={styles.input}
              keyboardType="numeric"
              maxLength={3}
              placeholder="Enter age"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Lifestyle & Preferences</Text>

          <View style={styles.preferenceBlock}>
            <Text style={styles.label}>Activity Level</Text>
            <View style={styles.preferenceGrid}>
              {ACTIVITY_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.tagBtn,
                    styles.preferenceTagBtn,
                    activityLevel === item && styles.tagBtnActive,
                  ]}
                  onPress={() => setActivityLevel(item)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      activityLevel === item && styles.tagTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.preferenceBlock}>
            <Text style={styles.label}>Climate</Text>
            <View style={styles.optionRow}>
              {CLIMATE_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.optionBtn,
                    climate === item && styles.optionBtnActive,
                  ]}
                  onPress={() => setClimate(item)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      climate === item && styles.optionTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.preferenceBlock}>
            <Text style={styles.label}>Special Condition</Text>
            <View style={styles.optionWrap}>
              {CONDITION_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.tagBtn,
                    condition === item && styles.tagBtnActive,
                  ]}
                  onPress={() => setCondition(item)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      condition === item && styles.tagTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.preferenceBlock}>
            <Text style={styles.label}>Lifestyle</Text>
            <View style={styles.preferenceGrid}>
              {LIFESTYLE_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.tagBtn,
                    styles.preferenceTagBtn,
                    lifestyle === item && styles.tagBtnActive,
                  ]}
                  onPress={() => setLifestyle(item)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      lifestyle === item && styles.tagTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.preferenceBlockLast}>
            <Text style={styles.label}>Preferred Unit</Text>
            <View style={styles.optionRow}>
              {UNIT_OPTIONS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.optionBtn,
                    unit === item && styles.optionBtnActive,
                  ]}
                  onPress={() => setUnit(item)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      unit === item && styles.optionTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.goalBox}>
          <Text style={styles.goalLabel}>Suggested Daily Goal</Text>
          <Text style={styles.goalValue}>
            {calculateGoal()} {unit}
          </Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
          <Text style={styles.saveText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#eef4ff",
  },

  scroll: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 34,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  headerTextWrap: {
    marginLeft: 10,
  },

  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },

  subHeader: {
    fontSize: 13,
    color: "#475569",
    marginTop: 2,
  },

  sectionCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },

  fieldBlock: {
    marginBottom: 14,
  },

  fieldBlockNoMargin: {
    marginBottom: 0,
  },

  preferenceBlock: {
    backgroundColor: "#f8fbff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  preferenceBlockLast: {
    backgroundColor: "#f8fbff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
  },

  preferenceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  preferenceTagBtn: {
    width: "48%",
    alignItems: "center",
  },

  inlineFields: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },

  halfField: {
    flex: 1,
  },

  label: {
    fontWeight: "600",
    marginBottom: 7,
    color: "#334155",
  },

  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#dbe5f3",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    color: "#0f172a",
  },

  optionRow: {
    flexDirection: "row",
    gap: 8,
  },

  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  optionBtn: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },

  optionBtnActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },

  optionText: {
    color: "#1f2937",
    fontWeight: "600",
  },

  optionTextActive: {
    color: "#fff",
  },

  tagBtn: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  tagBtnActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },

  tagText: {
    color: "#334155",
    fontWeight: "600",
  },

  tagTextActive: {
    color: "#fff",
  },

  goalBox: {
    backgroundColor: "#dbeafe",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },

  goalLabel: {
    color: "#1d4ed8",
    fontSize: 12,
  },

  goalValue: {
    color: "#1e3a8a",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 2,
  },

  saveBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 16,
  },

  saveText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
