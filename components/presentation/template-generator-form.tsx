"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { Loader2Icon, PresentationIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  generatePresentation,
  getTemplates,
} from "@/services/presentation.service"
import type { PresentationTemplate } from "@/types/presentation"

type GeneratedPdfPreview = {
  blob: Blob
  fileName: string
  url: string
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

export function TemplateGeneratorForm() {
  const [templates, setTemplates] = useState<PresentationTemplate[]>([])
  const [templateName, setTemplateName] = useState("")
  const [prompt, setPrompt] = useState("")
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [generatedPdfPreview, setGeneratedPdfPreview] =
    useState<GeneratedPdfPreview | null>(null)
  const generatedPdfUrlRef = useRef<string | null>(null)

  const canGenerate = useMemo(
    () => templateName.trim().length > 0 && prompt.trim().length > 0,
    [prompt, templateName]
  )

  useEffect(() => {
    let isMounted = true

    async function loadTemplates() {
      try {
        setErrorMessage("")
        const availableTemplates = await getTemplates()

        if (!isMounted) {
          return
        }

        setTemplates(availableTemplates)

        if (availableTemplates.length > 0) {
          setTemplateName(availableTemplates[0].name)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(getErrorMessage(error))
        }
      } finally {
        if (isMounted) {
          setIsLoadingTemplates(false)
        }
      }
    }

    loadTemplates()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    return () => {
      revokePdfUrl(generatedPdfUrlRef.current)
    }
  }, [])

  function replaceGeneratedPdfPreview(preview: GeneratedPdfPreview | null) {
    revokePdfUrl(generatedPdfUrlRef.current)
    generatedPdfUrlRef.current = preview?.url ?? null
    setGeneratedPdfPreview(preview)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canGenerate) {
      setErrorMessage("Choose a template and enter a prompt first.")
      return
    }

    try {
      setIsGenerating(true)
      setErrorMessage("")
      replaceGeneratedPdfPreview(null)

      const pdfBlob = await generatePresentation({
        template_name: templateName,
        prompt,
      })

      replaceGeneratedPdfPreview({
        blob: pdfBlob,
        fileName: createPdfFileName(templateName),
        url: URL.createObjectURL(pdfBlob),
      })
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsGenerating(false)
    }
  }

  function handleDownload() {
    if (!generatedPdfPreview) {
      return
    }

    downloadPdf(generatedPdfPreview.blob, generatedPdfPreview.fileName)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-5xl flex-col gap-6"
    >
      <div className="flex flex-col gap-6 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-normal">
            Generate presentation
          </h1>
          <p className="text-sm text-muted-foreground">
            Choose a template and describe the presentation you want to create.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="template" className="text-sm font-medium">
            Template
          </label>
          <Select
            value={templateName}
            onValueChange={setTemplateName}
            disabled={
              isLoadingTemplates || isGenerating || templates.length === 0
            }
          >
            <SelectTrigger id="template">
              <SelectValue
                placeholder={
                  isLoadingTemplates ? "Loading templates..." : "Select template"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.filename} value={template.name}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="prompt" className="text-sm font-medium">
            Prompt
          </label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            disabled={isGenerating}
            placeholder="Describe the deck content, audience, tone, and key points."
            className="min-h-36 resize-y"
          />
        </div>

        {errorMessage ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="submit"
            size="lg"
            disabled={!canGenerate || isLoadingTemplates || isGenerating}
            className="w-full sm:w-fit"
          >
            {isGenerating ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <PresentationIcon />
            )}
            {isGenerating ? "Generating..." : "Generate PDF"}
          </Button>
        </div>
      </div>

      {generatedPdfPreview ? (
        <PdfPreview
          fileName={generatedPdfPreview.fileName}
          pdfUrl={generatedPdfPreview.url}
          onDownload={handleDownload}
        />
      ) : null}
    </form>
  )
}

function createPdfFileName(templateName: string) {
  const safeTemplateName = templateName.trim() || "presentation"

  return `${safeTemplateName}.pdf`
}

function revokePdfUrl(url: string | null) {
  if (url) {
    URL.revokeObjectURL(url)
  }
}

function downloadPdf(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "Something went wrong. Please try again."
}
