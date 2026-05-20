"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Schema, SchemaField } from "@/hooks/useSchema"

interface SchemaFormProps {
  schema: Schema
  onDataChange: (formData: Record<string, string | number | boolean>) => void
}

export function SchemaForm({ schema, onDataChange }: SchemaFormProps) {
  const [formData, setFormData] = useState<Record<string, string | number | boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validate form data
  const validateField = (field: SchemaField, value: any) => {
    const errors: string[] = []

    // Check required
    if (field.required && (value === undefined || value === null || value === "")) {
      errors.push(`${field.label || field.name} is required`)
      return errors[0] || null
    }

    // Skip other validations if field is optional and empty
    if (!field.required && (value === undefined || value === null || value === "")) {
      return null
    }

    // Type validation
    if (field.type === "number") {
      const num = Number(value)
      if (isNaN(num)) {
        errors.push(`${field.label || field.name} must be a number`)
      }
      if (field.min !== undefined && num < field.min) {
        errors.push(`${field.label || field.name} must be at least ${field.min}`)
      }
      if (field.max !== undefined && num > field.max) {
        errors.push(`${field.label || field.name} cannot exceed ${field.max}`)
      }
    }

    if (field.type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        errors.push(`${field.label || field.name} must be a valid email`)
      }
    }

    if (field.type === "date") {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(value)) {
        errors.push(`${field.label || field.name} must be YYYY-MM-DD format`)
      }
    }

    if ((field.type === "text" || field.type === "textarea") && field.max_length) {
      if (value.length > field.max_length) {
        errors.push(`${field.label || field.name} cannot exceed ${field.max_length} characters`)
      }
    }

    if (field.type === "enum" && field.values) {
      if (!field.values.includes(value)) {
        errors.push(`${field.label || field.name} must be one of: ${field.values.join(", ")}`)
      }
    }

    return errors[0] || null
  }

  const handleFieldChange = (fieldName: string, value: string | number | boolean) => {
    const field = schema.fields.find((f) => f.name === fieldName)
    if (!field) return

    // Update form data
    const newFormData = { ...formData, [fieldName]: value }
    setFormData(newFormData)

    // Validate
    const error = validateField(field, value)
    const newErrors = { ...errors }
    if (error) {
      newErrors[fieldName] = error
    } else {
      delete newErrors[fieldName]
    }
    setErrors(newErrors)

    // Notify parent of changes (only include non-empty fields)
    const cleanedData = Object.entries(newFormData).reduce(
      (acc, [key, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          acc[key] = val
        }
        return acc
      },
      {} as Record<string, string | number | boolean>
    )
    onDataChange(cleanedData)
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {schema.description && <p>{schema.description}</p>}
        <p className="mt-2">Fields marked with * are required</p>
      </div>

      <div className="space-y-4">
        {schema.fields.map((field) => (
          <FormField
            key={field.name}
            field={field}
            value={formData[field.name] ?? ""}
            error={errors[field.name]}
            onChange={(value) => handleFieldChange(field.name, value)}
          />
        ))}
      </div>
    </div>
  )
}

interface FormFieldProps {
  field: SchemaField
  value: string | number | boolean
  error?: string
  onChange: (value: string | number | boolean) => void
}

function FormField({ field, value, error, onChange }: FormFieldProps) {
  const label = field.label || formatLabel(field.name)
  const isRequired = field.required

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {isRequired && <span className="text-destructive ml-1">*</span>}
      </label>

      {field.type === "text" && (
        <Input
          type="text"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.description}
          maxLength={field.max_length}
          className={error ? "border-destructive" : ""}
        />
      )}

      {field.type === "textarea" && (
        <Textarea
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.description}
          maxLength={field.max_length}
          className={`min-h-24 ${error ? "border-destructive" : ""}`}
        />
      )}

      {field.type === "number" && (
        <Input
          type="number"
          value={value === "" ? "" : Number(value)}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
          placeholder={field.description}
          min={field.min}
          max={field.max}
          className={error ? "border-destructive" : ""}
        />
      )}

      {field.type === "email" && (
        <Input
          type="email"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.description}
          className={error ? "border-destructive" : ""}
        />
      )}

      {field.type === "date" && (
        <Input
          type="date"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className={error ? "border-destructive" : ""}
        />
      )}

      {field.type === "enum" && field.values && (
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger className={error ? "border-destructive" : ""}>
            <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {field.values.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.type === "boolean" && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={field.name}
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <label htmlFor={field.name} className="text-sm cursor-pointer">
            {field.description}
          </label>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {field.type === "text" && field.max_length && (
        <p className="text-xs text-muted-foreground">
          {String(value).length}/{field.max_length}
        </p>
      )}

      {field.type === "textarea" && field.max_length && (
        <p className="text-xs text-muted-foreground">
          {String(value).length}/{field.max_length}
        </p>
      )}
    </div>
  )
}

function formatLabel(fieldName: string) {
  return fieldName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
