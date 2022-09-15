import axios from "axios";
import dayjs from "dayjs";
import jwt_decode, { JwtPayload } from "jwt-decode";
import { useAuthContext } from "../providers/AuthProvider";
import { API_ENDPOINT } from "../utils/api";


export const useApi = () => {
  const { authTokens, setUser, setAuthTokens } = useAuthContext();

  const axiosInstance = axios.create({
    baseURL: API_ENDPOINT,
    headers: { Authorization: `Bearer ${authTokens?.access}` }
  });

  axiosInstance.interceptors.request.use(async req => {
    const user = jwt_decode<JwtPayload>(authTokens.access);
    const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 1;

    if (!isExpired) return req;

    const response = await axios.post(`${API_ENDPOINT}/token/refresh/`, {
      refresh: authTokens.refresh
    });

    localStorage.setItem("authTokens", JSON.stringify(response.data));

    setAuthTokens(response.data);
    setUser(jwt_decode(response.data.access));

    req.headers.Authorization = `Bearer ${response.data.access}`;
    return req;
  });

  return axiosInstance;
};
