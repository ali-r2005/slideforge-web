import axios, { AxiosError } from "axios"

export const apiClient = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const message =
      error.response?.data?.message ??
      error.message ??
      "Something went wrong while contacting the server."

    return Promise.reject(new Error(message))
  }
)
