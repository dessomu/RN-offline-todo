import "react-native-get-random-values";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { initDB } from "./src/db/database";
import { useNetworkSync } from "./src/hooks/useNetworkSync";
import TodoScreen from "./src/screens/TodoScreen";

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function prepareDB() {
      await initDB();
      setDbReady(true);
    }

    prepareDB();
  }, []);

  useNetworkSync(dbReady);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <TodoScreen />;
}
