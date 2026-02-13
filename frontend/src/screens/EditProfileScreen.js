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

export default function EditProfileScreen() {

  const navigation = useNavigation();

  /* STATE */

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");

  /* LOAD EXISTING DATA */

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getUserProfile().catch(() => null);
      const user = res?.data;

      if (user) {
        setName(user.name || "");
        setEmail(user.email || "");
        setWeight(user.weight ? String(user.weight) : "");
        setHeight(user.height ? String(user.height) : "");
        setAge(user.age ? String(user.age) : "");
        return;
      }

      const data = await AsyncStorage.getItem("userProfile");

      if (!data) return;

      const parsed = JSON.parse(data);

      setName(parsed.name || "");
      setEmail(parsed.email || "");
      setWeight(parsed.weight || "");
      setHeight(parsed.height || "");
      setAge(parsed.age || "");

    } catch (e) {
      console.log(e);
    }
  };

  /* SAVE PROFILE */

  const saveProfile = async () => {

    if (!name || !email) {
      Alert.alert("Error", "Name & Email required");
      return;
    }

    try {

      const profile = {
        name: name.trim(),
        email: email.trim(),
        weight: weight ? Number(weight) : undefined,
        height: height ? Number(height) : undefined,
        age: age ? Number(age) : undefined,
      };

      await updateUserProfile(profile).catch(() => null);

      await AsyncStorage.setItem(
        "userProfile",
        JSON.stringify(profile)
      );

      Alert.alert(
        "Success",
        "Profile Updated"
      );

      navigation.goBack();

    } catch (e) {
      console.log(e);
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
            onChangeText={setAge}
            style={styles.input}
            keyboardType="numeric"
          />

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
