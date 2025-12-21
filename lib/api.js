import axios from "axios";

export const api = axios.create({
  baseURL: "https://oflyn-todo-express.vercel.app",
});
