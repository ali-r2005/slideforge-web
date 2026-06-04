# Dynamic Table Implementation - Frontend

This document explains how the frontend implements schema-driven table row generation.

## Overview

The frontend now supports three table row generation strategies:

1. **Date Range** (`type: "date_range"`) — Auto-generates rows from date range
2. **User Provided** (`type: "user_provided"`) — User controls rows
3. **Fixed** (`type: "fixed"`) — Fixed number of pre-defined rows

## Architecture

### Component Structure

```
schema-form.tsx (FormField component)
    └─> DynamicTableField.tsx
        ├─> DateRangeTable (for date_range)
        ├─> UserProvidedTable (for user_provided)
        └─> FixedTable (for fixed)
                ├─> TableCellHandler (for cell_structure)
                └─> textarea (for plain text)
```

### Data Flow

```
Schema (with row_source)
    ↓
useSchema hook (loads schema from API)
    ↓
schema-form.tsx (renders FormField)
    ↓
DynamicTableField (detects row_source.type)
    ↓
Appropriate Table Component (DateRange/UserProvided/Fixed)
    ↓
Form Data (sent to backend)
```

## Component Details

### DynamicTableField

**File:** `components/presentation/DynamicTableField.tsx`

Main router component that:
- Receives schema field with `row_source` configuration
- Detects `row_source.type`
- Renders appropriate sub-component

```tsx
<DynamicTableField
  field={field}                // SchemaField with row_source
  value={tableData}            // Current table data (array of rows)
  formData={allFormData}       // All form data (needed for date_range)
  onChange={handleTableChange} // Callback when table data changes
/>
```

### DateRangeTable

Handles automatic row generation based on date range.

**Behavior:**
- Reads `formData[start_field]` and `formData[end_field]`
- Generates one row per day between dates
- Each row has `date: "YYYY-MM-DD"` key
- Preserves existing data when date range changes
- Supports row height resizing with mouse drag

**Example Schema:**
```json
{
  "name": "program_schedule",
  "type": "table",
  "row_source": {
    "type": "date_range",
    "config": {
      "start_field": "event_start_date",
      "end_field": "event_end_date"
    }
  },
  "columns": ["Matinée", "Midi", "Après-midi", "Soir"]
}
```

**Generated Data:**
```json
[
  {
    "date": "2025-06-01",
    "Matinée": { ... },
    "Midi": { ... },
    ...
  },
  {
    "date": "2025-06-02",
    "date": "2025-06-01",
    "Matinée": { ... },
    ...
  }
]
```

### UserProvidedTable

Lets users control the number of rows.

**Behavior:**
- Shows "Add Row" button
- Each row has "Delete" button
- No automatic row generation
- No date field required

**Example Schema:**
```json
{
  "name": "team_members",
  "type": "table",
  "row_source": {
    "type": "user_provided"
  },
  "columns": ["Name", "Email", "Role"]
}
```

**User Actions:**
- Click "Add Row" → New empty row appears
- Click trash icon → Delete that row

**Generated Data:**
```json
[
  {
    "Name": { ... },
    "Email": { ... },
    "Role": { ... }
  },
  {
    "Name": { ... },
    "Email": { ... },
    "Role": { ... }
  }
]
```

### FixedTable

Shows a fixed number of pre-defined rows.

**Behavior:**
- Shows exactly `config.count` rows
- No add/delete buttons
- Row numbers shown in first column

**Example Schema:**
```json
{
  "name": "department_summary",
  "type": "table",
  "row_source": {
    "type": "fixed",
    "config": {
      "count": 5
    }
  },
  "columns": ["Department", "Budget", "Status"]
}
```

**Generated Data:**
```json
[
  {
    "row_number": 1,
    "Department": { ... },
    "Budget": { ... },
    "Status": { ... }
  },
  ...5 rows total...
]
```

## Cell Structure Support

All table types support `cell_structure` for complex cell content:

```json
{
  "cell_structure": {
    "draggable": true,
    "parts": [
      { "name": "context", "type": "array-textarea", "label": "Context" },
      { "name": "activity", "type": "text", "label": "Activity" }
    ]
  }
}
```

When cell_structure is present:
- Cells render as `<TableCellHandler>` (complex editor)
- Cell data is an object with part names as keys

When cell_structure is absent:
- Cells render as simple `<textarea>` (plain text)
- Cell data is a string

## Type Definitions

### RowSource (in `hooks/useSchema.ts`)
```typescript
export interface RowSource {
  type: "date_range" | "user_provided" | "fixed"
  config?: Record<string, any>
}
```

### SchemaField (in `hooks/useSchema.ts`)
```typescript
export interface SchemaField {
  name: string
  type: "text" | "textarea" | ... | "table"
  row_source?: RowSource      // NEW: Schema-driven row config
  date_range_start_field?: string  // LEGACY: Still supported for backward compatibility
  date_range_end_field?: string    // LEGACY: Still supported for backward compatibility
  columns?: string[]
  cell_structure?: CellStructure
}
```

## Migration from Old Format

**Old hardcoded approach:**
```tsx
// Before: hardcoded date_range
<ProgramTable
  field={field}
  value={tableData}
  schema={schema}
  formData={formData}
  onChange={handleChange}
/>
```

**New schema-driven approach:**
```tsx
// After: flexible based on row_source
<DynamicTableField
  field={field}
  value={tableData}
  formData={formData}
  onChange={handleChange}
/>
```

The new component automatically detects row_source and renders the appropriate UI.

## Integration with Schema Form

The `schema-form.tsx` component automatically uses `DynamicTableField` when it encounters:
- `field.type === "table"` OR
- `field.cell_structure !== undefined`

No special handling needed — just define `row_source` in the schema!

## Adding Support for New Row Source Types

To add a new row source type:

1. **Add type to `RowSource` interface** in `hooks/useSchema.ts`
2. **Create new table component** in `DynamicTableField.tsx`
3. **Add case to router** in `DynamicTableField` main switch statement

Example:
```tsx
// In DynamicTableField.tsx
case "data_source":
  return (
    <DataSourceTable
      field={field}
      value={value}
      onChange={onChange}
      columns={columns}
      hasCellStructure={hasCellStructure}
    />
  )
```

## Testing

Test scenarios:

- [ ] Date range table generates rows correctly when dates change
- [ ] Date range table preserves data when date range shifts
- [ ] User-provided table adds/deletes rows correctly
- [ ] Fixed table shows exactly N rows on load
- [ ] Cell structure cells render (TableCellHandler) when present
- [ ] Plain text cells render as textarea when cell_structure absent
- [ ] Form data sent to backend has correct structure
- [ ] All row_source types work with and without cell_structure

## Files Modified

- `components/presentation/DynamicTableField.tsx` ✨ NEW
- `components/presentation/schema-form.tsx` — Updated to use DynamicTableField
- `hooks/useSchema.ts` — Added RowSource interface

## Files Kept for Reference (Legacy)

- `components/presentation/ProgramTableCell.tsx` — Can be removed after migration
