"use client"

import { useState, useEffect, Fragment } from "react"
import { Button } from "@/components/ui/button"
import { PlusIcon, TrashIcon } from "lucide-react"
import type { SchemaField, CellStructure } from "@/hooks/useSchema"
import { TableCellHandler } from "./TableCellHandler"

interface DynamicTableFieldProps {
  field: SchemaField
  value: Array<Record<string, any>>
  formData: Record<string, any>
  onChange: (value: Array<Record<string, any>>) => void
}

export function DynamicTableField({
  field,
  value,
  formData,
  onChange,
}: DynamicTableFieldProps) {
  const rowSource = field.row_source || { type: "user_provided" }
  const columns = field.columns || []
  const hasCellStructure = field.cell_structure !== undefined

  // Route to appropriate table type handler
  switch (rowSource.type) {
    case "date_range":
      return (
        <DateRangeTable
          field={field}
          value={value}
          formData={formData}
          onChange={onChange}
          columns={columns}
          hasCellStructure={hasCellStructure}
        />
      )
    case "user_provided":
      return (
        <UserProvidedTable
          field={field}
          value={value}
          onChange={onChange}
          columns={columns}
          hasCellStructure={hasCellStructure}
        />
      )
    case "fixed":
      return (
        <FixedTable
          field={field}
          value={value}
          onChange={onChange}
          columns={columns}
          hasCellStructure={hasCellStructure}
        />
      )
    default:
      return (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded text-sm text-red-700 dark:text-red-200">
          Unknown row_source type: {rowSource.type}
        </div>
      )
  }
}

// ============================================================================
// DATE RANGE TABLE - Auto-generates rows from date range
// ============================================================================

interface DateRangeTableProps {
  field: SchemaField
  value: Array<Record<string, any>>
  formData: Record<string, any>
  onChange: (value: Array<Record<string, any>>) => void
  columns: string[]
  hasCellStructure: boolean
}

function DateRangeTable({
  field,
  value,
  formData,
  onChange,
  columns,
  hasCellStructure,
}: DateRangeTableProps) {
  const [rowHeights, setRowHeights] = useState<Record<number, number>>({})
  const [isResizing, setIsResizing] = useState<number | null>(null)
  const [resizeStart, setResizeStart] = useState(0)

  const rowSource = field.row_source || {}
  const config = rowSource.config || {}
  const startFieldName = config.start_field || ""
  const endFieldName = config.end_field || ""

  // Generate date range helper
  const generateDateRange = (startStr: string, endStr: string): string[] => {
    if (!startStr || !endStr) return []

    const dates: string[] = []
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

  const startValue = formData[startFieldName]
  const endValue = formData[endFieldName]
  const startDateStr = startValue ? String(startValue) : ""
  const endDateStr = endValue ? String(endValue) : startDateStr
  const dateRange = generateDateRange(startDateStr, endDateStr)
  const tableData = value && Array.isArray(value) ? value : []

  // Initialize rows when date range changes
  useEffect(() => {
    const newDateRange = generateDateRange(startDateStr, endDateStr)

    if (newDateRange.length > 0) {
      const currentDates = tableData.map((row) => row.date)
      const datesChanged =
        currentDates.length !== newDateRange.length ||
        !currentDates.every((date, idx) => date === newDateRange[idx])

      if (datesChanged) {
        const initialData = newDateRange.map((date) => {
          const existingRow = tableData.find((row) => row.date === date)
          if (existingRow) {
            return { ...existingRow }
          }

          const row: Record<string, any> = { date }
          columns.forEach((col) => {
            if (hasCellStructure) {
              const cellData: Record<string, any> = {}
              field.cell_structure?.parts.forEach((part) => {
                if (part.type === "array-textarea") {
                  cellData[part.name] = [""]
                } else if (part.type === "select") {
                  cellData[part.name] = null
                } else {
                  cellData[part.name] = ""
                }
              })
              row[col] = cellData
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
        Please select {startFieldName} and {endFieldName} to generate rows
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
                        <TableCellHandler
                          columnName={formatLabel(col)}
                          cellData={typeof row[col] === "object" && row[col] !== null ? row[col] : {}}
                          cellStructure={field.cell_structure}
                          onChange={(newData) => handleCellChange(dateIndex, col, newData)}
                          rowHeight={rowHeights[dateIndex]}
                        />
                      ) : (
                        <textarea
                          value={typeof row[col] === "string" ? row[col] : ""}
                          onChange={(e) => handleCellChange(dateIndex, col, e.target.value)}
                          placeholder={`Enter ${formatLabel(col).toLowerCase()}`}
                          className="w-full p-2 border rounded text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                          style={{
                            height: rowHeights[dateIndex] ? `${rowHeights[dateIndex] - 24}px` : "auto",
                            minHeight: "24px",
                          }}
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

// ============================================================================
// USER PROVIDED TABLE - User controls rows
// ============================================================================

interface UserProvidedTableProps {
  field: SchemaField
  value: Array<Record<string, any>>
  onChange: (value: Array<Record<string, any>>) => void
  columns: string[]
  hasCellStructure: boolean
}

function UserProvidedTable({
  field,
  value,
  onChange,
  columns,
  hasCellStructure,
}: UserProvidedTableProps) {
  const tableData = value && Array.isArray(value) ? value : []

  const handleAddRow = () => {
    const newRow: Record<string, any> = {}
    columns.forEach((col) => {
      if (hasCellStructure) {
        const cellData: Record<string, any> = {}
        field.cell_structure?.parts.forEach((part) => {
          if (part.type === "array-textarea") {
            cellData[part.name] = [""]
          } else if (part.type === "select") {
            cellData[part.name] = null
          } else {
            cellData[part.name] = ""
          }
        })
        newRow[col] = cellData
      } else {
        newRow[col] = ""
      }
    })
    onChange([...tableData, newRow])
  }

  const handleDeleteRow = (rowIndex: number) => {
    const newTableData = tableData.filter((_, idx) => idx !== rowIndex)
    onChange(newTableData)
  }

  const handleCellChange = (rowIndex: number, columnKey: string, cellValue: any) => {
    const newTableData = [...tableData]
    newTableData[rowIndex][columnKey] = cellValue
    onChange(newTableData)
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-2 text-left font-medium min-w-48">
                  {formatLabel(col)}
                </th>
              ))}
              <th className="px-4 py-2 text-center font-medium w-10">Action</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b hover:bg-muted/30">
                {columns.map((col) => (
                  <td key={col} className="px-4 py-3">
                    {hasCellStructure && field.cell_structure ? (
                      <TableCellHandler
                        columnName={formatLabel(col)}
                        cellData={typeof row[col] === "object" && row[col] !== null ? row[col] : {}}
                        cellStructure={field.cell_structure}
                        onChange={(newData) => handleCellChange(rowIndex, col, newData)}
                      />
                    ) : (
                      <textarea
                        value={typeof row[col] === "string" ? row[col] : ""}
                        onChange={(e) => handleCellChange(rowIndex, col, e.target.value)}
                        placeholder={`Enter ${formatLabel(col).toLowerCase()}`}
                        className="w-full p-2 border rounded text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-12"
                      />
                    )}
                  </td>
                ))}
                <td className="px-4 py-3 text-center">
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

      {tableData.length === 0 && (
        <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-200">
          Click "Add Row" to add table data.
        </p>
      )}
    </div>
  )
}

// ============================================================================
// FIXED TABLE - Fixed number of rows
// ============================================================================

interface FixedTableProps {
  field: SchemaField
  value: Array<Record<string, any>>
  onChange: (value: Array<Record<string, any>>) => void
  columns: string[]
  hasCellStructure: boolean
}

function FixedTable({
  field,
  value,
  onChange,
  columns,
  hasCellStructure,
}: FixedTableProps) {
  const rowSource = field.row_source || {}
  const config = rowSource.config || {}
  const fixedCount = config.count || 3
  const tableData = value && Array.isArray(value) ? value : []

  // Initialize with fixed number of rows on first render
  useEffect(() => {
    if (tableData.length !== fixedCount) {
      const initialData = Array.from({ length: fixedCount }).map((_, idx) => {
        const existingRow = tableData[idx]
        if (existingRow) {
          return { ...existingRow }
        }

        const row: Record<string, any> = { row_number: idx + 1 }
        columns.forEach((col) => {
          if (hasCellStructure) {
            const cellData: Record<string, any> = {}
            field.cell_structure?.parts.forEach((part) => {
              if (part.type === "array-textarea") {
                cellData[part.name] = [""]
              } else if (part.type === "select") {
                cellData[part.name] = null
              } else {
                cellData[part.name] = ""
              }
            })
            row[col] = cellData
          } else {
            row[col] = ""
          }
        })
        return row
      })
      onChange(initialData)
    }
  }, [fixedCount])

  const handleCellChange = (rowIndex: number, columnKey: string, cellValue: any) => {
    const newTableData = [...tableData]
    newTableData[rowIndex][columnKey] = cellValue
    onChange(newTableData)
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground mb-2">
        Showing {fixedCount} row{fixedCount !== 1 ? "s" : ""}
      </div>
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-2 text-left font-medium w-12">#</th>
              {columns.map((col) => (
                <th key={col} className="px-4 py-2 text-left font-medium min-w-48">
                  {formatLabel(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-muted-foreground bg-muted/20">
                  {rowIndex + 1}
                </td>
                {columns.map((col) => (
                  <td key={col} className="px-4 py-3">
                    {hasCellStructure && field.cell_structure ? (
                      <TableCellHandler
                        columnName={formatLabel(col)}
                        cellData={typeof row[col] === "object" && row[col] !== null ? row[col] : {}}
                        cellStructure={field.cell_structure}
                        onChange={(newData) => handleCellChange(rowIndex, col, newData)}
                      />
                    ) : (
                      <textarea
                        value={typeof row[col] === "string" ? row[col] : ""}
                        onChange={(e) => handleCellChange(rowIndex, col, e.target.value)}
                        placeholder={`Enter ${formatLabel(col).toLowerCase()}`}
                        className="w-full p-2 border rounded text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-12"
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function formatLabel(text: string): string {
  return text
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
