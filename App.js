import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { api } from "./lib/api";

export default function App() {
  const [todo, setTodo] = useState("");
  const [todos, setTodos] = useState([]);
  const [isDirty, setIsDirty] = useState(false);

  // Load saved todos when app starts
  useEffect(() => {
    loadTodos();
  }, []);

  // Save todos whenever they change
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const loadTodos = async () => {
    try {
      // 1. Load from AsyncStorage
      const local = await AsyncStorage.getItem("todos");
      if (local) {
        setTodos(JSON.parse(local));
      }

      // 2. Check internet
      const state = await NetInfo.fetch();
      if (!state.isConnected && isDirty) return;

      // 3. Fetch from backend
      const res = await api.get("/todos");
      setTodos(res.data);

      // 4. Sync backend → local
      await AsyncStorage.setItem("todos", JSON.stringify(res.data));
    } catch (e) {
      console.log("Load failed", e);
    }
  };

  const saveTodos = async (data) => {
    try {
      await AsyncStorage.setItem("todos", JSON.stringify(data));
    } catch (e) {
      console.log("Error saving todos", e);
    }
  };

  const syncTodosToBackend = async (allTodos) => {
    const unsynced = allTodos.filter((t) => !t.synced);

    if (unsynced.length === 0) {
      setIsDirty(false);
      return;
    }

    try {
      for (const todo of unsynced) {
        await api.post("/todos", {
          id: todo.id,
          task: todo.task,
          completed: todo.completed,
        });

        // Mark as synced after successful POST
        setTodos((prev) =>
          prev.map((t) => (t.id === todo.id ? { ...t, synced: true } : t))
        );
      }

      setIsDirty(false);
      console.log("Todos synced successfully");
    } catch (err) {
      console.log("Partial sync failed", err);
      // DO NOT clear isDirty → retry later
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && isDirty) {
        syncTodosToBackend(todos);
        setIsDirty(false);
      }
    });

    return () => unsubscribe();
  }, [todos, isDirty]);

  const addTodo = () => {
    if (todo.trim() === "") return;
    setTodos([...todos, { task: todo, completed: false, issynced: false }]);
    setTodo("");
    setIsDirty(true);
  };

  const toggleTodo = (id) => {
    setTodos(
      todos.map((t) =>
        t.id === id ? { ...t, completed: !t.completed, issynced: false } : t
      )
    );
    setIsDirty(true);
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter((t) => t.id !== id));
    setIsDirty(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}> Todo App</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a task..."
          value={todo}
          onChangeText={setTodo}
        />
        <Pressable style={styles.addBtn} onPress={addTodo}>
          <Text style={styles.addText}>+</Text>
        </Pressable>
      </View>
      <ScrollView style={{ marginTop: 20 }}>
        {todos.map((item) => (
          <View key={item.id} style={styles.todoItem}>
            <Pressable
              style={[
                styles.checkbox,
                item.completed && styles.checkboxChecked,
              ]}
              onPress={() => toggleTodo(item.id)}
            >
              {item.completed && <Text style={styles.check}>✓</Text>}
            </Pressable>

            <Text
              style={[
                styles.todoText,
                item.completed && styles.completedText,
                { color: item.synced ? "green" : "orange" },
              ]}
            >
              {item.task}
              {!item.synced && " (Pending)"}
            </Text>

            <Pressable onPress={() => deleteTodo(item.id)}>
              <Text style={styles.delete}>✕</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 16,
  },
  addBtn: {
    backgroundColor: "#000",
    width: 45,
    height: 45,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: {
    fontSize: 28,
    color: "#fff",
    marginTop: -2,
  },
  todoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  checkboxChecked: {
    backgroundColor: "#000",
  },

  check: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  completedText: {
    textDecorationLine: "line-through",
    color: "#999",
  },

  todoText: {
    fontSize: 16,
  },
  delete: {
    fontSize: 22,
    color: "black",
    marginBottom: "5",
  },
});
