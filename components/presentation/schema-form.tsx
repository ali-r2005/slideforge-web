"use client"

import { useState, useMemo, useEffect, Fragment } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Schema, SchemaField, SchemaGroup } from "@/hooks/useSchema"
import { useTeamBuilding } from "@/hooks/useTeamBuilding"
import { ProgramTableCell } from "./ProgramTableCell"

interface SchemaFormProps {
  schema: Schema
  onDataChange: (formData: Record<string, any>) => void
}

export function SchemaForm({ schema, onDataChange }: SchemaFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
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

  const handleFieldChange = (fieldName: string, value: any) => {
    const field = schema.fields.find((f) => f.name === fieldName)
    if (!field) return

    // Update form data
    const newFormData = { ...formData, [fieldName]: value }
    setFormData(newFormData)

    // Validate (skip validation for program_table - handled server-side)
    if (field.type !== "program_table") {
      const error = validateField(field, value)
      const newErrors = { ...errors }
      if (error) {
        newErrors[fieldName] = error
      } else {
        delete newErrors[fieldName]
      }
      setErrors(newErrors)
    }

    // Notify parent of changes (only include non-empty fields)
    const cleanedData = Object.entries(newFormData).reduce(
      (acc, [key, val]) => {
        if (val !== undefined && val !== null && val !== "" && !(Array.isArray(val) && val.length === 0)) {
          acc[key] = val
        }
        return acc
      },
      {} as Record<string, any>
    )
    onDataChange(cleanedData)
  }

  // Organize fields by groups if groups exist
  const getGroupedFields = useMemo(() => {
    if (!schema.groups || schema.groups.length === 0) {
      // No groups - return all fields flat
      return {
        ungrouped: schema.fields,
        groups: []
      }
    }

    const groupFieldNames = new Set<string>()
    const groupedItems: Array<{ group: SchemaGroup; fields: SchemaField[] }> = []

    // Organize fields into groups
    for (const group of schema.groups) {
      const groupFields = group.fields
        .map((fieldName) => schema.fields.find((f) => f.name === fieldName))
        .filter((field) => field !== undefined) as SchemaField[]

      groupedItems.push({ group, fields: groupFields })

      // Track which fields are in groups
      group.fields.forEach((name) => groupFieldNames.add(name))
    }

    // Find ungrouped fields
    const ungroupedFields = schema.fields.filter((f) => !groupFieldNames.has(f.name))

    return {
      ungrouped: ungroupedFields,
      groups: groupedItems
    }
  }, [schema])

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {schema.description && <p>{schema.description}</p>}
        <p className="mt-2">Fields marked with * are required</p>
      </div>

      <div className="space-y-6">
        {/* Render ungrouped fields first */}
        {getGroupedFields.ungrouped.length > 0 && (
          <div className="space-y-4">
            {getGroupedFields.ungrouped.map((field) => (
              <FormField
                key={field.name}
                field={field}
                value={formData[field.name] ?? (field.type === "program_table" ? [] : "")}
                error={errors[field.name]}
                onChange={(value) => handleFieldChange(field.name, value)}
                schema={schema}
                formData={formData}
              />
            ))}
          </div>
        )}

        {/* Render grouped fields */}
        {getGroupedFields.groups.map(({ group, fields }) => (
          <div key={group.name} className="space-y-3 rounded-lg border border-border/50 p-4 bg-card/50">
            <div>
              <h4 className="font-medium text-sm text-foreground">{group.name}</h4>
              {group.description && (
                <p className="text-xs text-muted-foreground mt-1">{group.description}</p>
              )}
            </div>
            <div className="space-y-4 pt-2">
              {fields.map((field) => (
                <FormField
                  key={field.name}
                  field={field}
                  value={formData[field.name] ?? (field.type === "program_table" ? [] : "")}
                  error={errors[field.name]}
                  onChange={(value) => handleFieldChange(field.name, value)}
                  schema={schema}
                  formData={formData}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ProgramTableProps {
  field: SchemaField
  value: Array<Record<string, string>>
  schema: Schema
  formData: Record<string, any>
  onChange: (value: Array<Record<string, string>>) => void
}

function ProgramTable({ field, value, schema, formData, onChange }: ProgramTableProps) {
  const [rowHeights, setRowHeights] = useState<Record<number, number>>({})
  const [isResizing, setIsResizing] = useState<number | null>(null)
  const [resizeStart, setResizeStart] = useState(0)

  const { activities: teamBuildingActivities } = useTeamBuilding()
  const hasCellStructure = field.cell_structure !== undefined

  const generateDateRange = (startStr: string, endStr: string): string[] => {
    if (!startStr || !endStr) return []

    const dates: string[] = []

    // Parse dates manually to avoid timezone issues
    const parseDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split("-").map(Number)
      return new Date(year, month - 1, day)
    }

    const current = parseDate(startStr)
    const end = parseDate(endStr)

    while (current <= end) {
      const year = current.getFullYear()
      const month = String(current.getMonth() + 1).padStart(2, "0")
      const day = String(current.getDate()).padStart(2, "0")
      dates.push(`${year}-${month}-${day}`)
      current.setDate(current.getDate() + 1)
    }

    return dates
  }

  const startFieldName = field.date_range_start_field || ""
  const endFieldName = field.date_range_end_field || ""

  // Extract actual date values
  const startValue = formData[startFieldName]
  const endValue = formData[endFieldName]

  const startDateStr = startValue ? String(startValue) : ""
  const endDateStr = endValue ? String(endValue) : (startDateStr || "") // Use start date if end is empty

  const dateRange = generateDateRange(startDateStr, endDateStr)
  const columns = field.columns || []

  // Get current table data
  const tableData = value && Array.isArray(value) ? value : []

  // Initialize or update table rows when date range changes
  useEffect(() => {
    const newDateRange = generateDateRange(startDateStr, endDateStr)

    if (newDateRange.length > 0) {
      // Check if dates have changed from current table
      const currentDates = tableData.map((row) => row.date)
      const datesChanged = currentDates.length !== newDateRange.length ||
                          !currentDates.every((date, idx) => date === newDateRange[idx])

      if (datesChanged) {
        // Rebuild table with new date range, preserving existing data
        const initialData = newDateRange.map((date) => {
          const existingRow = tableData.find((row) => row.date === date)
          if (existingRow) {
            return { ...existingRow }
          }
          // New date row
          const row: Record<string, any> = { date }
          columns.forEach((col) => {
            if (hasCellStructure) {
              row[col] = {
                context_prompt: "",
                context: [],
                team_building: null,
                agency_offer_request: "",
                agency_offer: [],
              }
            } else {
              row[col] = ""
            }
          })
          return row
        })
        onChange(initialData)
      }
    }
  }, [startValue, endValue])

  const handleCellChange = (dateIndex: number, columnKey: string, cellValue: any) => {
    const newTableData = [...tableData]
    if (!newTableData[dateIndex]) {
      newTableData[dateIndex] = { date: dateRange[dateIndex] || "" }
    }
    newTableData[dateIndex][columnKey] = cellValue
    onChange(newTableData)
  }

  const handleResizeStart = (e: React.MouseEvent, rowIndex: number) => {
    e.preventDefault()
    setIsResizing(rowIndex)
    setResizeStart(e.clientY)
  }

  useEffect(() => {
    if (isResizing === null) return

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientY - resizeStart
      const currentHeight = rowHeights[isResizing] || 48
      const newHeight = Math.max(48, currentHeight + diff)

      setRowHeights((prev) => ({
        ...prev,
        [isResizing]: newHeight,
      }))
      setResizeStart(e.clientY)
    }

    const handleMouseUp = () => {
      setIsResizing(null)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, resizeStart, rowHeights])

  if (dateRange.length === 0) {
    return (
      <div className="p-4 bg-muted/30 rounded border text-sm text-muted-foreground text-center">
        Please select event start and end dates to create the program schedule
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left font-medium min-w-24">Date</th>
              {columns.map((col) => (
                <th key={col} className="px-4 py-2 text-left font-medium min-w-48">
                  {formatLabel(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, dateIndex) => (
              <Fragment key={dateIndex}>
                <tr
                  className="border-b hover:bg-muted/30"
                  style={{ height: rowHeights[dateIndex] ? `${rowHeights[dateIndex]}px` : "auto" }}
                >
                  <td className="px-4 py-3 font-medium whitespace-nowrap bg-muted/20 align-top">
                    {row.date}
                  </td>
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-3">
                      {hasCellStructure && field.cell_structure ? (
                        <ProgramTableCell
                          columnName={formatLabel(col)}
                          cellData={typeof row[col] === "object" && row[col] !== null ? row[col] : {}}
                          cellStructure={field.cell_structure}
                          teamBuildingActivities={teamBuildingActivities}
                          onChange={(newData) =>
                            handleCellChange(dateIndex, col, newData)
                          }
                          rowHeight={rowHeights[dateIndex]}
                        />
                      ) : (
                        <textarea
                          value={typeof row[col] === "string" ? row[col] : ""}
                          onChange={(e) => handleCellChange(dateIndex, col, e.target.value)}
                          placeholder={`Enter ${formatLabel(col).toLowerCase()}`}
                          className="w-full p-2 border rounded text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                          style={{ height: rowHeights[dateIndex] ? `${rowHeights[dateIndex] - 24}px` : "auto", minHeight: "24px" }}
                        />
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="h-0">
                  <td colSpan={columns.length + 1} className="p-0">
                    <div
                      onMouseDown={(e) => handleResizeStart(e, dateIndex)}
                      className="h-1 bg-border hover:bg-primary cursor-row-resize transition-colors w-full block"
                      style={{ opacity: isResizing === dateIndex ? 1 : 0.5 }}
                    />
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface FormFieldProps {
  field: SchemaField
  value: any
  error?: string
  onChange: (value: any) => void
  schema?: Schema
  formData?: Record<string, any>
}

function FormField({ field, value, error, onChange, schema, formData = {} }: FormFieldProps) {
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

      {field.type === "program_table" && schema && (
        <ProgramTable
          field={field}
          value={Array.isArray(value) ? value : []}
          schema={schema}
          formData={formData}
          onChange={onChange}
        />
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
