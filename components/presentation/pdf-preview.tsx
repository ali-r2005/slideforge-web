"use client"

import { useEffect, useRef, useState } from "react"
import type { PDFDocumentProxy } from "pdfjs-dist"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  Loader2Icon,
  PanelLeftIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react"
import { Document, Page, pdfjs } from "react-pdf"

import { Button } from "@/components/ui/button"

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

type PdfPreviewProps = {
  fileName: string
  pdfUrl: string
  pageNumber?: number
  onPageChange?: (pageNumber: number) => void
}

export function PdfPreview({
  fileName,
  pdfUrl,
  pageNumber,
  onPageChange,
}: PdfPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [numPages, setNumPages] = useState(0)
  const [internalPageNumber, setInternalPageNumber] = useState(1)
  const [pageWidth, setPageWidth] = useState(720)
  const [scale, setScale] = useState(1)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)


  const visiblePageNumber = pageNumber ?? internalPageNumber
  const canGoBack = visiblePageNumber > 1
  const canGoForward = numPages > 0 && visiblePageNumber < numPages
  const renderedPageWidth = Math.round(pageWidth * scale)

  useEffect(() => {
    const previewElement = previewRef.current

    if (!previewElement) {
      return
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (!entry) {
        return
      }

      const nextWidth = Math.floor(entry.contentRect.width - 32)
      setPageWidth(Math.max(280, Math.min(nextWidth, 960)))
    })

    resizeObserver.observe(previewElement)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  function handleLoadSuccess(pdf: PDFDocumentProxy) {
    setNumPages(pdf.numPages)
    changePage(Math.min(Math.max(visiblePageNumber, 1), pdf.numPages))
  }

  function handlePreviousPage() {
    changePage(Math.max(1, visiblePageNumber - 1))
  }

  function handleNextPage() {
    changePage(
      numPages > 0 ? Math.min(numPages, visiblePageNumber + 1) : visiblePageNumber
    )
  }

  function changePage(nextPageNumber: number) {
    if (onPageChange) {
      onPageChange(nextPageNumber)
      return
    }

    setInternalPageNumber(nextPageNumber)
  }

  function handleZoomOut() {
    setScale((currentScale) => Math.max(0.75, currentScale - 0.25))
  }

  function handleZoomIn() {
    setScale((currentScale) => Math.min(1.75, currentScale + 0.25))
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted">
            <FileTextIcon className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold tracking-normal">
              PDF preview
            </h2>
            <p className="truncate text-sm text-muted-foreground">{fileName}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handlePreviousPage}
              disabled={!canGoBack}
            >
              <ChevronLeftIcon />
              Previous
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleNextPage}
              disabled={!canGoForward}
            >
              Next
              <ChevronRightIcon />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleZoomOut}
                disabled={scale <= 0.75}
              >
                <ZoomOutIcon />
                Zoom out
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleZoomIn}
                disabled={scale >= 1.75}
              >
                <ZoomInIcon />
                Zoom in
              </Button>
            </div>

            <Button
              type="button"
              size="sm"
              variant={isSidebarOpen ? "secondary" : "outline"}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex"
              title={isSidebarOpen ? "Hide thumbnails" : "Show thumbnails"}
            >
              <PanelLeftIcon className="size-4" />
            </Button>
          </div>

        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
        <span>
          Page {numPages > 0 ? visiblePageNumber : "-"} of {numPages || "-"}
        </span>
        <span>{Math.round(scale * 100)}%</span>
      </div>

      <div className="flex gap-4 overflow-hidden rounded-md border bg-muted p-4">
        {/* Thumbnails Sidebar */}
        {isSidebarOpen && (
          <aside className="hidden h-[70vh] w-48 shrink-0 flex-col gap-4 overflow-y-auto pr-2 md:flex">
          <Document
            file={pdfUrl}
            onLoadSuccess={handleLoadSuccess}
            loading={<div className="text-xs text-muted-foreground">Loading...</div>}
            className="flex flex-col gap-3"
          >
            {Array.from(new Array(numPages), (el, index) => (
              <div
                key={`thumb_${index + 1}`}
                onClick={() => changePage(index + 1)}
                className={`group relative cursor-pointer overflow-hidden rounded-md border-2 transition-all hover:border-primary/50 ${
                  visiblePageNumber === index + 1
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent"
                }`}
              >
                <Page
                  pageNumber={index + 1}
                  width={160}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  loading={<div className="h-24 w-full bg-muted animate-pulse" />}
                />
                <div className="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-sm bg-background/80 text-[10px] font-medium shadow-sm backdrop-blur-sm">
                  {index + 1}
                </div>
              </div>
            ))}
          </Document>
        </aside>
        )}

        {/* Main Preview Area */}
        <div
          ref={previewRef}
          className="h-[70vh] flex-1 overflow-auto rounded-md bg-zinc-200/50 p-4 dark:bg-zinc-900/50"
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={handleLoadSuccess}
            loading={<PdfLoadingMessage label="Loading PDF..." />}
            error={<PdfLoadingMessage label="Unable to load this PDF." />}
            noData={<PdfLoadingMessage label="No PDF selected." />}
            className="flex justify-center"
          >
            <Page
              pageNumber={visiblePageNumber}
              width={renderedPageWidth}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              loading={<PdfLoadingMessage label="Loading page..." />}
              className="overflow-hidden rounded-md bg-background shadow-lg"
            />
          </Document>
        </div>
      </div>

    </section>
  )
}

function PdfLoadingMessage({ label }: { label: string }) {
  return (
    <div className="flex min-h-80 items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2Icon className="size-4 animate-spin" />
      {label}
    </div>
  )
}
