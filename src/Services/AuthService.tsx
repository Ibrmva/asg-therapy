import axios from "axios";
import { handleError } from "../Helpers/ErrorHandler";
import { UserProfileToken } from "../Models/User";
import { string } from "yup";

const api = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/";

export const loginAPI = async (username: string, password: string) => {
  try {
    const data = await axios.post<UserProfileToken>(api + "auth/login", {
      username: username,
      password: password,
    });
    return data;
  } catch (error) {
    handleError(error);
  }
};

export const registerAPI = async (
  firstname: string,
  lastname: string,
  email: string,
  password: string,
  confirmPassword: string
) => {
  try {
    const response = await axios.post(api + "auth/signup", {
      firstname,
      lastname,
      email,
      password,
      confirmPassword,
    });
    return response;
  } catch (error) {
    handleError(error);
    throw error;  // re-throw to handle in caller
  }
};

