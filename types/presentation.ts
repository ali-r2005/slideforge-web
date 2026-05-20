export type PresentationTemplate = {
  name: string
  filename: string
  thumbnail_url?: string
}


export type TemplatesResponse = {
  success: boolean
  data: PresentationTemplate[]
}

export type GeneratePresentationPayload = {
  template_name: string
  prompt?: string
  form_data?: Record<string, string | number | boolean>
}

export type PresentationPlaceholderType = "title" | "paragraph" | "table" | "bullet_list" | "subtitle" | "text" | "image_logo" | "image_topic"

export type PresentationPlaceholder = {
  placeholder: string
  slide_number: number
  shape_index: number
  type: PresentationPlaceholderType
  max_chars: number
  value: string | Record<string, string>[] | string[]
  paragraphs?: number
  column_headers?: string[]
  columns?: number
}

export type PresentationSlideData = {
  slide_number: number
  placeholders: PresentationPlaceholder[]
}

export type GeneratePresentationResponse = {
  template_name: string
  presentation_data: PresentationSlideData[]
  pdf_url: string
  pptx_url: string
}


export type UpdatePresentationPayload = {
  template_name: string
  file_id: string
  replacements: Record<string, string>
}

