import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { getUserProfile } from "../api/userApi";
import {
  addWaterLog as addWaterLogApi,
  deleteWaterLog as deleteWaterLogApi,
  getDailySummary,
} from "../api/waterApi";


export default function DashboardScreen() {

  const navigation = useNavigation();

  //  Intake State
 const [intake, setIntake] = useState(0);
 const [goal, setGoal] = useState(2772);
  
  const [logs, setLogs] = useState([]);
  const [streak, setStreak] = useState(0);
  const [lastCompletedDate, setLastCompletedDate] = useState(null);
  const [profileName, setProfileName] = useState("User");

  const [modalVisible, setModalVisible] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const currentDateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

 

  const safeGoal = Number(goal) > 0 ? Number(goal) : 1;
  const fill = Math.min((intake / safeGoal) * 100, 100);

  //useEffect
  useEffect(() => {
  saveData();
}, [intake, logs]);

const saveData = async () => {

  try {
    const existing = await AsyncStorage.getItem("hydrationData");
    const parsed = existing ? JSON.parse(existing) : { logs: [] };

    const today = new Date().toDateString();
    const oldLogs = parsed.logs || [];
    const filtered = oldLogs.filter((log) => log.date !== today);
    const todaysLogs = logs.map((log) => ({
      ...log,
      date: today,
    }));
    const updatedLogs = [...filtered, ...todaysLogs];

    await AsyncStorage.setItem("hydrationData", JSON.stringify({
      ...parsed,
      date: today,
      goal,
      intake,
      streak,
      lastCompletedDate,
      logs: updatedLogs,
    }));

  } catch (e) {
    console.log("Save error", e);
  }

};

useEffect(() => {
  loadHydrationData();
}, []);

const loadData = async () => {
  try {
    const data = await AsyncStorage.getItem("hydrationData");

    if (!data) return;

    const parsed = JSON.parse(data);
    const today = new Date().toDateString();
    const allLogs = parsed.logs || [];
    const todaysLogs = allLogs.filter((log) => log.date === today);
    const parsedGoal = Number(parsed.goal || 2772);
    const safeParsedGoal = parsedGoal > 0 ? parsedGoal : 2772;
    const todaysIntake = todaysLogs.reduce((sum, log) => sum + Number(log.amount || 0), 0);
    const cappedIntake = Math.min(todaysIntake, safeParsedGoal);

    setGoal(safeParsedGoal);
    setStreak(parsed.streak || 0);
    setLastCompletedDate(parsed.lastCompletedDate || null);
    setLogs(todaysLogs);
    setIntake(cappedIntake);

  } catch (e) {
    console.log("Load error", e);
  }
};

useEffect(() => {
  checkStreak();
}, [intake]);

const checkStreak = () => {
  if (intake < goal) return;

  const today = new Date().toDateString();

  if (lastCompletedDate === today) return;

  setStreak((prev) => prev + 1);
  setLastCompletedDate(today);
};

  // ✅ Add Water Logic
  const addWater = async (amount) => {
  const value = Number(amount || 0);
  if (value <= 0) return;

  try {
    await addWaterLogApi(value);
    await loadHydrationData();
    return;
  } catch (e) {
    console.log(e);
  }

  setIntake((prev) =>
    Math.min(prev + value, goal)
  );

  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  setLogs((prev) => [
    ...prev,
    { amount: value, time, date: new Date().toDateString() },
  ]);
};

//addcustomwater

  const addCustomWater = async () => {
  if (!customAmount) return;

  const amount = parseInt(customAmount, 10);
  if (Number.isNaN(amount) || amount <= 0) return;

  try {
    await addWaterLogApi(amount);
    await loadHydrationData();
  } catch (e) {
    console.log(e);

    setIntake((prev) =>
      Math.min(prev + amount, goal)
    );

    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setLogs((prev) => [
      ...prev,
      { amount, time, date: new Date().toDateString() },
    ]);
  }

  setCustomAmount("");
  setModalVisible(false);
};

//deletelog

const deleteLog = async (index, amount, id) => {
  if (id) {
    try {
      await deleteWaterLogApi(id);
      await loadHydrationData();
      return;
    } catch (e) {
      console.log(e);
    }
  }

  setLogs((prev) =>
    prev.filter((_, i) => i !== index)
  );

  setIntake((prev) =>
    Math.max(prev - amount, 0)
  );
};

const loadHydrationData = async () => {

  try {
    const syncProfileName = async (serverProfile = null) => {
      if (serverProfile?.name?.trim()) {
        setProfileName(serverProfile.name.trim());
        return;
      }

      const localProfile = await AsyncStorage.getItem("userProfile");
      if (!localProfile) {
        setProfileName("User");
        return;
      }

      const parsedProfile = JSON.parse(localProfile);
      setProfileName(parsedProfile?.name?.trim() || "User");
    };

    const summaryRes = await getDailySummary().catch(() => null);
    const summary = summaryRes?.data;

    if (summary?.success) {
      const apiLogs = Array.isArray(summary.logs)
        ? summary.logs.map((log) => ({
            id: log._id,
            amount: Number(log.amount || 0),
            time: new Date(log.date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            date: new Date(log.date).toDateString(),
          }))
        : [];

      const [profileRes, local] = await Promise.all([
        getUserProfile().catch(() => null),
        AsyncStorage.getItem("hydrationData"),
      ]);
      const localParsed = local ? JSON.parse(local) : {};
      await syncProfileName(profileRes?.data);
      const serverGoal = Number(profileRes?.data?.dailyGoal || 0);
      const localGoal = Number(localParsed.goal || 2772);
      const selectedGoal = serverGoal > 0 ? serverGoal : localGoal;
      const safeParsedGoal = selectedGoal > 0 ? selectedGoal : 2772;

      setIntake(Math.min(Number(summary.totalIntake || 0), safeParsedGoal));
      setGoal(safeParsedGoal);
      setLogs(apiLogs);
      return;
    }

    const data = await AsyncStorage.getItem("hydrationData");

    if (!data) return;

    const parsed = JSON.parse(data);
    await syncProfileName();
    const today = new Date().toDateString();
    const todayLogs = (parsed.logs || []).filter((log) => log.date === today);
    const parsedGoal = Number(parsed.goal || 2772);
    const safeParsedGoal = parsedGoal > 0 ? parsedGoal : 2772;
    const todayIntake = todayLogs.reduce((sum, log) => sum + Number(log.amount || 0), 0);
    const cappedIntake = Math.min(todayIntake, safeParsedGoal);

    setIntake(cappedIntake);
    setGoal(safeParsedGoal);
    setLogs(todayLogs);

  } catch (e) {
    console.log(e);
  }

};

useFocusEffect(
  useCallback(() => {
    loadHydrationData();
  }, [])
);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.container}>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                Hello, {profileName}
              </Text>
              <Text style={styles.date}>
                {currentDateLabel}
              </Text>
            </View>

            <TouchableOpacity
             style={styles.bell}
              onPress={() => navigation.navigate("Reminders")}
            >
            <Ionicons
              name="notifications-outline"
              size={20}
               color="#3b82f6"
             />
            </TouchableOpacity>
          </View>

          {/* Progress Circle */}
          <View style={styles.progressWrapper}>

            <AnimatedCircularProgress
              size={200}
              width={12}
              fill={fill}
              tintColor="#3b82f6"
              backgroundColor="#d1d5db"
              rotation={0}
            >
              {() => (
                <View style={{ alignItems: "center" }}>
                  <Text style={styles.percent}>
                    {Math.round(fill)}%
                  </Text>
                  <Text style={styles.complete}>
                    Complete
                  </Text>
                </View>
              )}
            </AnimatedCircularProgress>

            <Text style={styles.intake}>
              {intake} / {goal} ml
            </Text>

            <Text style={styles.remaining}>
              {Math.max(goal - intake, 0)} ml to go
            </Text>

          </View>

          {/* Quick Add */}
          <Text style={styles.sectionTitle}>
            Quick Add
          </Text>

          <View style={styles.quickRow}>
            {[250, 500, 750, 1000].map((amt) => (
              <TouchableOpacity
                key={amt}
                style={styles.quickCard}
                onPress={() => addWater(amt)}
              >
                <Text style={styles.drop}>💧</Text>
                <Text style={styles.quickAmt}>{amt}</Text>
                <Text style={styles.quickUnit}>ml</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Button */}
          <TouchableOpacity
  style={styles.customBtn}
  onPress={() => setModalVisible(true)}
>
            <Text style={styles.customText}>
              + Custom Amount
            </Text>
          </TouchableOpacity>

          {/* Today Activity */}
          <Text style={styles.sectionTitle}>
            Today’s Activity
          </Text>

          <View style={styles.activityCard}>

  {logs.length === 0 ? (
    <Text style={styles.emptyText}>
      No water logged yet today
    </Text>
  ) : (
    logs.map((log, index) => (
  <View key={index} style={styles.logRow}>

    <Text style={styles.logAmt}>
      💧 {log.amount} ml
    </Text>

    <View style={styles.logRight}>
      <Text style={styles.logTime}>
        {log.time}
      </Text>

      <TouchableOpacity
        onPress={() =>
          deleteLog(index, log.amount, log.id)
        }
      >
        <Ionicons
          name="trash-outline"
          size={16}
          color="#ef4444"
        />
      </TouchableOpacity>
    </View>

  </View>
))
  )}

</View>

          {/* Insights Card */}
          <TouchableOpacity
            style={styles.insightCard}
            onPress={() => navigation.navigate("Analytics")}
          >
            <View style={styles.insightLeft}>
              <View style={styles.trophyCircle}>
                <Text style={styles.trophy}>🏆</Text>
              </View>

              <View>
                <Text style={styles.insightTitle}>
                  View Your Progress
                </Text>
                <Text style={styles.insightSub}>
                  Weekly & monthly insights
                </Text>
              </View>
            </View>

            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

        </View>
        {/* Custom Amount Modal */}

<Modal
  visible={modalVisible}
  transparent
  animationType="slide"
>
  <View style={styles.modalOverlay}>

    <View style={styles.modalCard}>

      <Text style={styles.modalTitle}>
        Add Custom Amount
      </Text>

      <TextInput
        placeholder="Enter ml"
        keyboardType="numeric"
        value={customAmount}
        onChangeText={setCustomAmount}
        style={styles.modalInput}
      />

      <TouchableOpacity
        style={styles.modalAddBtn}
        onPress={addCustomWater}
      >
        <Text style={styles.modalAddText}>
          Add Water
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setModalVisible(false)}
      >
        <Text style={styles.modalCancel}>
          Cancel
        </Text>
      </TouchableOpacity>

    </View>
  </View>
</Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#e6f0f4",
  },

  container: {
    padding: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  date: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },

  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
  },

  progressWrapper: {
    marginTop: 40,
    alignItems: "center",
  },

  percent: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },

  complete: {
    fontSize: 13,
    color: "#6b7280",
  },

  intake: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2563eb",
    marginTop: 20,
  },

  remaining: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginTop: 30,
    marginBottom: 14,
  },

  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  quickCard: {
    width: "22%",
    backgroundColor: "#f3f4f6",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    elevation: 2,
  },

  drop: {
    fontSize: 20,
    marginBottom: 6,
  },

  quickAmt: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  quickUnit: {
    fontSize: 12,
    color: "#6b7280",
  },

  customBtn: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
  },

  customText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },

  activityCard: {
    backgroundColor: "#f3f4f6",
    padding: 30,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 10,
  },

  emptyText: {
    color: "#9ca3af",
    fontSize: 13,
  },

  insightCard: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 18,
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  insightLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  trophyCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f472b6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  trophy: {
    fontSize: 18,
    color: "#fff",
  },

  insightTitle: {
    fontWeight: "700",
    color: "#111827",
  },

  insightSub: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },

  arrow: {
    fontSize: 22,
    color: "#9ca3af",
  },

  scroll: {
    paddingBottom: 40,
  },
  modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.4)",
  justifyContent: "center",
  alignItems: "center",
},

modalCard: {
  width: "80%",
  backgroundColor: "#fff",
  padding: 20,
  borderRadius: 20,
},

modalTitle: {
  fontSize: 18,
  fontWeight: "700",
  marginBottom: 16,
  textAlign: "center",
},

modalInput: {
  borderWidth: 1,
  borderColor: "#e5e7eb",
  padding: 12,
  borderRadius: 10,
  marginBottom: 16,
},

modalAddBtn: {
  backgroundColor: "#3b82f6",
  padding: 14,
  borderRadius: 12,
  alignItems: "center",
},

modalAddText: {
  color: "#fff",
  fontWeight: "700",
},

modalCancel: {
  textAlign: "center",
  marginTop: 12,
  color: "#6b7280",
},
logRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  width: "100%",
  paddingVertical: 6,
},

logAmt: {
  fontWeight: "600",
  color: "#111827",
},

logTime: {
  color: "#6b7280",
  fontSize: 12,
},
logRight: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
},
});
