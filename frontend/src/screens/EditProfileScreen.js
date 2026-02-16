import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert
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
        setWeight(user.weight ? String(user.weight) : (parsed?.weight ? String(parsed.weight) : ""));
        setHeight(user.height ? String(user.height) : (parsed?.height ? String(parsed.height) : ""));
        setAge(user.age ? String(user.age) : (parsed?.age ? String(parsed.age) : ""));
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

    if (!name || !email) {
      Alert.alert("Error", "Name & Email required");
      return;
    }

    try {
      const parsedWeight = Number(weight);
      const parsedHeight = Number(height);
      const parsedAge = Number(age);

      const profile = {
        name: name.trim(),
        email: email.trim(),
        weight: weight.trim() === "" || Number.isNaN(parsedWeight) ? undefined : parsedWeight,
        height: height.trim() === "" || Number.isNaN(parsedHeight) ? undefined : parsedHeight,
        age: age.trim() === "" || Number.isNaN(parsedAge) ? undefined : parsedAge,
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

      await AsyncStorage.setItem(
        "userProfile",
        JSON.stringify(updatedProfile)
      );

      const existingHydration = await AsyncStorage.getItem("hydrationData");
      const parsedHydration = existingHydration ? JSON.parse(existingHydration) : {};
      await AsyncStorage.setItem(
        "hydrationData",
        JSON.stringify({
          ...parsedHydration,
          goal: calculateGoal(),
        })
      );

      Alert.alert(
        "Success",
        "Profile Updated"
      );

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
            Edit Profile
          </Text>

        </View>

        {/* FORM */}

        <View style={styles.card}>

          {/* NAME */}
          <Text style={styles.label}>
            Name
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="Enter name"
          />

          {/* EMAIL */}
          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholder="Enter email"
            keyboardType="email-address"
          />

          {/* WEIGHT */}
          <Text style={styles.label}>
            Weight (kg)
          </Text>

          <TextInput
            value={weight}
            onChangeText={setWeight}
            style={styles.input}
            keyboardType="numeric"
          />

          {/* HEIGHT */}
          <Text style={styles.label}>
            Height (cm)
          </Text>

          <TextInput
            value={height}
            onChangeText={setHeight}
            style={styles.input}
            keyboardType="numeric"
          />

          {/* AGE */}
          <Text style={styles.label}>
            Age
          </Text>

          <TextInput
            value={age}
            onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ""))}
            style={styles.input}
            keyboardType="numeric"
            maxLength={3}
          />

          {/* GENDER */}
          <Text style={styles.label}>
            Gender
          </Text>
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

          {/* ACTIVITY */}
          <Text style={styles.label}>
            Activity Level
          </Text>
          <View style={styles.optionWrap}>
            {ACTIVITY_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.tagBtn,
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

          {/* CLIMATE */}
          <Text style={styles.label}>
            Climate
          </Text>
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

          {/* CONDITION */}
          <Text style={styles.label}>
            Special Condition
          </Text>
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

          {/* LIFESTYLE */}
          <Text style={styles.label}>
            Lifestyle
          </Text>
          <View style={styles.optionWrap}>
            {LIFESTYLE_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.tagBtn,
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

          {/* UNIT */}
          <Text style={styles.label}>
            Preferred Unit
          </Text>
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

          <View style={styles.goalBox}>
            <Text style={styles.goalLabel}>
              Suggested Daily Goal
            </Text>
            <Text style={styles.goalValue}>
              {calculateGoal()} {unit}
            </Text>
          </View>

        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={saveProfile}
        >
          <Text style={styles.saveText}>
            Save Changes
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

  /* FORM CARD */

  card: {
    backgroundColor: "#f3f4f6",
    padding: 18,
    borderRadius: 18,
  },

  label: {
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
    color: "#374151",
  },

  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
  },

  optionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },

  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },

  optionBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },

  optionBtnActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },

  optionText: {
    color: "#1f2937",
    fontWeight: "500",
  },

  optionTextActive: {
    color: "#fff",
  },

  tagBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  tagBtnActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },

  tagText: {
    color: "#1f2937",
    fontWeight: "500",
  },

  tagTextActive: {
    color: "#fff",
  },

  goalBox: {
    marginTop: 14,
    backgroundColor: "#dbeafe",
    borderRadius: 12,
    padding: 12,
  },

  goalLabel: {
    color: "#1d4ed8",
    fontSize: 12,
  },

  goalValue: {
    color: "#1e3a8a",
    fontSize: 20,
    fontWeight: "700",
  },

  /* SAVE */

  saveBtn: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 24,
  },

  saveText: {
    color: "#fff",
    fontWeight: "700",
  },

});
