"use client"

import { useEffect, useRef, useState } from "react"
import type { PDFDocumentProxy } from "pdfjs-dist"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileTextIcon,
  Loader2Icon,
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
  onDownload: () => void
}

export function PdfPreview({ fileName, pdfUrl, onDownload }: PdfPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageWidth, setPageWidth] = useState(720)
  const [scale, setScale] = useState(1)

  const canGoBack = pageNumber > 1
  const canGoForward = numPages > 0 && pageNumber < numPages
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
    setPageNumber(1)
  }

  function handlePreviousPage() {
    setPageNumber((currentPageNumber) => Math.max(1, currentPageNumber - 1))
  }

  function handleNextPage() {
    setPageNumber((currentPageNumber) =>
      numPages > 0 ? Math.min(numPages, currentPageNumber + 1) : currentPageNumber
    )
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
            variant="outline"
            onClick={onDownload}
            className="w-full sm:w-fit"
          >
            <DownloadIcon />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
        <span>
          Page {numPages > 0 ? pageNumber : "-"} of {numPages || "-"}
        </span>
        <span>{Math.round(scale * 100)}%</span>
      </div>

      <div
        ref={previewRef}
        className="h-[70vh] min-h-[480px] overflow-auto rounded-md border bg-muted p-4"
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
            pageNumber={pageNumber}
            width={renderedPageWidth}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            loading={<PdfLoadingMessage label="Loading page..." />}
            className="overflow-hidden rounded-md bg-background shadow-sm"
          />
        </Document>
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
