"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2Icon, PresentationIcon } from "lucide-react"

import { PresentationEditorWorkspace } from "@/components/presentation/presentation-editor-workspace"
import { SchemaForm } from "@/components/presentation/schema-form"
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
import { useSchema } from "@/hooks/useSchema"
import type {
  GeneratePresentationResponse,
  PresentationTemplate,
} from "@/types/presentation"

export function TemplateGeneratorForm() {
  const [templates, setTemplates] = useState<PresentationTemplate[]>([])
  const [templateName, setTemplateName] = useState("")
  const [prompt, setPrompt] = useState("")
  const [formData, setFormData] = useState<Record<string, string | number | boolean>>({})
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [generatedPresentation, setGeneratedPresentation] =
    useState<GeneratePresentationResponse | null>(null)

  const { schema, hasSchema, isLoading: isLoadingSchema } = useSchema(templateName)

  const canGenerate = useMemo(
    () => {
      if (templateName.trim().length === 0) return false
      // If template has schema, form_data must have at least one field
      if (hasSchema) return Object.keys(formData).length > 0
      // If no schema, prompt is required
      return prompt.trim().length > 0
    },
    [prompt, templateName, hasSchema, formData]
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

  // Reset form data when template changes
  useEffect(() => {
    setFormData({})
    setPrompt("")
  }, [templateName])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canGenerate) {
      if (hasSchema) {
        setErrorMessage("Please fill in the required form fields.")
      } else {
        setErrorMessage("Choose a template and enter a prompt first.")
      }
      return
    }

    try {
      setIsGenerating(true)
      setErrorMessage("")
      setGeneratedPresentation(null)

      const payload: Parameters<typeof generatePresentation>[0] = {
        template_name: templateName,
      }

      if (hasSchema) {
        payload.form_data = formData
      } else {
        payload.prompt = prompt
      }

      const generatedPresentationResponse = await generatePresentation(payload)

      setGeneratedPresentation(generatedPresentationResponse)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex w-full max-w-full flex-col gap-6">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-normal">
            Generate presentation
          </h1>
          <p className="text-sm text-muted-foreground">
            Choose a template and describe the presentation you want to create.
          </p>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-medium">
            Select Template
          </label>
          
          {isLoadingTemplates ? (
            <div className="flex h-48 items-center justify-center rounded-md border border-dashed">
              <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading templates...</span>
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              No templates found. Please add .pptx files to the templates folder.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {templates.map((template) => {
                const isSelected = templateName === template.name
                const thumbnailUrl = template.thumbnail_url 
                  ? `${process.env.NEXT_PUBLIC_API_URL}${template.thumbnail_url}`
                  : null

                return (
                  <button
                    key={template.filename}
                    type="button"
                    onClick={() => setTemplateName(template.name)}
                    className={`group relative flex flex-col overflow-hidden rounded-lg border text-left transition-all hover:border-primary/50 hover:shadow-md ${
                      isSelected 
                        ? "border-primary ring-2 ring-primary/20" 
                        : "border-border"
                    }`}
                  >
                    <div className="aspect-[16/10] w-full bg-muted">
                      {thumbnailUrl ? (
                        <img 
                          src={thumbnailUrl} 
                          alt={template.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <PresentationIcon className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className={`text-sm font-medium truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                        {template.name}
                      </h3>
                    </div>
                    {isSelected && (
                      <div className="absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground shadow-sm">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {templateName && isLoadingSchema ? (
          <div className="flex items-center justify-center p-4">
            <Loader2Icon className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading template settings...</span>
          </div>
        ) : hasSchema && schema ? (
          <>
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Template Settings</h3>
              <SchemaForm
                schema={schema}
                onDataChange={setFormData}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="prompt" className="text-sm font-medium text-muted-foreground">
                Additional Context (Optional)
              </label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                disabled={isGenerating}
                placeholder="Add any additional context or instructions for the presentation..."
                className="min-h-24 resize-y"
              />
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <label htmlFor="prompt" className="text-sm font-medium">
              Presentation Topic
            </label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              disabled={isGenerating}
              placeholder="e.g., A sales pitch for a new AI startup, focused on investors."
              className="min-h-36 resize-y"
            />
          </div>
        )}


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
            {isGenerating ? "Generating..." : "Generate presentation"}
          </Button>
        </div>
      </form>

      {generatedPresentation ? (
        <PresentationEditorWorkspace presentation={generatedPresentation} />
      ) : null}
    </div>
  )
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "Something went wrong. Please try again."
}
