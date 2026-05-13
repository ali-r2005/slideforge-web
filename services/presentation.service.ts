import { apiClient } from "@/services/api"
import type {
  GeneratePresentationPayload,
  PresentationTemplate,
  TemplatesResponse,
} from "@/types/presentation"

export async function getTemplates(): Promise<PresentationTemplate[]> {
  const response = await apiClient.get<TemplatesResponse>("/templates")
  console.log("Templates response:", response.data)

  if (!response.data.success) {
    throw new Error("Templates request failed.")
  }

  return response.data.data
}

export async function generatePresentation(
  payload: GeneratePresentationPayload
): Promise<Blob> {
  console.log("Generating presentation with payload:", payload)
  const response = await apiClient.post<Blob>("/generate-ppt", payload, {
    responseType: "blob",
  })
  console.log("Generate presentation response:", response)
  return response.data
}
