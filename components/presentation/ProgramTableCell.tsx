"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GripVertical } from "lucide-react"
import type { CellStructure, CellPart } from "@/hooks/useSchema"

interface ProgramTableCellProps {
  columnName: string
  cellData: Record<string, any>
  cellStructure: CellStructure
  onChange: (newData: Record<string, any>) => void
  rowHeight?: number
}

export function ProgramTableCell({
  columnName,
  cellData,
  cellStructure,
  onChange,
  rowHeight,
}: ProgramTableCellProps) {
  const [expanded, setExpanded] = useState(true)
  const [draggedPart, setDraggedPart] = useState<string | null>(null)
  const [partOrder, setPartOrder] = useState<string[]>(
    cellStructure.parts.map((p) => p.name)
  )

  const buildCellData = (updates: Record<string, any>): Record<string, any> => {
    const merged = { ...cellData, ...updates }
    const cleaned: Record<string, any> = {}

    // Include only parts that have content or are defined in schema
    for (const part of cellStructure.parts) {
      const value = merged[part.name]

      // Include if has value, or if it's required or user provides it
      if (value || part.required || part.user_provides) {
        if (part.type === "array-textarea") {
          // Keep all array items including empty ones (user may be editing)
          if (Array.isArray(value)) {
            cleaned[part.name] = value
          } else if (value === undefined && (part.required || part.user_provides)) {
            cleaned[part.name] = [""]
          }
        } else {
          cleaned[part.name] = value
        }
      }
    }

    return cleaned
  }

  const handlePartChange = (partName: string, value: any) => {
    const updated = buildCellData({ [partName]: value })
    onChange(updated)
  }

  const handleAddArrayItem = (partName: string) => {
    const currentArray = cellData[partName] || []
    const newArray = [...currentArray, ""]
    const updated = buildCellData({ [partName]: newArray })
    onChange(updated)
  }

  const handleRemoveArrayItem = (partName: string, index: number) => {
    const currentArray = cellData[partName] || []
    const newArray = currentArray.filter((_: any, i: number) => i !== index)
    const updated = buildCellData({ [partName]: newArray })
    onChange(updated)
  }

  const handleArrayItemChange = (partName: string, index: number, value: string) => {
    const currentArray = cellData[partName] || []
    const newArray = [...currentArray]
    newArray[index] = value
    const updated = buildCellData({ [partName]: newArray })
    onChange(updated)
  }

  const handleDragStart = (partName: string) => {
    setDraggedPart(partName)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (targetPart: string) => {
    if (!draggedPart || draggedPart === targetPart || !cellStructure.draggable) {
      setDraggedPart(null)
      return
    }

    const newOrder = [...partOrder]
    const draggedIdx = newOrder.indexOf(draggedPart)
    const targetIdx = newOrder.indexOf(targetPart)

    if (draggedIdx !== -1 && targetIdx !== -1) {
      const temp = newOrder[draggedIdx]
      newOrder[draggedIdx] = newOrder[targetIdx]
      newOrder[targetIdx] = temp
      setPartOrder(newOrder)
    }

    setDraggedPart(null)
  }

  const handleDragEnd = () => {
    setDraggedPart(null)
  }

  const renderPartContent = (part: CellPart) => {
    const value = cellData[part.name]

    switch (part.type) {
      case "array-textarea":
        return (
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground flex items-center">
              {part.label} (Paragraphs)
              {value && Array.isArray(value) && value.length > 0 && (
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-1" title="Has content" />
              )}
            </label>

            {/* Input textareas for array items */}
            <div className="space-y-2">
              {(Array.isArray(value) ? value : []).map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Item {idx + 1}</span>
                    {Array.isArray(value) && value.length > 1 && (
                      <button
                        onClick={() => handleRemoveArrayItem(part.name, idx)}
                        className="px-2 py-1 text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 rounded"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <Textarea
                    value={item || ""}
                    onChange={(e) => handleArrayItemChange(part.name, idx, e.target.value)}
                    placeholder={`Item ${idx + 1}: Enter text...`}
                    className="min-h-12 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
            </div>

            {/* Add item button */}
            <button
              onClick={() => handleAddArrayItem(part.name)}
              className="w-full px-3 py-2 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded font-medium"
            >
              + Add Item
            </button>
          </div>
        )

      case "select":
        return (
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground flex items-center">
              {part.label}
              {value && <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-1" title="Has content" />}
            </label>
            <div className="flex gap-2">
              <Select
                value={value?.id?.toString() || ""}
                onValueChange={(optionId) => {
                  const selected = part.options?.find((opt) => opt.id === parseInt(optionId))
                  handlePartChange(part.name, selected ? { id: selected.id, name: selected.name } : null)
                }}
              >
                <SelectTrigger className="text-xs h-8 flex-1">
                  <SelectValue placeholder={`Select ${part.label.toLowerCase()}...`} />
                </SelectTrigger>
                <SelectContent>
                  {part.options?.map((option) => (
                    <SelectItem key={option.id} value={option.id.toString()}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {value && (
                <button
                  onClick={() => handlePartChange(part.name, null)}
                  className="px-2 py-1 text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 rounded"
                  title="Clear selection"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )

      case "text":
      case "textarea":
        return (
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground flex items-center">
              {part.label}
              {value && <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-1" title="Has content" />}
            </label>
            <Textarea
              value={value || ""}
              onChange={(e) => handlePartChange(part.name, e.target.value)}
              placeholder={`Enter ${part.label.toLowerCase()}...`}
              className="min-h-12 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )

      default:
        return <div className="text-xs text-muted-foreground">Unsupported part type: {part.type}</div>
    }
  }

  // Get parts in current order
  const orderedParts = cellStructure.draggable
    ? partOrder.map((name) => cellStructure.parts.find((p) => p.name === name)).filter(Boolean) as CellPart[]
    : cellStructure.parts

  return (
    <div className="space-y-2 p-2 bg-card rounded border border-border/50">
      {/* Header with column name */}
      <div
        className="flex items-center justify-between cursor-pointer hover:bg-muted/30 p-1 rounded"
        onClick={() => setExpanded(!expanded)}
      >
        <h5 className="font-medium text-sm">{columnName}</h5>
        <span className="text-xs text-muted-foreground">{expanded ? "▼" : "▶"}</span>
      </div>

      {/* Expanded content with draggable sections */}
      {expanded && (
        <div className="space-y-3 pt-2 border-t">
          {orderedParts.map((part) => (
            <div
              key={part.name}
              draggable={cellStructure.draggable}
              onDragStart={() => handleDragStart(part.name)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(part.name)}
              onDragEnd={handleDragEnd}
              className={`p-3 rounded border transition-all ${
                cellStructure.draggable ? "cursor-move" : ""
              } ${
                draggedPart === part.name
                  ? "bg-blue-50 border-blue-300 dark:bg-blue-950/30 dark:border-blue-700 opacity-50"
                  : "bg-muted/20 border-border/50 hover:bg-muted/40"
              }`}
            >
              {/* Drag Handle */}
              {cellStructure.draggable && (
                <div className="flex items-center gap-2 mb-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {part.label}
                  </span>
                </div>
              )}

              {!cellStructure.draggable && (
                <div className="mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {part.label}
                  </span>
                </div>
              )}

              {/* Part Content */}
              <div className={cellStructure.draggable ? "ml-6" : ""}>{renderPartContent(part)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Info about draggable order */}
      {expanded && cellStructure.draggable && orderedParts.length > 1 && (
        <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-700/30">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            💡 Drag sections to reorder them. The AI will generate content in this order.
          </p>
        </div>
      )}
    </div>
  )
}
