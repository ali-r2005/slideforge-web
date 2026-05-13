export type PresentationTemplate = {
  name: string
  filename: string
}

export type TemplatesResponse = {
  success: boolean
  data: PresentationTemplate[]
}

export type GeneratePresentationPayload = {
  template_name: string
  prompt: string
}
