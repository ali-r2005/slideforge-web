import { TemplateGeneratorForm } from "@/components/presentation/template-generator-form"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-12 font-sans dark:bg-black sm:px-6">
      <main className="flex w-full flex-1 items-start justify-center">
        <TemplateGeneratorForm />
      </main>
    </div>
  )
}
