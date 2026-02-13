import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect  } from "react";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getReminder, setReminder } from "../api/reminderApi";


export default function ReminderScreen() {

  const navigation = useNavigation();

  const [enabled, setEnabled] = useState(true);
  const [interval, setReminderInterval] = useState("30 minutes");

  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  useEffect(() => { loadSettings();
  }, []);

  const intervals = [
    "30 minutes",
    "1 hour",
    "1.5 hours",
    "2 hours",
    "3 hours"
  ];
  const intervalMap = {
  "30 minutes": 30,
  "1 hour": 60,
  "1.5 hours": 90,
  "2 hours": 120,
  "3 hours": 180
};
  const intervalLabelFromMinutes = {
    30: "30 minutes",
    60: "1 hour",
    90: "1.5 hours",
    120: "2 hours",
    180: "3 hours",
  };

  const onChangeStart = (event, selectedDate) => {
    setShowStart(false);
    if (selectedDate) setStartTime(selectedDate);
  };

  const onChangeEnd = (event, selectedDate) => {
    setShowEnd(false);
    if (selectedDate) setEndTime(selectedDate);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const toHHmm = (date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };
  const fromHHmm = (value) => {
    const [h, m] = String(value || "08:00").split(":").map(Number);
    const date = new Date();
    date.setHours(Number.isFinite(h) ? h : 8, Number.isFinite(m) ? m : 0, 0, 0);
    return date;
  };
  const generateReminders = () => {

  const reminders = [];

  const start = new Date(startTime);
  const end = new Date(endTime);

  const intervalMinutes = intervalMap[interval];
  if (!intervalMinutes || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return reminders;
  }

  // Keep schedule generation bounded to avoid UI freeze/ANR.
  const normalizedStart = new Date(start);
  const normalizedEnd = new Date(end);
  normalizedStart.setSeconds(0, 0);
  normalizedEnd.setSeconds(0, 0);
  if (normalizedEnd < normalizedStart) {
    normalizedEnd.setDate(normalizedEnd.getDate() + 1);
  }

  let current = new Date(normalizedStart);
  let safetyCounter = 0;
  const maxReminders = 96; // Up to 48 hours at 30-minute intervals.

  while (current <= normalizedEnd && safetyCounter < maxReminders) {

    reminders.push(formatTime(current));

    current = new Date(
      current.getTime() +
      intervalMinutes * 60000
    );
    safetyCounter += 1;
  }

  return reminders;
};

  const saveSettings = async () => {
  try {

    const reminderData = {
      enabled,
      interval,
      startTime,
      endTime,
    };

    await AsyncStorage.setItem("reminderSettings", JSON.stringify(reminderData));

    await setReminder({
      interval: intervalMap[interval],
      startTime: toHHmm(startTime),
      endTime: toHHmm(endTime),
      activityLevel: "Moderate",
    }).catch(() => null);

    Alert.alert("Saved", "Reminder settings saved");

  } catch (error) {
    console.log(error);
  }
};

const loadSettings = async () => {
  try {
    const res = await getReminder().catch(() => null);
    const serverReminder = res?.data;

    if (serverReminder) {
      setEnabled(Boolean(serverReminder.isActive) && !Boolean(serverReminder.sleepMode));
      setReminderInterval(
        intervalLabelFromMinutes[Number(serverReminder.interval)] || "30 minutes"
      );
      setStartTime(fromHHmm(serverReminder.startTime));
      setEndTime(fromHHmm(serverReminder.endTime));
      return;
    }

    const data = await AsyncStorage.getItem("reminderSettings");

    if (!data) return;

    const parsed = JSON.parse(data);

    setEnabled(parsed.enabled);
    setReminderInterval(parsed.interval || "30 minutes");
    setStartTime(new Date(parsed.startTime));
    setEndTime(new Date(parsed.endTime));

  } catch (error) {
    console.log(error);
  }
};

const reminderTimes = generateReminders();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Reminders
          </Text>

        </View>

        {/* ENABLE */}
        <View style={styles.cardRow}>
          <View style={styles.rowLeft}>
            <View style={styles.iconCircle}>
              <Ionicons name="notifications-outline" size={18} color="#3b82f6"/>
            </View>

            <View>
              <Text style={styles.cardTitle}>
                Enable Reminders
              </Text>
              <Text style={styles.cardSub}>
                Get notified to drink water
              </Text>
            </View>
          </View>

          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false:"#d1d5db", true:"#3b82f6" }}
          />
        </View>

        {/* INTERVAL */}
        <View style={styles.sectionCard}>

          <View style={styles.rowLeft}>
            <View style={[styles.iconCircle,{backgroundColor:"#ede9fe"}]}>
              <Ionicons name="time-outline" size={18} color="#7c3aed"/>
            </View>

            <View>
              <Text style={styles.cardTitle}>
                Reminder Interval
              </Text>
              <Text style={styles.cardSub}>
                How often to remind you
              </Text>
            </View>
          </View>

          {intervals.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.intervalBtn,
                interval === item && styles.intervalActive
              ]}
              onPress={() => setReminderInterval(item)}
            >
              <Text
                style={[
                  styles.intervalText,
                  interval === item && {color:"#fff"}
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}

        </View>

        {/* ACTIVE HOURS (FIXED) */}
        <View style={styles.sectionCard}>

          <Text style={styles.sectionTitle}>
            Active Hours
          </Text>

          {/* START */}
          <Text style={styles.inputLabel}>
            🌤 Start Time
          </Text>

          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowStart(true)}
          >
            <Text>
              {formatTime(startTime)}
            </Text>
          </TouchableOpacity>

          {/* END */}
          <Text style={styles.inputLabel}>
            🌙 End Time
          </Text>

          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowEnd(true)}
          >
            <Text>
              {formatTime(endTime)}
            </Text>
          </TouchableOpacity>

        </View>

        {/* PREVIEW */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>
            Preview
          </Text>

          <Text style={styles.previewText}>
            You’ll receive reminders every{" "}
            <Text style={{fontWeight:"700"}}>
              {interval}
            </Text>
          </Text>

          <Text style={styles.previewSub}>
            Between {formatTime(startTime)} and {formatTime(endTime)}
          </Text>
          <View style={styles.scheduleBox}>

  <Text style={styles.scheduleTitle}>
    Reminder Schedule
  </Text>

  {reminderTimes.map((time, index) => (
    <Text
      key={index}
      style={styles.scheduleItem}
    >
      🔔 {time}
    </Text>
  ))}

</View>
        </View>

        {/* SAVE */}
       <TouchableOpacity
  style={styles.saveBtn}
  onPress={saveSettings}
>
          <Text style={styles.saveText}>
            Save Settings
          </Text>
        </TouchableOpacity>

        {/* PICKERS */}
        {showStart && (
          <DateTimePicker
            value={startTime}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={onChangeStart}
          />
        )}

        {showEnd && (
          <DateTimePicker
            value={endTime}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={onChangeEnd}
          />
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

safe:{ flex:1, backgroundColor:"#e6f0f4" },

header:{
flexDirection:"row",
alignItems:"center",
padding:20
},

headerTitle:{
fontSize:18,
fontWeight:"700",
marginLeft:10
},

cardRow:{
backgroundColor:"#f3f4f6",
margin:20,
padding:16,
borderRadius:16,
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center"
},

rowLeft:{
flexDirection:"row",
alignItems:"center"
},

iconCircle:{
width:36,
height:36,
borderRadius:18,
backgroundColor:"#dbeafe",
justifyContent:"center",
alignItems:"center",
marginRight:12
},

cardTitle:{ fontWeight:"700" },
cardSub:{ fontSize:12, color:"#6b7280" },

sectionCard:{
backgroundColor:"#f3f4f6",
marginHorizontal:20,
marginBottom:20,
padding:16,
borderRadius:16
},

intervalBtn:{
padding:14,
borderRadius:12,
backgroundColor:"#e5e7eb",
marginTop:10,
alignItems:"center"
},

intervalActive:{
backgroundColor:"#8b5cf6"
},

intervalText:{
fontWeight:"600"
},

sectionTitle:{
fontWeight:"700",
marginBottom:10
},

inputLabel:{
marginTop:10,
fontSize:13,
color:"#374151"
},

input:{
backgroundColor:"#fff",
padding:14,
borderRadius:10,
marginTop:6
},

previewCard:{
margin:20,
padding:18,
borderRadius:18,
backgroundColor:"#0ea5e9"
},

previewTitle:{
color:"#fff",
fontWeight:"700",
marginBottom:6
},

previewText:{
color:"#fff",
fontSize:14
},

previewSub:{
color:"#e0f2fe",
marginTop:4
},

saveBtn:{
backgroundColor:"#3b82f6",
margin:20,
padding:16,
borderRadius:16,
alignItems:"center"
},

saveText:{
color:"#fff",
fontWeight:"700"
},

scheduleBox:{
  marginTop:12,
  backgroundColor:"#0284c7",
  padding:12,
  borderRadius:12
},

scheduleTitle:{
  color:"#fff",
  fontWeight:"700",
  marginBottom:6
},

scheduleItem:{
  color:"#e0f2fe",
  fontSize:13,
  marginBottom:2
}

});
