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

export function ProgramTableCell({
  columnName,
  cellData,
  cellStructure,
  teamBuildingActivities,
  onChange,
  rowHeight,
}: ProgramTableCellProps) {
  const [expanded, setExpanded] = useState(true)

  const handleContextPromptChange = (value: string) => {
    onChange({
      ...cellData,
      context_prompt: value,
    })
  }

  const handleTeamBuildingChange = (activityId: string) => {
    const selectedActivity = teamBuildingActivities.find(
      (a) => a.id === parseInt(activityId)
    )
    onChange({
      ...cellData,
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
  }

  const handleAgencyOfferChange = (value: string) => {
    onChange({
      ...cellData,
      agency_offer_request: value,
      agency_offer: value.split("\n").filter((line) => line.trim() !== ""),
    })
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

      {/* TEAM_BUILDING Section - Always visible */}
      {cellStructure.parts.includes("team_building") && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">
            Team Building
          </label>
          <Select
            value={cellData.team_building?.id?.toString() || ""}
            onValueChange={handleTeamBuildingChange}
          >
            <SelectTrigger className="text-xs h-8">
              <SelectValue placeholder="Select activity (optional)" />
            </SelectTrigger>
            <SelectContent>
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
      )}

      {/* Content sections */}
      {expanded && (
        <div className="space-y-3 pt-2 border-t">
          {/* CONTEXT Section */}
          {cellStructure.parts.includes("context") && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Context/Setup
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
          )}

          {/* AGENCY_OFFER Section */}
          {cellStructure.parts.includes("agency_offer") && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Agency Offers
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
          )}
        </div>
      )}
    </div>
  )
}
