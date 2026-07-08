import React from "react";
import api from "./api";

export async function login(email, password) {
  const set = await api.post("users/login", { email, password });
  localStorage.setItem("token", set.data.access_token);
  return set.data;
}
export async function register(name, email, password) {
  const set = await api.post("users/register", { name, email, password });
  return set;
}
export function logout() {
  localStorage.removeItem("token");
}
export function gettoken() {
  const set = localStorage.getItem("token");
  return set;
}
