import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateUserProfile } from "../api/userApi";

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);

  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [activity, setActivity] = useState("Moderate");
  const [climate, setClimate] = useState("Moderate");
  const [condition, setCondition] = useState("None");
  const [lifestyle, setLifestyle] = useState("Standard");
  const [unit, setUnit] = useState("ml");
  const navigation = useNavigation();

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const progress = (step / 4) * 100;

  const calculateGoal = () => {
  let base = weight ? weight * 35 : 2000;

  if (activity === "Active") base += 300;
  if (activity === "Very Active") base += 500;

  if (climate === "Hot") base += 300;
  if (climate === "Cold") base -= 100;

  return Math.round(base);
};

const handleComplete = async () => {
  const goalMl = calculateGoal();

  try {
    const currentUserId = await AsyncStorage.getItem("currentUserId");
    const onboardingKey = currentUserId
      ? `onboardingCompleted:${currentUserId}`
      : "onboardingCompleted";

    await updateUserProfile({
      weight: weight ? Number(weight) : undefined,
      height: height ? Number(height) : undefined,
      age: age ? Number(age) : undefined,
      gender,
      activityLevel: activity,
      climate,
      lifestyle,
      dailyGoal: String(goalMl),
      unit,
      pregnant: condition === "Pregnant",
      breastfeeding: condition === "Breastfeeding",
    }).catch(() => null);

    const existing = await AsyncStorage.getItem("hydrationData");
    const parsed = existing ? JSON.parse(existing) : {};
    await AsyncStorage.setItem(
      "hydrationData",
      JSON.stringify({
        ...parsed,
        goal: goalMl,
      })
    );

    await AsyncStorage.setItem(onboardingKey, "true");
  } catch (e) {
    console.log("Onboarding save error", e);
  }

  navigation.replace("Dashboard");
};

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrapper}>
        <View style={styles.card}>
          <Text style={styles.stepText}>
            Step {step} of 4
          </Text>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%` },
              ]}
            />
          </View>

          {step === 1 && (
            <View>
              <Text style={styles.title}>
                Basic Information
              </Text>

              <Text style={styles.subtitle}>
                Help us personalize your hydration goal
              </Text>

              <View style={styles.row}>
                <View style={{ width: "48%" }}>
                  <Text style={styles.label}>
                    Weight (kg)
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ width: "48%" }}>
                  <Text style={styles.label}>
                    Height (cm)
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />

              <Text style={styles.label}>
                Gender
              </Text>

              <View style={styles.genderRow}>
                {["Male", "Female", "Other"].map(
                  (item) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.genderBtn,
                        gender === item &&
                          styles.genderActive,
                      ]}
                      onPress={() =>
                        setGender(item)
                      }
                    >
                      <Text
                        style={[
                          styles.genderText,
                          gender === item &&
                            styles.genderTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          )}

{step === 2 && (
  <View>
    <Text style={styles.title}>
      Activity Level
    </Text>

    <Text style={styles.subtitle}>
      How active are you daily?
    </Text>

    {[
      {
        title: "Sedentary",
        desc: "Little to no exercise",
      },
      {
        title: "Light",
        desc: "Exercise 1-3 days/week",
      },
      {
        title: "Moderate",
        desc: "Exercise 3-5 days/week",
      },
      {
        title: "Active",
        desc: "Exercise 6-7 days/week",
      },
      {
        title: "Very Active",
        desc: "Intense exercise daily",
      },
    ].map((item) => (
      <TouchableOpacity
        key={item.title}
        style={[
          styles.activityCard,
          activity === item.title &&
            styles.activityActive,
        ]}
        onPress={() =>
          setActivity(item.title)
        }
      >
        <Text
          style={[
            styles.activityTitle,
            activity === item.title &&
              styles.activityTextActive,
          ]}
        >
          {item.title}
        </Text>

        <Text
          style={[
            styles.activityDesc,
            activity === item.title &&
              styles.activityTextActive,
          ]}
        >
          {item.desc}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
)}

{step === 3 && (
  <View>
    <Text style={styles.title}>
      Environment
    </Text>

    <Text style={styles.subtitle}>
      What’s your typical climate?
    </Text>

    <View style={styles.climateRow}>
      {[
        { label: "Cold", icon: "❄️" },
        { label: "Moderate", icon: "⛅" },
        { label: "Hot", icon: "☀️" },
      ].map((item) => (
        <TouchableOpacity
          key={item.label}
          style={[
            styles.climateCard,
            climate === item.label &&
              styles.climateActive,
          ]}
          onPress={() =>
            setClimate(item.label)
          }
        >
          <Text style={styles.climateIcon}>
            {item.icon}
          </Text>
          <Text
            style={[
              styles.climateText,
              climate === item.label &&
                styles.climateTextActive,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    <Text style={styles.label}>
      Special Conditions
    </Text>

    {[
      "None",
      "Pregnant",
      "Breastfeeding",
    ].map((item) => (
      <TouchableOpacity
        key={item}
        style={[
          styles.conditionBtn,
          condition === item &&
            styles.conditionActive,
        ]}
        onPress={() =>
          setCondition(item)
        }
      >
        <Text
          style={[
            styles.conditionText,
            condition === item &&
              styles.conditionTextActive,
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
)}

{step === 4 && (
  <View>
    <Text style={styles.title}>
      Lifestyle Profile
    </Text>

    <Text style={styles.subtitle}>
      Choose your lifestyle (optional)
    </Text>

    {[
      {
        title: "Standard",
        desc: "Regular lifestyle",
      },
      {
        title: "Athlete",
        desc: "High intensity training",
      },
      {
        title: "Office Worker",
        desc: "Mostly sedentary work",
      },
      {
        title: "Outdoor Worker",
        desc: "Active outdoor work",
      },
      {
        title: "Senior citizen",
        desc: "Adjusted for age 65+",
      },
    ].map((item) => (
      <TouchableOpacity
        key={item.title}
        style={[
          styles.activityCard,
          lifestyle === item.title &&
            styles.activityActive,
        ]}
        onPress={() =>
          setLifestyle(item.title)
        }
      >
        <Text
          style={[
            styles.activityTitle,
            lifestyle === item.title &&
              styles.activityTextActive,
          ]}
        >
          {item.title}
        </Text>

        <Text
          style={[
            styles.activityDesc,
            lifestyle === item.title &&
              styles.activityTextActive,
          ]}
        >
          {item.desc}
        </Text>
      </TouchableOpacity>
    ))}

    <Text style={styles.label}>
      Preferred Unit
    </Text>

    <View style={styles.unitRow}>
      {["ml", "oz"].map((item) => (
        <TouchableOpacity
          key={item}
          style={[
            styles.unitBtn,
            unit === item &&
              styles.unitActive,
          ]}
          onPress={() =>
            setUnit(item)
          }
        >
          <Text
            style={[
              styles.unitText,
              unit === item &&
                styles.unitTextActive,
            ]}
          >
            {item === "ml"
              ? "Milliliters (ml)"
              : "Ounces (oz)"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    <View style={styles.goalBox}>
      <Text style={styles.goalLabel}>
        Your daily goal will be:
      </Text>

      <Text style={styles.goalValue}>
        {calculateGoal()} {unit}
      </Text>
    </View>
  </View>
)}


          <View style={styles.footer}>
            {step > 1 && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={prevStep}
              >
                <Text>Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
                style={styles.nextBtn}
                onPress={
              step === 4 ? handleComplete : nextStep
             }
            >
             <Text style={styles.nextText}>
                 {step === 4 ? "Complete →" : "Next →"}
             </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#e6f0f4",
  },

  wrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  card: {
    width: "100%",
    backgroundColor: "#f3f4f6",
    padding: 20,
    borderRadius: 24,
  },

  stepText: {
    fontSize: 13,
    color: "#6b7280",
  },

  progressBar: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    marginVertical: 12,
    overflow: "hidden",
  },

  progressFill: {
    height: 6,
    backgroundColor: "#3b82f6",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 10,
  },

  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 20,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  label: {
    fontSize: 13,
    marginBottom: 6,
    color: "#374151",
  },

  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 15,
  },

  genderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  genderBtn: {
    width: "32%",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
  },

  genderActive: {
    backgroundColor: "#3b82f6",
  },

  genderText: {
    color: "#374151",
    fontWeight: "600",
  },

  genderTextActive: {
    color: "#fff",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },

  backBtn: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    backgroundColor: "#e5e7eb",
    borderRadius: 12,
    marginRight: 10,
  },

  nextBtn: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    backgroundColor: "#3b82f6",
    borderRadius: 12,
  },

  nextText: {
    color: "#fff",
    fontWeight: "600",
  },
  activityCard: {
  backgroundColor: "#e5e7eb",
  padding: 16,
  borderRadius: 14,
  marginBottom: 12,
},

activityActive: {
  backgroundColor: "#3b82f6",
},

activityTitle: {
  fontSize: 15,
  fontWeight: "600",
  color: "#111827",
},

activityDesc: {
  fontSize: 12,
  color: "#6b7280",
  marginTop: 2,
},

activityTextActive: {
  color: "#fff",
},
climateRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 20,
},

climateCard: {
  width: "30%",
  backgroundColor: "#e5e7eb",
  paddingVertical: 18,
  borderRadius: 14,
  alignItems: "center",
},

climateActive: {
  backgroundColor: "#3b82f6",
},

climateIcon: {
  fontSize: 22,
  marginBottom: 4,
},

climateText: {
  color: "#374151",
  fontWeight: "600",
},

climateTextActive: {
  color: "#fff",
},

conditionBtn: {
  backgroundColor: "#e5e7eb",
  padding: 14,
  borderRadius: 12,
  marginBottom: 12,
  alignItems: "center",
},

conditionActive: {
  backgroundColor: "#3b82f6",
},

conditionText: {
  fontWeight: "600",
  color: "#374151",
},

conditionTextActive: {
  color: "#fff",
},
unitRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 20,
},

unitBtn: {
  width: "48%",
  backgroundColor: "#e5e7eb",
  padding: 14,
  borderRadius: 12,
  alignItems: "center",
},

unitActive: {
  backgroundColor: "#3b82f6",
},

unitText: {
  fontWeight: "600",
  color: "#374151",
  fontSize: 12,
},

unitTextActive: {
  color: "#fff",
},

goalBox: {
  backgroundColor: "#dbeafe",
  padding: 18,
  borderRadius: 14,
  marginBottom: 10,
},

goalLabel: {
  fontSize: 13,
  color: "#374151",
},

goalValue: {
  fontSize: 22,
  fontWeight: "700",
  color: "#2563eb",
  marginTop: 4,
},
});
