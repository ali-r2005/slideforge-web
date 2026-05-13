"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2Icon, PresentationIcon } from "lucide-react"

import { PresentationEditorWorkspace } from "@/components/presentation/presentation-editor-workspace"
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
import type {
  GeneratePresentationResponse,
  PresentationTemplate,
} from "@/types/presentation"

export function TemplateGeneratorForm() {
  const [templates, setTemplates] = useState<PresentationTemplate[]>([])
  const [templateName, setTemplateName] = useState("")
  const [prompt, setPrompt] = useState("")
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [generatedPresentation, setGeneratedPresentation] =
    useState<GeneratePresentationResponse | null>(null)

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canGenerate) {
      setErrorMessage("Choose a template and enter a prompt first.")
      return
    }

    try {
      setIsGenerating(true)
      setErrorMessage("")
      setGeneratedPresentation(null)

      const generatedPresentationResponse = await generatePresentation({
        template_name: templateName,
        prompt,
      })

      setGeneratedPresentation(generatedPresentationResponse)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex w-full max-w-7xl flex-col gap-6">
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
