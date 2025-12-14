import api from "./api";

export const login = async (data) => {
  const response = await api.post("/auth/login", data);
  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data.name));
    localStorage.setItem("role", JSON.stringify(response.data.role));
    localStorage.setItem("id", JSON.stringify(response.data.id));


    console.log(response.data.role);
  }
  return response.data;
};

export const logout = async () => {
  await api.post("/auth/logout");
  localStorage.removeItem("token");
};
