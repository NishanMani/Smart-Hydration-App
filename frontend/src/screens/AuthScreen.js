import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigation = useNavigation();

  const validateEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSubmit = () => {
    if (activeTab === "register" && name.trim() === "") {
      Alert.alert("Error", "Name is required");
      return;
    }

    if (email.trim() === "") {
      Alert.alert("Error", "Email is required");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Error", "Enter valid email");
      return;
    }

    if (password.trim() === "") {
      Alert.alert("Error", "Password is required");
      return;
    }

    if (activeTab === "register" && password.length < 6) {
      Alert.alert(
        "Error",
        "Password must be at least 6 characters"
      );
      return;
    }

   navigation.replace("Onboarding");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          <View style={styles.logoCircle}>
            <Image
              source={require("../../assets/water.png")}
              style={styles.logo}
            />
          </View>

          <Text style={styles.title}>HydroTrack</Text>
          <Text style={styles.subtitle}>
            Stay hydrated, stay healthy
          </Text>

          <View style={styles.card}>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  activeTab === "login" && styles.activeToggle,
                ]}
                onPress={() => setActiveTab("login")}
              >
                <Text
                  style={[
                    styles.toggleText,
                    activeTab === "login" &&
                      styles.activeText,
                  ]}
                >
                  Login
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  activeTab === "register" &&
                    styles.activeToggle,
                ]}
                onPress={() =>
                  setActiveTab("register")
                }
              >
                <Text
                  style={[
                    styles.toggleText,
                    activeTab === "register" &&
                      styles.activeText,
                  ]}
                >
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === "register" && (
              <>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  placeholder="Your name"
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                />
              </>
            )}

            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="Enter your email address"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder="Enter your password"
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleSubmit}
            >
              <Text style={styles.loginText}>
                {activeTab === "login"
                  ? "Login"
                  : "Create Account"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "90%",
    alignItems: "center",
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 40,
    height: 40,
    tintColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#f3f4f6",
    padding: 20,
    borderRadius: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    borderRadius: 12,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  activeToggle: {
    backgroundColor: "#3b82f6",
  },
  toggleText: {
    color: "#374151",
    fontWeight: "600",
  },
  activeText: {
    color: "#fff",
  },
  label: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  loginBtn: {
    backgroundColor: "#3b82f6",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  loginText: {
    color: "#fff",
    fontWeight: "700",
  },
});