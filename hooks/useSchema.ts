import { useEffect, useState } from "react"
import { apiClient } from "@/services/api"

export interface SchemaField {
  name: string
  type: "text" | "textarea" | "number" | "email" | "date" | "enum" | "boolean"
  required: boolean
  label?: string
  description?: string
  values?: string[]
  min?: number
  max?: number
  min_length?: number
  max_length?: number
}

export interface SchemaGroup {
  name: string
  description?: string
  fields: string[]
}

export interface Schema {
  template_name: string
  description?: string
  fields: SchemaField[]
  groups?: SchemaGroup[]
}

export function useSchema(templateName: string) {
  const [schema, setSchema] = useState<Schema | null>(null)
  const [hasSchema, setHasSchema] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!templateName) {
      setSchema(null)
      setHasSchema(false)
      return
    }

    async function loadSchema() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await apiClient.get(`/schema/${templateName}`)

        if (response.data.has_schema && response.data.data) {
          setSchema(response.data.data)
          setHasSchema(true)
        } else {
          setSchema(null)
          setHasSchema(false)
        }
      } catch (err) {
        // Graceful fallback - schema might not exist
        setSchema(null)
        setHasSchema(false)
        setError(null) // Don't show error since schema is optional
      } finally {
        setIsLoading(false)
      }
    }

    loadSchema()
  }, [templateName])

  return {
    schema,
    hasSchema,
    isLoading,
    error,
    getField: (fieldName: string) =>
      schema?.fields.find((f) => f.name === fieldName),
  }
}
