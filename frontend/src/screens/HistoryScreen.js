import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

export default function HistoryScreen() {

  const navigation = useNavigation();

  const [logs, setLogs] = useState([]);
  const goal = 2772;
  const MAX_HISTORY_ITEMS = 600;

  const sanitizeLogs = useCallback((items) => {
    if (!Array.isArray(items)) return [];

    return items
      .filter((log) => log && typeof log === "object")
      .map((log) => ({
        date: log.date || "Today",
        time: log.time || "--:--",
        amount: Number(log.amount || 0),
      }))
      .filter((log) => Number.isFinite(log.amount) && log.amount >= 0)
      .slice(-MAX_HISTORY_ITEMS);
  }, []);

  /* LOAD HISTORY */

  const loadHistory = useCallback(async () => {
    try {

      const data = await AsyncStorage.getItem(
        "hydrationData"
      );

      if (!data) {
        setLogs([]);
        return;
      }

      const parsed = JSON.parse(data);
      const parsedLogs = sanitizeLogs(parsed?.logs);

      setLogs(parsedLogs);

    } catch (e) {
      console.log(e);
    }
  }, [sanitizeLogs]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  /* DELETE LOG */

  const deleteLog = useCallback(async (index) => {
    try {

      const data = await AsyncStorage.getItem(
        "hydrationData"
      );

      if (!data) return;

      const parsed = JSON.parse(data);
      const existingLogs = sanitizeLogs(parsed?.logs);

      if (index < 0 || index >= existingLogs.length) {
        return;
      }

      const deletedLog = existingLogs[index];

      const updatedLogs = existingLogs.filter(
        (_, i) => i !== index
      );

      const today = new Date().toDateString();
      const parsedIntake = Number(parsed.intake || 0);
      const deletedAmount = Number(deletedLog?.amount || 0);
      const isTodayLog = (deletedLog?.date || today) === today;
      const updatedIntake = isTodayLog
        ? Math.max(parsedIntake - deletedAmount, 0)
        : parsedIntake;

      const updatedData = {
        ...parsed,
        logs: updatedLogs,
        intake: updatedIntake,
      };

      await AsyncStorage.setItem(
        "hydrationData",
        JSON.stringify(updatedData)
      );

      setLogs(sanitizeLogs(updatedLogs));

    } catch (e) {
      console.log(e);
    }
  }, [sanitizeLogs]);

  /* GROUP BY DATE */

  const groupByDate = () => {

    const grouped = {};

    logs.forEach((log) => {

      const date = log.date || "Today";

      if (!grouped[date]) {
        grouped[date] = [];
      }

      grouped[date].push(log);

    });

    return grouped;
  };

  const groupedLogs = useMemo(() => groupByDate(), [logs]);

  // WEEKLY PERFORMANCE

const calculateWeeklyPerformance = () => {

  if (logs.length === 0) {
    return {
      avgIntake: 0,
      completion: 0,
    };
  }

  // Take last 7 logs days intake

  const last7 = logs.slice(-7);

  const total = last7.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const avgIntake = Math.round(
    total / last7.length
  );

  const completion = Math.min(
    Math.round((avgIntake / goal) * 100),
    100
  );

  return {
    avgIntake,
    completion,
  };
};

const weeklyStats =
  calculateWeeklyPerformance();

  // MONTHLY COMPARISON

const calculateMonthlyComparison = () => {

  const now = new Date();

  const currentMonth =
    now.getMonth();

  const lastMonth =
    currentMonth === 0
      ? 11
      : currentMonth - 1;

  let thisMonthTotal = 0;
  let lastMonthTotal = 0;

  logs.forEach((log) => {

    if (!log.date) return;

    const logDate =
      new Date(log.date);

    const logMonth =
      logDate.getMonth();

    if (logMonth === currentMonth) {
      thisMonthTotal += Number(log.amount || 0);
    }

    if (logMonth === lastMonth) {
      lastMonthTotal += Number(log.amount || 0);
    }

  });

  let percentChange = 0;

  if (lastMonthTotal > 0) {
    percentChange = Math.round(
      ((thisMonthTotal -
        lastMonthTotal) /
        lastMonthTotal) * 100
    );
  }

  return {
    thisMonthTotal,
    lastMonthTotal,
    percentChange,
  };
};

const monthlyStats =
  calculateMonthlyComparison();

  // STREAK CALCULATION

const calculateStreak = () => {

  if (!logs.length) return 0;

  const totalsByDate = logs.reduce((acc, log) => {
    const dateKey = log.date || new Date().toDateString();
    acc[dateKey] = (acc[dateKey] || 0) + Number(log.amount || 0);
    return acc;
  }, {});

  let streak = 0;
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  while (true) {
    const day = new Date(currentDate);
    day.setDate(day.getDate() - streak);
    const dayKey = day.toDateString();

    if ((totalsByDate[dayKey] || 0) >= goal) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
};

const streak = calculateStreak();

const getBadge = () => {

  if (streak >= 30)
    return "Hydration Champion 🏆";

  if (streak >= 14)
    return "Hydration Pro 💪";

  if (streak >= 7)
    return "Consistency Star ⭐";

  if (streak >= 3)
    return "Getting There 👍";

  return "Start Your Journey 💧";
};

const badge = getBadge();
  
const exportPDF = async () => {

  try {

    if (!logs.length) {
      alert("No history to export");
      return;
    }

    // GROUP TOTALS

    const totals = {};

    logs.forEach((log) => {

      if (!totals[log.date]) {
        totals[log.date] = 0;
      }

      totals[log.date] += Number(log.amount || 0);

    });

    // HTML CONTENT

    const html = `
      <html>
      <body style="font-family: Arial; padding:20px;">

        <h1>Hydration Report 💧</h1>

        <h3>Total Logs: ${logs.length}</h3>

        <table border="1" 
          cellpadding="8" 
          cellspacing="0"
          width="100%"
        >
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Amount (ml)</th>
          </tr>

          ${logs.map(
            (log) => `
            <tr>
              <td>${log.date}</td>
              <td>${log.time}</td>
              <td>${log.amount}</td>
            </tr>
          `
          ).join("")}

        </table>

        <h2>Daily Totals</h2>

        <ul>
          ${Object.keys(totals).map(
            (date) => `
            <li>
              ${date} → 
              ${totals[date]} ml
            </li>
          `
          ).join("")}
        </ul>

      </body>
      </html>
    `;

    const Print = await import("expo-print");
    const Sharing = await import("expo-sharing");

    const { uri } =
      await Print.printToFileAsync({
        html,
      });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert(
        "Exported",
        "PDF created but sharing is not available on this device."
      );
      return;
    }

    await Sharing.shareAsync(uri);

  } catch (e) {
    console.log(e);
  }

};

  /* UI */

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
            History
          </Text>

        </View>

        <TouchableOpacity
  style={styles.exportBtn}
  onPress={exportPDF}
>
  <Text style={styles.exportText}>
    Export PDF
  </Text>
</TouchableOpacity>

        {/* WEEKLY PERFORMANCE */}

<View style={styles.weekCard}>

  <Text style={styles.weekTitle}>
    Weekly Performance
  </Text>

  <Text style={styles.weekValue}>
    {weeklyStats.avgIntake} ml / day
  </Text>

  <View style={styles.progressBar}>

    <View
      style={[
        styles.progressFill,
        {
          width:
            `${weeklyStats.completion}%`
        }
      ]}
    />

  </View>

  <Text style={styles.weekPercent}>
    {weeklyStats.completion}% of goal
  </Text>

</View>

{/* MONTHLY COMPARISON */}

<View style={styles.monthCard}>

  <Text style={styles.monthTitle}>
    Monthly Comparison
  </Text>

  <View style={styles.monthRow}>

    <View>
      <Text style={styles.monthLabel}>
        This Month
      </Text>

      <Text style={styles.monthValue}>
        {monthlyStats.thisMonthTotal} ml
      </Text>
    </View>

    <View>
      <Text style={styles.monthLabel}>
        Last Month
      </Text>

      <Text style={styles.monthValue}>
        {monthlyStats.lastMonthTotal} ml
      </Text>
    </View>

  </View>

  {/* PERCENT CHANGE */}

  <Text
    style={[
      styles.changeText,
      {
        color:
          monthlyStats.percentChange >= 0
            ? "#22c55e"
            : "#ef4444"
      }
    ]}
  >
    {monthlyStats.percentChange >= 0
      ? "↑"
      : "↓"}{" "}
    {Math.abs(
      monthlyStats.percentChange
    )}% compared to last month
  </Text>

</View>

{/* STREAK BADGE */}

<View style={styles.streakCard}>

  <View style={styles.streakLeft}>

    <View style={styles.trophyCircle}>
      <Text style={styles.trophyIcon}>
        🏆
      </Text>
    </View>

    <View>
      <Text style={styles.streakTitle}>
        Current Streak
      </Text>

      <Text style={styles.streakSub}>
        {badge}
      </Text>
    </View>

  </View>

  <Text style={styles.streakCount}>
    {streak} 🔥
  </Text>

</View>

        {/* EMPTY STATE */}
        {logs.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No water logged yet 💧
            </Text>
          </View>
        )}

        {/* GROUPED LOG LIST */}
        {Object.keys(groupedLogs).map((date) => (

          <View key={date}>

            {/* DATE HEADER */}
            {/* DATE HEADER + TOTAL + BADGE */}

<View style={styles.dateHeader}>

  <Text style={styles.date}>
    {date}
  </Text>

  {/* DAILY TOTAL */}

  <Text style={styles.totalText}>
    {groupedLogs[date]
      .reduce(
        (sum, item) => sum + item.amount,
        0
      )} ml
  </Text>

  {/* BADGE */}

  {(() => {

    const total =
      groupedLogs[date]
        .reduce(
          (sum, item) =>
            sum + item.amount,
          0
        );

    const percent =
      (total / goal) * 100;

    let badge = "⚠️ Low";
    let color = "#ef4444";

    if (percent >= 100) {
      badge = "🏆 Goal Met";
      color = "#22c55e";
    }
    else if (percent >= 50) {
      badge = "👍 Good";
      color = "#3b82f6";
    }

    return (
      <Text
        style={[
          styles.badge,
          { backgroundColor: color }
        ]}
      >
        {badge}
      </Text>
    );

  })()}

</View>

            {groupedLogs[date].map((item, index) => {

              const globalIndex = logs.indexOf(item);

              return (

                <View
                  key={`${date}-${index}`}
                  style={styles.logCard}
                >

                  <View>
                    <Text style={styles.amount}>
                      {item.amount} ml
                    </Text>

                    <Text style={styles.time}>
                      {item.time}
                    </Text>
                  </View>

                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color="#ef4444"
                    onPress={() =>
                      Alert.alert(
                        "Delete Log",
                        "Are you sure you want to delete this entry?",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: () => deleteLog(globalIndex),
                          },
                        ]
                      )
                    }
                  />

                </View>

              );

            })}

          </View>

        ))}

      </ScrollView>

    </SafeAreaView>
  );
}

/* STYLES */

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
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 10,
    color: "#111827",
  },

  /* DATE */

  date: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 8,
    color: "#374151",
  },

  /* EMPTY */

  emptyBox: {
    backgroundColor: "#f3f4f6",
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
  },

  emptyText: {
    color: "#9ca3af",
  },

  /* LOG CARD */

  logCard: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  amount: {
    fontWeight: "700",
    color: "#111827",
    fontSize: 15,
  },

  time: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 2,
  },
  dateHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 10,
  marginBottom: 8,
},

totalText: {
  fontSize: 13,
  fontWeight: "600",
  color: "#2563eb",
},

badge: {
  fontSize: 11,
  color: "#fff",
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 10,
  overflow: "hidden",
},
/* WEEKLY CARD */

weekCard: {
  backgroundColor: "#f3f4f6",
  marginBottom: 20,
  padding: 18,
  borderRadius: 18,
},

weekTitle: {
  fontWeight: "700",
  marginBottom: 6,
  color: "#111827",
},

weekValue: {
  fontSize: 16,
  fontWeight: "700",
  color: "#2563eb",
  marginBottom: 10,
},

progressBar: {
  height: 10,
  backgroundColor: "#e5e7eb",
  borderRadius: 10,
  overflow: "hidden",
},

progressFill: {
  height: 10,
  backgroundColor: "#3b82f6",
},

weekPercent: {
  marginTop: 8,
  fontSize: 12,
  color: "#6b7280",
},
/* MONTHLY CARD */

monthCard: {
  backgroundColor: "#f3f4f6",
  marginBottom: 20,
  padding: 18,
  borderRadius: 18,
},

monthTitle: {
  fontWeight: "700",
  marginBottom: 12,
  color: "#111827",
},

monthRow: {
  flexDirection: "row",
  justifyContent: "space-between",
},

monthLabel: {
  fontSize: 12,
  color: "#6b7280",
},

monthValue: {
  fontSize: 16,
  fontWeight: "700",
  color: "#2563eb",
  marginTop: 2,
},

changeText: {
  marginTop: 12,
  fontWeight: "600",
},
/* STREAK CARD */

streakCard: {
  backgroundColor: "#f3f4f6",
  marginBottom: 20,
  padding: 18,
  borderRadius: 18,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
},

streakLeft: {
  flexDirection: "row",
  alignItems: "center",
},

trophyCircle: {
  width: 42,
  height: 42,
  borderRadius: 21,
  backgroundColor: "#f59e0b",
  justifyContent: "center",
  alignItems: "center",
  marginRight: 12,
},

trophyIcon: {
  fontSize: 18,
  color: "#fff",
},

streakTitle: {
  fontWeight: "700",
  color: "#111827",
},

streakSub: {
  fontSize: 12,
  color: "#6b7280",
  marginTop: 2,
},

streakCount: {
  fontSize: 20,
  fontWeight: "700",
  color: "#ef4444",
},
exportBtn: {
  backgroundColor: "#3b82f6",
  padding: 10,
  borderRadius: 10,
  alignSelf: "flex-end",
  marginBottom: 10,
},

exportText: {
  color: "#fff",
  fontWeight: "600",
  fontSize: 12,
},

});
