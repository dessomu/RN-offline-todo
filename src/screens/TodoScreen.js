import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";

import { getTodos, addTodo, toggleTodo, deleteTodo } from "../db/todoRepo";
import { mapTodo } from "../utils/mapTodo";

export default function TodoScreen() {
  const [todo, setTodo] = useState("");
  const [todos, setTodos] = useState([]);

  // Load todos from SQLite on mount
  useEffect(() => {
    refreshTodos();
  }, []);

  const refreshTodos = () => {
    getTodos((rows) => {
      setTodos(rows.map(mapTodo));
    });
  };

  const handleAddTodo = async () => {
    if (!todo.trim()) return;
    await addTodo(todo);
    setTodo("");
    refreshTodos();
  };

  const handleToggleTodo = async (id) => {
    await toggleTodo(id);
    refreshTodos();
  };

  const handleDeleteTodo = async (id) => {
    await deleteTodo(id);
    refreshTodos();
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
        <Pressable style={styles.addBtn} onPress={handleAddTodo}>
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
              onPress={() => handleToggleTodo(item.id)}
            >
              {item.completed && <Text style={styles.check}>✓</Text>}
            </Pressable>

            <Text
              style={[styles.todoText, item.completed && styles.completedText]}
            >
              {item.task}
            </Text>

            <Pressable onPress={() => handleDeleteTodo(item.id)}>
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
