import axios from "axios";

// Create a custom axios instance
const api = axios.create({
  // Replace with your actual backend port if it's not 5000
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Note: When you add user login later, we will add an "interceptor"
// right here to automatically attach the Auth token to every request!

export default api;
