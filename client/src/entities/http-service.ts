import axios from "axios";

export const API_URL = `http://localhost:8340`;

const $api = axios.create({
  withCredentials: true,
  baseURL: API_URL,
});

// $api.interceptors.request.use((config) => {
//   config.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
//   return config;
// });

// $api.interceptors.response.use(
//   (config) => {
//     console.log("2");
//     // console.log(config, "config");
//     return config;
//   },
//   async (error) => {
//     console.log("2");
//     // console.log(error, "error");
//     const orifinalRequest = error.config;
//     if (
//       error.response.status == 401 &&
//       error.config &&
//       !error.config._isRetry
//     ) {
//       // console.log("Retrying request:", orifinalRequest);
//       orifinalRequest._isRetry = true;
//       try {
//         const response = await refreshService.refresh();
//         localStorage.setItem("token", response.accessToken);
//         return $api.request(orifinalRequest);
//       } catch (error) {
//         console.log("Refresh error:", error);
//       }
//     }
//     throw error;
//   }
// );
$api.interceptors.response.use(
  function (response) {
    // Если все хорошо, просто возвращаем ответ
    return response;
  },
  function (error) {
    console.log(error);
    // Если сервер вернул ошибку 401, делаем редирект на страницу входа
    // if (error.response && error.response.status === 401) {
    //   window.location.href = '/login'; // Или используйте свой механизм роутинга
    // }
    return Promise.reject(error);
  }
);

export default $api;
