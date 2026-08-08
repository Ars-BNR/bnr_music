import $api from "./http-service";

const loginEndpoint = "/login";
const registerEndpoint = "/registration";
const exitEndpoint = "/logout";
const refreshEndpoint = "/refresh";
const usersEndpoint = "/users";

const userService = {
  login: async (email: string, password: string) => {
    const { data } = await $api.post(loginEndpoint, { email, password });
    return data;
  },
  registration: async (email: string, password: string) => {
    const { data } = await $api.post(registerEndpoint, {
      email,
      password,
    });
    return data;
  },
  resendActivation: async (email: string) => {
    const { data } = await $api.post('/activation/resend', { email });
    return data as { success: true };
  },
  logout: async () => {
    const { data } = await $api.post(exitEndpoint);
    return data;
  },
  refresh: async () => {
    const { data } = await $api.post(refreshEndpoint);
    return data;
  },
  getUsers: async () => {
    const { data } = await $api.get(usersEndpoint);
    return data;
  },
};

export default userService;
