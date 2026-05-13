import { apiClient } from "@/services/api"
import type {
  GeneratePresentationPayload,
  GeneratePresentationResponse,
  PresentationTemplate,
  TemplatesResponse,
  UpdatePresentationPayload,
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
): Promise<GeneratePresentationResponse> {
  console.log("Generating presentation with payload:", payload)
  const response = await apiClient.post<GeneratePresentationResponse>(
    "/generate-ppt",
    payload
  )
  console.log("Generate presentation response:", response)
  return response.data
}

export async function updatePresentation(
  payload: UpdatePresentationPayload
): Promise<GeneratePresentationResponse> {
  console.log("Updating presentation with payload:", payload)
  const response = await apiClient.post<GeneratePresentationResponse>(
    "/update-ppt",
    payload
  )
  console.log("Update presentation response:", response)
  return response.data
}

