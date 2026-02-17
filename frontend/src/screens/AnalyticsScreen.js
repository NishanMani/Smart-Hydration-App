import { View, Text, StyleSheet, ScrollView,TouchableOpacity, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useCallback } from "react";
import { BarChart, LineChart } from "react-native-chart-kit";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  getMonthlyAnalytics,
  getPerformance,
  getStreakAnalytics,
  getWeeklyAnalytics,
} from "../api/analyticsApi"; 
import { getUserProfile } from "../api/userApi";
import { normalizeUnit, toDisplayAmount } from "../utils/unit";

const screenWidth = Dimensions.get("window").width;

const getRecentWeekdayLabels = (count) => {
  const labels = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    labels.push(
      date.toLocaleDateString("en-US", { weekday: "short" })
    );
  }

  return labels;
};

export default function AnalyticsScreen() {
const navigation = useNavigation();

const [activeTab, setActiveTab] = useState("weekly");

const [weeklyIntake, setWeeklyIntake] = useState([0,0,0,0,0,0,0]);
const [monthlyIntake, setMonthlyIntake] = useState([0,0,0,0,0,0,0]);
const [streak, setStreak] = useState(0);
const [goalCompletion, setGoalCompletion] = useState(0);
const [avgIntake, setAvgIntake] = useState(0);
const [daysMetGoal, setDaysMetGoal] = useState(0);
const [goalPerDay, setGoalPerDay] = useState(2000);
const [unit, setUnit] = useState("ml");

useEffect(() => {
loadAnalytics();
}, []);

const loadAnalytics = async () => {

  try {
    const [
      weeklyRes,
      monthlyRes,
      streakRes,
      performanceRes,
      profileRes,
    ] = await Promise.all([
      getWeeklyAnalytics(),
      getMonthlyAnalytics(),
      getStreakAnalytics(),
      getPerformance(),
      getUserProfile().catch(() => null),
    ]);

    const weeklyTotals = Array.isArray(weeklyRes?.data?.dailyTotals)
      ? weeklyRes.data.dailyTotals.map((n) => Number(n || 0))
      : [0, 0, 0, 0, 0, 0, 0];

    setWeeklyIntake(weeklyTotals);

    const monthlyTotals = Array.isArray(monthlyRes?.data?.dailyTotals)
      ? monthlyRes.data.dailyTotals.map((n) => Number(n || 0))
      : [];
    const monthlySample = monthlyTotals.length
      ? [
          monthlyTotals[0] || 0,
          monthlyTotals[5] || 0,
          monthlyTotals[10] || 0,
          monthlyTotals[15] || 0,
          monthlyTotals[20] || 0,
          monthlyTotals[25] || 0,
          monthlyTotals[29] || 0,
        ]
      : [0, 0, 0, 0, 0, 0, 0];
    setMonthlyIntake(monthlySample);

    const resolvedGoal =
      Number(performanceRes?.data?.goalPerDay || 0) ||
      Number(weeklyRes?.data?.goalPerDay || 0) ||
      2000;

    const total = weeklyTotals.reduce((sum, value) => sum + value, 0);
    const average = Math.round(total / 7);
    const metGoalDays = weeklyTotals.filter((value) => value >= resolvedGoal).length;

    setAvgIntake(average);
    setGoalPerDay(resolvedGoal);
    setGoalCompletion(Math.round(Number(performanceRes?.data?.performancePercent || 0)));
    setDaysMetGoal(metGoalDays);
    setStreak(Number(streakRes?.data?.streak || 0));
    setUnit(normalizeUnit(profileRes?.data?.unit));

  } catch (e) {
    console.log(e);
    setWeeklyIntake([0, 0, 0, 0, 0, 0, 0]);
    setMonthlyIntake([0, 0, 0, 0, 0, 0, 0]);
    setAvgIntake(0);
    setGoalPerDay(2000);
    setGoalCompletion(0);
    setDaysMetGoal(0);
    setStreak(0);
    setUnit("ml");
  }
};

useFocusEffect(
  useCallback(() => {
    loadAnalytics();
  }, [])
);

const unitLabel = normalizeUnit(unit);
const displayAvgIntake = toDisplayAmount(avgIntake, unitLabel);
const displayGoalPerDay = toDisplayAmount(goalPerDay, unitLabel);
const weeklyDisplay = weeklyIntake.map((value) => toDisplayAmount(value, unitLabel));
const monthlyDisplay = monthlyIntake.map((value) => toDisplayAmount(value, unitLabel));

const weeklyData = {
labels: getRecentWeekdayLabels(7),
datasets: [{ data: weeklyDisplay }],
};

const monthlyData = {
labels: ["-29d","-24d","-19d","-14d","-9d","-4d","Today"],
datasets: [{ data: monthlyDisplay }],
};

const handleBack = () => {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }

  navigation.navigate("Home");
};



return (
   <SafeAreaView style={styles.safe}>
     <ScrollView showsVerticalScrollIndicator={false}>


    {/* HEADER */}
    <View style={styles.header}>
      <TouchableOpacity onPress={handleBack}>
        <Ionicons name="arrow-back" size={22} color="#111" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>
        Analytics
      </Text>
    </View>

    {/* TOGGLE */}
    <View style={styles.toggleRow}>

      <TouchableOpacity
        style={[
          styles.toggleBtn,
          activeTab === "weekly" && styles.activeToggle
        ]}
        onPress={() => setActiveTab("weekly")}
      >
        <Text style={[
          styles.toggleText,
          activeTab === "weekly" && styles.activeText
        ]}>
          Weekly
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.toggleBtn,
          activeTab === "monthly" && styles.activeToggle
        ]}
        onPress={() => setActiveTab("monthly")}
      >
        <Text style={[
          styles.toggleText,
          activeTab === "monthly" && styles.activeText
        ]}>
          Monthly
        </Text>
      </TouchableOpacity>

    </View>

    {/* STATS GRID */}
    <View style={styles.grid}>

      <View style={styles.card}>
        <Text style={styles.cardValue}>
          {displayAvgIntake}
        </Text>
        <Text style={styles.cardLabel}>
          Avg Daily Intake ({unitLabel})
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardValue}>
          {goalCompletion}%
        </Text>
        <Text style={styles.cardLabel}>
          Goal Completion
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardValue}>
          {streak}
        </Text>
        <Text style={styles.cardLabel}>
          Day Streak
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardValue}>
          {daysMetGoal}
        </Text>
        <Text style={styles.cardLabel}>
          Days Met Goal ({displayGoalPerDay} {unitLabel})
        </Text>
      </View>

    </View>

    {/* WEEKLY BAR / MONTHLY CHART */}
    <View style={styles.chartCard}>

      <Text style={styles.chartTitle}>
        {activeTab === "weekly"
          ? "Weekly Graph"
          : "Monthly Chart"}
      </Text>

      {activeTab === "weekly" ? (
        <BarChart
          data={weeklyData}
          width={screenWidth - 80}
          height={180}
          yAxisSuffix={unitLabel}
          chartConfig={{
            backgroundGradientFrom: "#f3f4f6",
            backgroundGradientTo: "#f3f4f6",
            decimalPlaces: 0,
            color: (opacity = 1) =>
              `rgba(59,130,246, ${opacity})`,
            labelColor: () => "#6b7280",
          }}
          style={{
            marginTop: 10,
            borderRadius: 16,
          }}
        />
      ) : (
        <LineChart
          data={monthlyData}
          width={screenWidth - 80}
          height={180}
          yAxisSuffix={unitLabel}
          chartConfig={{
            backgroundGradientFrom: "#f3f4f6",
            backgroundGradientTo: "#f3f4f6",
            decimalPlaces: 0,
            color: (opacity = 1) =>
              `rgba(59,130,246, ${opacity})`,
            labelColor: () => "#6b7280",
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: "#3b82f6",
            },
          }}
          bezier
          style={{
            marginTop: 10,
            borderRadius: 16,
          }}
        />
      )}

    </View>

    {/* INSIGHTS */}
    <View style={styles.insightBox}>
      <Text style={styles.insightTitle}>
        Insights
      </Text>

      <Text style={styles.insightText}>
        📉 You can do better! Set reminders to stay on track.
      </Text>

      <Text style={styles.insightText}>
        💧 Aim to drink more water daily.
      </Text>
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

header: {
flexDirection: "row",
alignItems: "center",
padding: 20,
},

headerTitle: {
fontSize: 18,
fontWeight: "700",
marginLeft: 10,
},

toggleRow: {
flexDirection: "row",
marginHorizontal: 20,
backgroundColor: "#e5e7eb",
borderRadius: 12,
padding: 4,
},

toggleBtn: {
flex: 1,
padding: 10,
borderRadius: 10,
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

grid: {
flexDirection: "row",
flexWrap: "wrap",
justifyContent: "space-between",
margin: 20,
},

card: {
width: "48%",
backgroundColor: "#f3f4f6",
padding: 18,
borderRadius: 16,
marginBottom: 14,
},

cardValue: {
fontSize: 18,
fontWeight: "700",
},

cardLabel: {
fontSize: 12,
color: "#6b7280",
marginTop: 4,
},

chartCard: {
backgroundColor: "#f3f4f6",
marginHorizontal: 20,
marginTop: 10,
padding: 20,
borderRadius: 18,
height: 220,
},

chartTitle: {
fontWeight: "700",
},

insightBox: {
margin: 20,
marginTop: 50,
padding: 20,
borderRadius: 18,
backgroundColor: "#3b82f6",
},

insightTitle: {
color: "#fff",
fontWeight: "700",
marginBottom: 10,
},

insightText: {
color: "#e0f2fe",
fontSize: 13,
marginBottom: 6,
},
});
