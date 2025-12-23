import { useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { syncTodos } from "../sync/syncTodos";

export function useNetworkSync(enabled) {
  useEffect(() => {
    if (!enabled) return;
    // Initial sync
    syncTodos();

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        syncTodos();
      }
    });

    return () => unsubscribe();
  }, [enabled]);
}
