import { useEffect } from "react";
import AppNavigator from "./src/navigation/AppNavigator";
import {
  initializeNotifications,
} from "./src/services/notificationService";

export default function App() {
  useEffect(() => {
    const setupNotifications = async () => {
      await initializeNotifications();
    };

    setupNotifications();
  }, []);

  return <AppNavigator />;
}
