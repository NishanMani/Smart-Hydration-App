import { View, Text, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { getToken, removeToken } from "../services/storageService";
import { getUserProfile } from "../api/userApi";

export default function SplashScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const bootstrap = async () => {
      const token = await getToken();
      let nextRoute = "Auth";

      if (token) {
        const profile = await getUserProfile().catch(() => null);
        if (profile?.data) {
          nextRoute = "Dashboard";
        } else {
          await removeToken();
        }
      }

      setTimeout(() => {
        navigation.replace(nextRoute);
      }, 2000);
    };

    bootstrap();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
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
      </View>

      <Text style={styles.footer}>
        Your daily hydration companion
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3b82f6",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 80,
  },
  center: {
    alignItems: "center",
  },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 50,
    height: 50,
    tintColor: "#3b82f6",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#fff",
  },
  subtitle: {
    fontSize: 14,
    color: "#e0f2fe",
    marginTop: 6,
  },
  footer: {
    color: "#e0f2fe",
    fontSize: 13,
  },
});
