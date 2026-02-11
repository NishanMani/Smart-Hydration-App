import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import DashboardScreen from "../screens/DashboardScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import HistoryScreen from "../screens/HistoryScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { Ionicons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarStyle: {
          height: 65,
          paddingBottom: 8,
        },

        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#9ca3af",

        tabBarIcon: ({ color, size, focused }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = focused
              ? "home"
              : "home-outline";
          } else if (route.name === "Analytics") {
            iconName = focused
              ? "bar-chart"
              : "bar-chart-outline";
          } else if (route.name === "History") {
            iconName = focused
              ? "time"
              : "time-outline";
          } else if (route.name === "Settings") {
            iconName = focused
              ? "settings"
              : "settings-outline";
          }

          return (
            <Ionicons
              name={iconName}
              size={22}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
      />

      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
      />

      <Tab.Screen
        name="History"
        component={HistoryScreen}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
      />
    </Tab.Navigator>
  );
}