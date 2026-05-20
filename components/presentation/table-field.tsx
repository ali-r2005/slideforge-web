"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusIcon, TrashIcon } from "lucide-react"
import type { PresentationPlaceholder } from "@/types/presentation"

interface TableFieldProps {
  placeholder: PresentationPlaceholder
  columnHeaders?: string[]
  onChange: (placeholder: PresentationPlaceholder, value: Record<string, string>[]) => void
}

export function TableField({
  placeholder,
  columnHeaders = [],
  onChange,
}: TableFieldProps) {
  // Parse the table data from the placeholder value
  const tableData = parseTableValue(placeholder.value)

  function handleCellChange(rowIndex: number, columnName: string, newValue: string) {
    const updatedData = [...tableData]
    updatedData[rowIndex] = {
      ...updatedData[rowIndex],
      [columnName]: newValue,
    }
    onChange(placeholder, updatedData)
  }

  function handleAddRow() {
    const newRow: Record<string, string> = {}
    columnHeaders.forEach((header) => {
      newRow[header] = ""
    })
    const updatedData = [...tableData, newRow]
    onChange(placeholder, updatedData)
  }

  function handleDeleteRow(rowIndex: number) {
    const updatedData = tableData.filter((_, idx) => idx !== rowIndex)
    onChange(placeholder, updatedData)
  }

  if (columnHeaders.length === 0) {
    return (
      <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-900/30 dark:bg-yellow-950/20 dark:text-yellow-200">
        No column headers available for this table.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">
        {formatPlaceholderLabel(placeholder.placeholder)}
      </div>

      {/* Table Editor */}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full border-collapse">
          <thead className="bg-muted">
            <tr>
              {columnHeaders.map((header) => (
                <th
                  key={header}
                  className="border-b border-r px-3 py-2 text-left text-xs font-semibold text-foreground last:border-r-0"
                >
                  {header}
                </th>
              ))}
              <th className="border-b px-3 py-2 text-center text-xs font-semibold text-foreground w-10">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-muted/50">
                {columnHeaders.map((header) => (
                  <td key={`${rowIndex}-${header}`} className="border-b border-r last:border-r-0">
                    <Input
                      type="text"
                      value={row[header] ?? ""}
                      onChange={(e) => handleCellChange(rowIndex, header, e.target.value)}
                      placeholder={`Enter ${header.toLowerCase()}`}
                      className="h-9 border-0 rounded-none px-3 text-sm focus-visible:ring-0 focus-visible:bg-blue-50 dark:focus-visible:bg-blue-950/30"
                    />
                  </td>
                ))}
                <td className="border-b px-2 py-2 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRow(rowIndex)}
                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <TrashIcon className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Row Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddRow}
        className="w-full"
      >
        <PlusIcon className="mr-2 size-4" />
        Add Row
      </Button>

      {/* Info */}
      {tableData.length === 0 && (
        <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-200">
          Click "Add Row" to add table data.
        </p>
      )}
    </div>
  )
}

function parseTableValue(value: any): Record<string, string>[] {
  // If value is already an array of objects, return it
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
    return value
  }

  // If value is a string, try to parse it as JSON
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed
      }
    } catch {
      // If JSON parsing fails, return empty array
    }
  }

  // Return empty array if no valid data
  return []
}

function formatPlaceholderLabel(placeholder: string) {
  return placeholder
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
