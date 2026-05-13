"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { CheckIcon, DownloadIcon, Loader2Icon, SaveIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createApiFileUrl } from "@/lib/api-url"
import type {
  GeneratePresentationResponse,
  PresentationPlaceholder,
  PresentationSlideData,
} from "@/types/presentation"

type PresentationEditorWorkspaceProps = {
  presentation: GeneratePresentationResponse
}

type PresentationUpdatePayload = {
  presentation_data: PresentationSlideData[]
  pdf_url: string
  pptx_url: string
}

const PdfPreview = dynamic(
  () =>
    import("@/components/presentation/pdf-preview").then(
      (module) => module.PdfPreview
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[480px] items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground shadow-sm">
        <Loader2Icon className="mr-2 size-4 animate-spin" />
        Loading preview...
      </div>
    ),
  }
)

export function PresentationEditorWorkspace({
  presentation,
}: PresentationEditorWorkspaceProps) {
  const [slides, setSlides] = useState<PresentationSlideData[]>(() =>
    clonePresentationSlides(presentation.presentation_data)
  )
  const [selectedSlideNumber, setSelectedSlideNumber] = useState(
    slides[0]?.slide_number ?? 1
  )
  const [updateMessage, setUpdateMessage] = useState("")

  const selectedSlide = useMemo(
    () =>
      slides.find((slide) => slide.slide_number === selectedSlideNumber) ??
      slides[0],
    [selectedSlideNumber, slides]
  )

  const pdfUrl = useMemo(
    () => createApiFileUrl(presentation.pdf_url),
    [presentation.pdf_url]
  )
  const pptxUrl = useMemo(
    () => createApiFileUrl(presentation.pptx_url),
    [presentation.pptx_url]
  )

  function handleSlideSelect(slideNumber: string) {
    setSelectedSlideNumber(Number(slideNumber))
    setUpdateMessage("")
  }

  function handlePreviewPageChange(pageNumber: number) {
    const matchingSlide = slides.find(
      (slide) => slide.slide_number === pageNumber
    )

    if (matchingSlide) {
      setSelectedSlideNumber(matchingSlide.slide_number)
    }
  }

  function handlePlaceholderChange(
    placeholderToUpdate: PresentationPlaceholder,
    value: string
  ) {
    setUpdateMessage("")
    setSlides((currentSlides) =>
      currentSlides.map((slide) => {
        if (slide.slide_number !== placeholderToUpdate.slide_number) {
          return slide
        }

        return {
          ...slide,
          placeholders: slide.placeholders.map((placeholder) => {
            const isTargetPlaceholder =
              placeholder.placeholder === placeholderToUpdate.placeholder &&
              placeholder.shape_index === placeholderToUpdate.shape_index

            return isTargetPlaceholder ? { ...placeholder, value } : placeholder
          }),
        }
      })
    )
  }

  function handlePrepareUpdate() {
    const updatePayload = createPresentationUpdatePayload(
      slides,
      presentation.pdf_url,
      presentation.pptx_url
    )

    console.log("Presentation update payload:", updatePayload)
    setUpdateMessage("Changes are ready for the update action.")
  }

  return (
    <section className="grid w-full gap-6 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
      <div className="flex flex-col gap-5 rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-normal">
            Slide content
          </h2>
          <p className="text-sm text-muted-foreground">
            Edit the placeholder values for the selected slide.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="slide" className="text-sm font-medium">
            Slide
          </label>
          <Select
            value={String(selectedSlide?.slide_number ?? "")}
            onValueChange={handleSlideSelect}
          >
            <SelectTrigger id="slide">
              <SelectValue placeholder="Select slide" />
            </SelectTrigger>
            <SelectContent>
              {slides.map((slide) => (
                <SelectItem
                  key={slide.slide_number}
                  value={String(slide.slide_number)}
                >
                  Slide {slide.slide_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedSlide ? (
          <div className="flex flex-col gap-4">
            {selectedSlide.placeholders.map((placeholder) => (
              <PlaceholderField
                key={`${placeholder.placeholder}-${placeholder.shape_index}`}
                placeholder={placeholder}
                onChange={handlePlaceholderChange}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
            No slide data returned for editing.
          </p>
        )}

        <div className="flex flex-col gap-3 border-t pt-4">
          <Button type="button" onClick={handlePrepareUpdate}>
            <SaveIcon />
            Update
          </Button>

          {updateMessage ? (
            <p className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
              <CheckIcon className="size-4" />
              {updateMessage}
            </p>
          ) : null}

          <Button type="button" variant="outline" asChild>
            <a href={pptxUrl} download>
              <DownloadIcon />
              Download PPTX
            </a>
          </Button>
        </div>
      </div>

      <PdfPreview
        fileName={getFileNameFromUrl(presentation.pdf_url)}
        pdfUrl={pdfUrl}
        pageNumber={selectedSlide?.slide_number ?? 1}
        onPageChange={handlePreviewPageChange}
      />
    </section>
  )
}

function PlaceholderField({
  placeholder,
  onChange,
}: {
  placeholder: PresentationPlaceholder
  onChange: (placeholder: PresentationPlaceholder, value: string) => void
}) {
  const fieldId = `${placeholder.slide_number}-${placeholder.shape_index}-${placeholder.placeholder}`
  const label = formatPlaceholderLabel(placeholder.placeholder)
  const characterCount = placeholder.value.length

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={fieldId} className="text-sm font-medium">
          {label}
        </label>
        <span className="shrink-0 text-xs text-muted-foreground">
          {characterCount}/{placeholder.max_chars}
        </span>
      </div>

      {placeholder.type === "paragraph" ? (
        <Textarea
          id={fieldId}
          value={placeholder.value}
          maxLength={placeholder.max_chars}
          onChange={(event) => onChange(placeholder, event.target.value)}
          className="min-h-32 resize-y"
        />
      ) : (
        <Input
          id={fieldId}
          type="text"
          value={placeholder.value}
          maxLength={placeholder.max_chars}
          onChange={(event) => onChange(placeholder, event.target.value)}
        />
      )}
    </div>
  )
}

function clonePresentationSlides(slides: PresentationSlideData[]) {
  return slides.map((slide) => ({
    ...slide,
    placeholders: slide.placeholders.map((placeholder) => ({ ...placeholder })),
  }))
}

function createPresentationUpdatePayload(
  slides: PresentationSlideData[],
  pdfUrl: string,
  pptxUrl: string
): PresentationUpdatePayload {
  return {
    presentation_data: clonePresentationSlides(slides),
    pdf_url: pdfUrl,
    pptx_url: pptxUrl,
  }
}

function formatPlaceholderLabel(placeholder: string) {
  return placeholder
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function getFileNameFromUrl(fileUrl: string) {
  const [pathWithoutQuery] = fileUrl.split("?")
  const fileName = pathWithoutQuery.split("/").filter(Boolean).at(-1)

  return fileName ?? "presentation.pdf"
}
