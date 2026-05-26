"use client"

import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GripVertical } from "lucide-react"
import type { CellStructure, SchemaField } from "@/hooks/useSchema"
import type { TeamBuildingActivity } from "@/hooks/useTeamBuilding"

interface ProgramTableCellData {
  context_prompt?: string
  context?: string[]
  team_building?: {
    id?: number
    name: string
    slogan?: string
    description?: string
    les_plus?: string[]
  }
  agency_offer_request?: string
  agency_offer?: string[]
}

interface ProgramTableCellProps {
  columnName: string
  cellData: ProgramTableCellData
  cellStructure: CellStructure
  teamBuildingActivities: TeamBuildingActivity[]
  onChange: (newData: ProgramTableCellData) => void
  rowHeight?: number
}

type SectionType = "context" | "team_building" | "offers"

export function ProgramTableCell({
  columnName,
  cellData,
  cellStructure,
  teamBuildingActivities,
  onChange,
  rowHeight,
}: ProgramTableCellProps) {
  const [expanded, setExpanded] = useState(true)
  const [sectionOrder, setSectionOrder] = useState<SectionType[]>([
    "context",
    "team_building",
    "offers",
  ])
  const [draggedSection, setDraggedSection] = useState<SectionType | null>(null)

  // Initialize section order based on cellStructure
  useEffect(() => {
    const newOrder: SectionType[] = []
    if (cellStructure.parts.includes("context")) newOrder.push("context")
    if (cellStructure.parts.includes("team_building")) newOrder.push("team_building")
    if (cellStructure.parts.includes("agency_offer")) newOrder.push("offers")
    setSectionOrder(newOrder)
  }, [cellStructure])

  const buildCellData = (updates: Partial<ProgramTableCellData>): ProgramTableCellData => {
    const merged = { ...cellData, ...updates }
    const cleaned: ProgramTableCellData = {}

    // Only include fields with actual content
    if (merged.context_prompt?.trim()) {
      cleaned.context_prompt = merged.context_prompt
    }
    if (merged.team_building?.name) {
      cleaned.team_building = merged.team_building
    }
    if (merged.agency_offer_request?.trim()) {
      cleaned.agency_offer_request = merged.agency_offer_request
      cleaned.agency_offer = merged.agency_offer
    }
    if (merged.context?.length) {
      cleaned.context = merged.context
    }

    return cleaned
  }

  const handleContextPromptChange = (value: string) => {
    const updated = buildCellData({ context_prompt: value })
    onChange(updated)
  }

  const handleTeamBuildingChange = (activityId: string) => {
    if (activityId === "clear") {
      // Clear selection
      const updated = buildCellData({ team_building: undefined })
      onChange(updated)
      return
    }

    const selectedActivity = teamBuildingActivities.find(
      (a) => a.id === parseInt(activityId)
    )
    const updated = buildCellData({
      team_building: selectedActivity
        ? {
            id: selectedActivity.id,
            name: selectedActivity.name,
            slogan: selectedActivity.keywords?.[0] || "",
            description: selectedActivity.objectives.join(", "),
            les_plus: selectedActivity.les_plus,
          }
        : undefined,
    })
    onChange(updated)
  }

  const handleAgencyOfferChange = (value: string) => {
    const updated = buildCellData({
      agency_offer_request: value,
      agency_offer: value
        .split("\n")
        .filter((line) => line.trim() !== ""),
    })
    onChange(updated)
  }

  const handleDragStart = (section: SectionType) => {
    setDraggedSection(section)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (targetSection: SectionType) => {
    if (!draggedSection || draggedSection === targetSection) {
      setDraggedSection(null)
      return
    }

    const newOrder = [...sectionOrder]
    const draggedIndex: number = newOrder.indexOf(draggedSection)
    const targetIdx: number = newOrder.indexOf(targetSection)

    // Swap positions
    if (draggedIndex !== -1 && targetIdx !== -1) {
      const temp = newOrder[draggedIndex]
      newOrder[draggedIndex] = newOrder[targetIdx]
      newOrder[targetIdx] = temp
    }

    setSectionOrder(newOrder)
    setDraggedSection(null)
  }

  const handleDragEnd = () => {
    setDraggedSection(null)
  }

  const renderArrayWithLineBreaks = (arr: string[] | undefined) => {
    if (!arr || arr.length === 0) return null
    return (
      <div className="text-xs text-muted-foreground space-y-1">
        {arr.map((item, i) => (
          <div key={i}>{item}</div>
        ))}
      </div>
    )
  }

  const renderSection = (section: SectionType) => {
    switch (section) {
      case "context":
        return (
          cellStructure.parts.includes("context") && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground flex items-center">
                Context/Setup
                {getFieldIndicator(hasContext)}
              </label>
              <Textarea
                value={cellData.context_prompt || ""}
                onChange={(e) => handleContextPromptChange(e.target.value)}
                placeholder="Describe the context or setup for this time slot..."
                className="min-h-16 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {cellData.context && cellData.context.length > 0 && (
                <div className="p-2 bg-muted/30 rounded">
                  <p className="text-xs font-medium mb-1 text-muted-foreground">
                    Generated:
                  </p>
                  {renderArrayWithLineBreaks(cellData.context)}
                </div>
              )}
            </div>
          )
        )

      case "team_building":
        return (
          cellStructure.parts.includes("team_building") && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground flex items-center">
                Team Building
                {getFieldIndicator(hasTeamBuilding)}
              </label>
              <Select
                value={cellData.team_building?.id?.toString() || ""}
                onValueChange={handleTeamBuildingChange}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Select activity (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clear">
                    <span className="text-muted-foreground">Clear selection</span>
                  </SelectItem>
                  {teamBuildingActivities.map((activity) => (
                    <SelectItem
                      key={activity.id}
                      value={activity.id.toString()}
                    >
                      {activity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        )

      case "offers":
        return (
          cellStructure.parts.includes("agency_offer") && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground flex items-center">
                Agency Offers
                {getFieldIndicator(hasOffers)}
              </label>
              <Textarea
                value={cellData.agency_offer_request || ""}
                onChange={(e) => handleAgencyOfferChange(e.target.value)}
                placeholder="Enter offers (one per line)..."
                className="min-h-12 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {cellData.agency_offer && cellData.agency_offer.length > 0 && (
                <div className="p-2 bg-muted/30 rounded">
                  <p className="text-xs font-medium mb-1 text-muted-foreground">
                    Items:
                  </p>
                  {renderArrayWithLineBreaks(cellData.agency_offer)}
                </div>
              )}
            </div>
          )
        )
    }
  }

  const sectionLabels: Record<SectionType, string> = {
    context: "Context/Setup",
    team_building: "Team Building",
    offers: "Agency Offers",
  }

  // Check which fields have content
  const hasContext = cellData.context_prompt?.trim() !== ""
  const hasTeamBuilding = !!cellData.team_building?.name
  const hasOffers = cellData.agency_offer_request?.trim() !== ""

  const getFieldIndicator = (hasContent: boolean) => {
    return hasContent ? (
      <span className="inline-block w-2 h-2 rounded-full bg-green-500 ml-1" title="Has content" />
    ) : (
      <span className="inline-block w-2 h-2 rounded-full bg-gray-300 ml-1" title="Empty" />
    )
  }

  return (
    <div className="space-y-2 p-2 bg-card rounded border border-border/50">
      {/* Header with column name */}
      <div
        className="flex items-center justify-between cursor-pointer hover:bg-muted/30 p-1 rounded"
        onClick={() => setExpanded(!expanded)}
      >
        <h5 className="font-medium text-sm">{columnName}</h5>
        <span className="text-xs text-muted-foreground">
          {expanded ? "▼" : "▶"}
        </span>
      </div>

      {/* Expanded content with draggable sections */}
      {expanded && (
        <div className="space-y-3 pt-2 border-t">
          {sectionOrder.map((section) => (
            <div
              key={section}
              draggable
              onDragStart={() => handleDragStart(section)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(section)}
              onDragEnd={handleDragEnd}
              className={`p-3 rounded border transition-all cursor-move ${
                draggedSection === section
                  ? "bg-blue-50 border-blue-300 dark:bg-blue-950/30 dark:border-blue-700 opacity-50"
                  : "bg-muted/20 border-border/50 hover:bg-muted/40"
              }`}
            >
              {/* Drag Handle */}
              <div className="flex items-center gap-2 mb-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {sectionLabels[section]}
                </span>
              </div>

              {/* Section Content */}
              <div className="ml-6">{renderSection(section)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Info about draggable order */}
      {expanded && sectionOrder.length > 1 && (
        <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-700/30">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            💡 Drag sections to reorder them. The AI will generate content in this order.
          </p>
        </div>
      )}
    </div>
  )
}
