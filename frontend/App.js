import { useEffect } from "react";
import AppNavigator from "./src/navigation/AppNavigator";
import {
  initializeNotifications,
  getPushTokenForBackend,
} from "./src/services/notificationService";

export default function App() {
  useEffect(() => {
    const setupNotifications = async () => {
      await initializeNotifications();

      const token = await getPushTokenForBackend();
      console.log("PUSH TOKEN:", token);
    };

    setupNotifications();
  }, []);

  return <AppNavigator />;
}