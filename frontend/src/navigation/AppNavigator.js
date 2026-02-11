import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SplashScreen from "../screens/SplashScreen";
import AuthScreen from "../screens/AuthScreen";
import DashboardScreen from "../screens/DashboardScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import BottomTabs from "./BottomTabs";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen
         name="Onboarding"
        component={OnboardingScreen}
        />
        <Stack.Screen
          name="Dashboard"
          component={BottomTabs}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}