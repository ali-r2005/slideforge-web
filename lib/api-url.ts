const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"

export function createApiFileUrl(fileUrl: string) {
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl
  }

  const normalizedBaseUrl = apiBaseUrl.replace(/\/$/, "")
  const normalizedFileUrl = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`

  return `${normalizedBaseUrl}${normalizedFileUrl}`
}
