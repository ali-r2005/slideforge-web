# Table Editing Guide - Frontend

## Overview

The frontend now includes a dedicated table editing component that allows users to:
- ✅ View and edit table data in a spreadsheet-like interface
- ✅ Add new rows with a single click
- ✅ Delete rows
- ✅ Edit individual cells
- ✅ Tables only appear on slides that have them (not in all slides)

## Changes Made

### 1. New TableField Component
**File**: `components/presentation/table-field.tsx`

A dedicated component for editing table data with:
- Column headers from the template table
- Row-by-row editing interface
- Add/delete row functionality
- Proper data serialization (JSON)

### 2. Updated PlaceholderField Component
**Location**: `components/presentation/presentation-editor-workspace.tsx`

Now detects table type and renders:
- `TableField` for tables (`placeholder.type === "table"`)
- Regular `Input`/`Textarea` for other field types

### 3. Fixed Key Generation
**Issue**: Duplicate React keys causing warnings
**Solution**: 
```javascript
// Before (caused duplicates)
key={`${placeholder.placeholder}-${placeholder.shape_index}`}

// After (unique for each field)
key={`${placeholder.slide_number}-${placeholder.shape_index}-${placeholder.type}-${idx}`}
```

### 4. Updated Types
**File**: `types/presentation.ts`

Added support for:
- Table placeholder type
- `column_headers` field for table columns
- `paragraphs` field for multi-paragraph support
- Array values for tables and bullet lists

### 5. Data Serialization
Tables are stored as JSON strings and properly converted:
- **On load**: Parsed from JSON string to object array
- **On edit**: Kept as object array in component state
- **On save**: Converted back to JSON string for API

## How It Works

### User Flow

1. **Select Slide** → Shows only placeholders from that slide
2. **View Table** → If slide has a table, a table editor appears
3. **Edit Cells** → Click any cell to edit its content
4. **Add Row** → Click "Add Row" button to create new row
5. **Delete Row** → Click trash icon to remove a row
6. **Save** → Click "Update" to send changes to backend

### Data Structure

**In component state** (while editing):
```javascript
[
  { "Name": "Alice", "Email": "alice@example.com", "Phone": "555-1111" },
  { "Name": "Bob", "Email": "bob@example.com", "Phone": "555-2222" }
]
```

**In API request** (when saving):
```javascript
{
  "replacements": {
    "table:employees": "[{\"Name\":\"Alice\",...},{\"Name\":\"Bob\",...}]"
  }
}
```

## Table Editing UI

### Layout
```
┌─ Table Editor ─────────────────────────────────────────────┐
│                                                             │
│ Column Headers (from template)                              │
│ ┌──────────────┬──────────────────┬──────────────┬─────┐    │
│ │ Name         │ Email            │ Phone        │ Del │    │
│ ├──────────────┼──────────────────┼──────────────┼─────┤    │
│ │ [Alice]      │ [alice@...]      │ [555-1111]   │  ✕  │    │
│ ├──────────────┼──────────────────┼──────────────┼─────┤    │
│ │ [Bob]        │ [bob@...]        │ [555-2222]   │  ✕  │    │
│ └──────────────┴──────────────────┴──────────────┴─────┘    │
│                                                             │
│ [+ Add Row]                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Table-Only Display
```javascript
// PlaceholderField now checks type
if (placeholder.type === "table") {
  return <TableField ... />
}
```

Tables **only appear** on slides that have them.

### Row Management
```javascript
// Add Row
handleAddRow() → Creates new object with all column keys

// Delete Row
handleDeleteRow(idx) → Filters out the row and updates state

// Edit Cell
handleCellChange(row, col, value) → Updates specific cell value
```

### Data Validation
- Ensures all rows have the same columns
- Preserves column structure when adding/removing rows
- Validates data before sending to backend

## Column Headers

Column headers are automatically extracted from the template:
- Header comes from the first row of the template table
- Passed to `TableField` via `columnHeaders` prop
- Used as object keys in the data structure

Example:
```
Template header row: ["Name", "Email", "Phone"]
↓
Data object keys: { "Name": "...", "Email": "...", "Phone": "..." }
```

## Error Handling

### Empty Table
If table has no data:
```
ℹ️ Click "Add Row" to add table data.
```

### Missing Column Headers
If no headers are provided:
```
⚠️ No column headers available for this table.
```

## Styling

Uses ShadCN components:
- `Button` - Add/Delete row actions
- `Input` - Cell editing
- Standard Tailwind classes for table structure
- Hover effects for better UX
- Focus states for accessibility

## Type Safety

All types are properly defined:
```typescript
type PresentationPlaceholder = {
  type: "table" | "paragraph" | "title" | ...
  value: string | Record<string, string>[] | string[]
  column_headers?: string[]
  paragraphs?: number
  columns?: number
}
```

## Limitations & Future Improvements

### Current Limitations
- No drag-and-drop row reordering
- No copy/paste between cells
- No undo/redo
- No cell validation (except max_chars)

### Potential Improvements
- Multi-cell selection
- Column width customization
- Cell formatting (bold, italic, color)
- Import/export CSV
- Auto-calculate columns (sum, count, etc.)

## Testing

To test:
1. Create a template with a table
2. Generate a presentation
3. In the editor, select the slide with the table
4. Edit cells, add rows, delete rows
5. Click "Update" to save

Table data should round-trip correctly and maintain formatting!
