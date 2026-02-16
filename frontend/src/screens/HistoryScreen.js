import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  deleteWaterLog as deleteWaterLogApi,
  exportHistoryPdf as exportHistoryPdfApi,
  getHistoryInsights,
  updateWaterLog as updateWaterLogApi,
} from "../api/waterApi";

export default function HistoryScreen() {

  const navigation = useNavigation();

  const [logs, setLogs] = useState([]);
  const [goal, setGoal] = useState(2772);
  const [weeklyStats, setWeeklyStats] = useState({
    avgIntake: 0,
    completion: 0,
  });
  const [monthlyStats, setMonthlyStats] = useState({
    thisMonthTotal: 0,
    lastMonthTotal: 0,
    percentChange: 0,
  });
  const [streak, setStreak] = useState(0);
  const [badge, setBadge] = useState("Start Your Journey 💧");
  const [editVisible, setEditVisible] = useState(false);
  const [editAmount, setEditAmount] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [editingIndex, setEditingIndex] = useState(-1);
  const MAX_HISTORY_ITEMS = 600;

  const getBadge = useCallback((value) => {
    if (value >= 30) return "Hydration Champion 🏆";
    if (value >= 14) return "Hydration Pro 💪";
    if (value >= 7) return "Consistency Star ⭐";
    if (value >= 3) return "Getting There 👍";
    return "Start Your Journey 💧";
  }, []);

  const sanitizeLogs = useCallback((items) => {
    if (!Array.isArray(items)) return [];

    return items
      .filter((log) => log && typeof log === "object")
      .map((log) => {
        const parsedDate = log.date ? new Date(log.date) : null;
        const hasValidDate = parsedDate && !Number.isNaN(parsedDate.getTime());

        return {
          id: log.id || log._id,
          date: hasValidDate
            ? parsedDate.toDateString()
            : log.date || "Today",
          time:
            log.time ||
            (hasValidDate
              ? parsedDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "--:--"),
          amount: Number(log.amount || 0),
        };
      })
      .filter((log) => Number.isFinite(log.amount) && log.amount >= 0)
      .slice(-MAX_HISTORY_ITEMS);
  }, []);

  const calculateLocalInsights = useCallback(
    (items, dailyGoal) => {
      const totalsByDate = items.reduce((acc, log) => {
        const dateKey = log.date || new Date().toDateString();
        acc[dateKey] = (acc[dateKey] || 0) + Number(log.amount || 0);
        return acc;
      }, {});

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weeklyTotals = [];
      for (let i = 6; i >= 0; i -= 1) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        weeklyTotals.push(Number(totalsByDate[d.toDateString()] || 0));
      }
      const weeklyTotal = weeklyTotals.reduce((sum, value) => sum + value, 0);
      const avgIntake = Math.round(weeklyTotal / 7);
      const completion = Math.min(
        Math.round((avgIntake / Math.max(dailyGoal, 1)) * 100),
        100
      );

      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
      const lastMonth = lastMonthDate.getMonth();
      const lastMonthYear = lastMonthDate.getFullYear();

      let thisMonthTotal = 0;
      let lastMonthTotal = 0;
      items.forEach((log) => {
        const logDate = new Date(log.date);
        if (Number.isNaN(logDate.getTime())) return;

        const amount = Number(log.amount || 0);
        if (
          logDate.getMonth() === thisMonth &&
          logDate.getFullYear() === thisYear
        ) {
          thisMonthTotal += amount;
        } else if (
          logDate.getMonth() === lastMonth &&
          logDate.getFullYear() === lastMonthYear
        ) {
          lastMonthTotal += amount;
        }
      });
      const percentChange =
        lastMonthTotal > 0
          ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
          : 0;

      let streakCount = 0;
      const cursor = new Date(today);
      while (true) {
        const key = cursor.toDateString();
        if (Number(totalsByDate[key] || 0) >= dailyGoal) {
          streakCount += 1;
          cursor.setDate(cursor.getDate() - 1);
        } else {
          break;
        }
      }

      return {
        weekly: { avgIntake, completion },
        monthly: { thisMonthTotal, lastMonthTotal, percentChange },
        streak: streakCount,
      };
    },
    []
  );

  /* LOAD HISTORY */

  const loadHistory = useCallback(async () => {
    try {
      const res = await getHistoryInsights({
        limit: MAX_HISTORY_ITEMS,
      }).catch(() => null);

      if (res?.data?.success) {
        const serverLogs = sanitizeLogs(res.data.logs || []);
        setLogs(serverLogs);

        const goalPerDay = Number(res.data.goalPerDay || 2772) || 2772;
        setGoal(goalPerDay);

        const weekly = res.data?.insights?.weeklyPerformance;
        const monthly = res.data?.insights?.monthlyComparison;
        const streakInfo = res.data?.insights?.streak;

        setWeeklyStats({
          avgIntake: Number(weekly?.avgIntake || 0),
          completion: Number(weekly?.completionPercent || 0),
        });
        setMonthlyStats({
          thisMonthTotal: Number(monthly?.thisMonthTotal || 0),
          lastMonthTotal: Number(monthly?.lastMonthTotal || 0),
          percentChange: Number(monthly?.percentChange || 0),
        });
        const currentStreak = Number(streakInfo?.current || 0);
        setStreak(currentStreak);
        setBadge(streakInfo?.badge ? `${streakInfo.badge}` : getBadge(currentStreak));
        return;
      }

      const data = await AsyncStorage.getItem(
        "hydrationData"
      );

      if (!data) {
        setLogs([]);
        setWeeklyStats({ avgIntake: 0, completion: 0 });
        setMonthlyStats({
          thisMonthTotal: 0,
          lastMonthTotal: 0,
          percentChange: 0,
        });
        setStreak(0);
        setBadge(getBadge(0));
        return;
      }

      const parsed = JSON.parse(data);
      const parsedLogs = sanitizeLogs(parsed?.logs || []);
      const localGoal = Number(parsed?.goal || 2772) || 2772;
      const localInsights = calculateLocalInsights(parsedLogs, localGoal);

      setLogs(parsedLogs);
      setGoal(localGoal);
      setWeeklyStats(localInsights.weekly);
      setMonthlyStats(localInsights.monthly);
      setStreak(localInsights.streak);
      setBadge(getBadge(localInsights.streak));

    } catch (e) {
      console.log(e);
    }
  }, [sanitizeLogs, getBadge, calculateLocalInsights]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  /* DELETE LOG */

  const deleteLog = useCallback(async (index, item) => {
    try {
      if (item?.id) {
        await deleteWaterLogApi(item.id).catch(() => null);
        await loadHistory();
        return;
      }

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
      const localGoal = Number(parsed?.goal || goal) || goal;
      const localInsights = calculateLocalInsights(updatedLogs, localGoal);
      setGoal(localGoal);
      setWeeklyStats(localInsights.weekly);
      setMonthlyStats(localInsights.monthly);
      setStreak(localInsights.streak);
      setBadge(getBadge(localInsights.streak));

    } catch (e) {
      console.log(e);
    }
  }, [sanitizeLogs, loadHistory, goal, calculateLocalInsights, getBadge]);

  const openEditLog = useCallback((index, item) => {
    setEditingIndex(index);
    setEditingItem(item);
    setEditAmount(String(item?.amount || ""));
    setEditVisible(true);
  }, []);

  const saveEditedLog = useCallback(async () => {
    const parsedAmount = Number(editAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Error", "Enter a valid amount");
      return;
    }

    try {
      const hasServerId =
        typeof editingItem?.id === "string" &&
        /^[a-fA-F0-9]{24}$/.test(editingItem.id);
      if (hasServerId) {
        const updated = await updateWaterLogApi(editingItem.id, parsedAmount)
          .then(() => true)
          .catch(() => false);

        if (updated) {
          setEditVisible(false);
          setEditingItem(null);
          setEditingIndex(-1);
          setEditAmount("");
          await loadHistory();
          return;
        }
      }

      const data = await AsyncStorage.getItem("hydrationData");
      if (!data) return;

      const parsed = JSON.parse(data);
      const existingLogs = sanitizeLogs(parsed?.logs || []);
      if (editingIndex < 0 || editingIndex >= existingLogs.length) return;

      const updatedLogs = existingLogs.map((log, idx) =>
        idx === editingIndex ? { ...log, amount: parsedAmount } : log
      );

      const today = new Date().toDateString();
      const todaysLogs = updatedLogs.filter((log) => log.date === today);
      const newIntake = todaysLogs.reduce(
        (sum, log) => sum + Number(log.amount || 0),
        0
      );

      await AsyncStorage.setItem(
        "hydrationData",
        JSON.stringify({
          ...parsed,
          logs: updatedLogs,
          intake: newIntake,
        })
      );

      setLogs(updatedLogs);
      const localGoal = Number(parsed?.goal || goal) || goal;
      const localInsights = calculateLocalInsights(updatedLogs, localGoal);
      setGoal(localGoal);
      setWeeklyStats(localInsights.weekly);
      setMonthlyStats(localInsights.monthly);
      setStreak(localInsights.streak);
      setBadge(getBadge(localInsights.streak));
      setEditVisible(false);
      setEditingItem(null);
      setEditingIndex(-1);
      setEditAmount("");
    } catch (e) {
      console.log(e);
      Alert.alert(
        "Error",
        e?.response?.data?.message || "Unable to update log"
      );
    }
  }, [
    editAmount,
    editingIndex,
    editingItem,
    loadHistory,
    sanitizeLogs,
    goal,
    calculateLocalInsights,
    getBadge,
  ]);

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
  const sortedDates = useMemo(() => {
    const toTimestamp = (value) => {
      if (!value || value === "Today") return new Date().setHours(0, 0, 0, 0);
      const parsed = new Date(value).getTime();
      return Number.isNaN(parsed) ? 0 : parsed;
    };

    return Object.keys(groupedLogs).sort(
      (a, b) => toTimestamp(b) - toTimestamp(a)
    );
  }, [groupedLogs]);

const exportPDF = async () => {
  const totals = {};
  logs.forEach((log) => {
    if (!totals[log.date]) {
      totals[log.date] = 0;
    }
    totals[log.date] += Number(log.amount || 0);
  });

  const html = `
    <html>
    <body style="font-family: Arial; padding:20px;">
      <h1>Hydration Report 💧</h1>
      <h3>Total Logs: ${logs.length}</h3>
      <table border="1" cellpadding="8" cellspacing="0" width="100%">
        <tr>
          <th>Date</th>
          <th>Time</th>
          <th>Amount (ml)</th>
        </tr>
        ${logs
          .map(
            (log) => `
          <tr>
            <td>${log.date}</td>
            <td>${log.time}</td>
            <td>${log.amount}</td>
          </tr>
        `
          )
          .join("")}
      </table>
      <h2>Daily Totals</h2>
      <ul>
        ${Object.keys(totals)
          .map(
            (date) => `
          <li>${date} → ${totals[date]} ml</li>
        `
          )
          .join("")}
      </ul>
    </body>
    </html>
  `;

  try {
    if (!logs.length) {
      alert("No history to export");
      return;
    }
    const Sharing = await import("expo-sharing");
    let uri = null;

    // 1) Prefer backend-generated PDF (pdfkit)
    try {
      const [FileSystem, pdfRes] = await Promise.all([
        import("expo-file-system/legacy"),
        exportHistoryPdfApi(),
      ]);

      const pdfBase64 = pdfRes?.data?.base64;
      const fileName = pdfRes?.data?.fileName || "hydration-report.pdf";

      if (pdfBase64) {
        const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
        uri = `${dir}${fileName}`;
        await FileSystem.writeAsStringAsync(uri, pdfBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
    } catch (backendError) {
      console.log("Backend PDF export failed, falling back to client export", backendError);
    }

    // 2) Fallback: frontend HTML -> PDF export
    if (!uri) {
      const Print = await import("expo-print");
      const printed = await Print.printToFileAsync({ html });
      uri = printed?.uri || null;
    }

    if (!uri) {
      Alert.alert("Error", "PDF generation failed.");
      return;
    }

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
    Alert.alert(
      "Error",
      e?.response?.data?.message || e?.message || "Unable to export PDF."
    );
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
        {sortedDates.map((date) => (

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

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      onPress={() => openEditLog(globalIndex, item)}
                      style={styles.iconBtn}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color="#2563eb"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert(
                          "Delete Log",
                          "Are you sure you want to delete this entry?",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Delete",
                              style: "destructive",
                              onPress: () => deleteLog(globalIndex, item),
                            },
                          ]
                        )
                      }
                      style={styles.iconBtn}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#ef4444"
                      />
                    </TouchableOpacity>
                  </View>

                </View>

              );

            })}

          </View>

        ))}

      </ScrollView>

      <Modal
        visible={editVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Intake</Text>
            <TextInput
              style={styles.modalInput}
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="numeric"
              placeholder="Enter amount in ml"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={saveEditedLog}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBtn: {
    padding: 6,
    marginLeft: 6,
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

modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.35)",
  justifyContent: "center",
  paddingHorizontal: 24,
},

modalCard: {
  backgroundColor: "#f3f4f6",
  borderRadius: 16,
  padding: 18,
},

modalTitle: {
  fontSize: 16,
  fontWeight: "700",
  color: "#111827",
},

modalInput: {
  marginTop: 12,
  backgroundColor: "#fff",
  borderWidth: 1,
  borderColor: "#e5e7eb",
  borderRadius: 10,
  padding: 12,
},

modalActions: {
  marginTop: 14,
  flexDirection: "row",
  justifyContent: "flex-end",
},

modalCancelBtn: {
  paddingVertical: 10,
  paddingHorizontal: 14,
  backgroundColor: "#e5e7eb",
  borderRadius: 10,
  marginRight: 10,
},

modalCancelText: {
  color: "#374151",
  fontWeight: "600",
},

modalSaveBtn: {
  paddingVertical: 10,
  paddingHorizontal: 14,
  backgroundColor: "#3b82f6",
  borderRadius: 10,
},

modalSaveText: {
  color: "#fff",
  fontWeight: "600",
},

});
