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

export default function DashboardScreen() {

  //  Intake State
  const [intake, setIntake] = useState(0);
  const [logs, setLogs] = useState([]);
  const [streak, setStreak] = useState(0);
  const [lastCompletedDate, setLastCompletedDate] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const goal = 2772;

  const fill = (intake / goal) * 100;

  //useEffect
  useEffect(() => {
  saveData();
}, [intake, logs]);

const saveData = async () => {
  try {
    const today = new Date().toDateString();

    await AsyncStorage.setItem(
      "hydrationData",
      JSON.stringify({
        intake,
        logs,
        date: today,
        streak,
        lastCompletedDate,
      })
    );
  } catch (e) {
    console.log("Save error", e);
  }
};

useEffect(() => {
  loadData();
}, []);

const loadData = async () => {
  try {
    const data = await AsyncStorage.getItem(
      "hydrationData"
    );

    if (!data) return;

    const parsed = JSON.parse(data);

    const today = new Date().toDateString();

    if (parsed.date === today) {
      setIntake(parsed.intake);
      setLogs(parsed.logs);
      setStreak(parsed.streak || 0);
      setLastCompletedDate(
        parsed.lastCompletedDate
      );

    } else {
      setIntake(0);
      setLogs([]);
    }

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
  const addWater = (amount) => {
  setIntake((prev) =>
    Math.min(prev + amount, goal)
  );

  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  setLogs((prev) => [
    ...prev,
    { amount, time },
  ]);
};

//addcustomwater

  const addCustomWater = () => {
  if (!customAmount) return;

  const amount = parseInt(customAmount);

  setIntake((prev) =>
    Math.min(prev + amount, goal)
  );

  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  setLogs((prev) => [
    ...prev,
    { amount, time },
  ]);

  setCustomAmount("");
  setModalVisible(false);
};

//deletelog

const deleteLog = (index, amount) => {
  setLogs((prev) =>
    prev.filter((_, i) => i !== index)
  );

  setIntake((prev) =>
    Math.max(prev - amount, 0)
  );
};

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
                Hello, Girish
              </Text>
              <Text style={styles.date}>
                Tuesday, February 10
              </Text>
            </View>

            <View style={styles.bell}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#3b82f6"
              />
            </View>
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
              {goal - intake} ml to go
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
          deleteLog(index, log.amount)
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
          <View style={styles.insightCard}>
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
          </View>

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