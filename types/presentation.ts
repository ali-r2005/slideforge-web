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

export type PresentationPlaceholderType = "title" | "paragraph"

export type PresentationPlaceholder = {
  placeholder: string
  slide_number: number
  shape_index: number
  type: PresentationPlaceholderType
  max_chars: number
  value: string
}

export type PresentationSlideData = {
  slide_number: number
  placeholders: PresentationPlaceholder[]
}

export type GeneratePresentationResponse = {
  presentation_data: PresentationSlideData[]
  pdf_url: string
  pptx_url: string
}
