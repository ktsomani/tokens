/** A live showcase of the design system. */
export const WELCOME_COMPONENT = {
  name: 'TokenShowcase',
  description: 'Live preview of components driven by your tokens.',
  code: `function TokenShowcase() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl p-8">
      
      {/* Typography */}
      <div className="space-y-2">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Typography</p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Display Heading</h1>
        <h2 className="text-2xl font-semibold text-foreground">Section Heading</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This is body text. It uses the muted foreground token. Change the type scale or base font size in the right panel and watch this text resize fluidly.
        </p>
      </div>

      {/* Buttons */}
      <div className="space-y-2">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Buttons</p>
        <div className="flex flex-wrap items-center gap-3">
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90">
            Primary Action
          </button>
          <button className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:opacity-90">
            Secondary
          </button>
          <button className="rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
            Outline
          </button>
        </div>
      </div>

      {/* Form / Card */}
      <div className="space-y-2">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Card & Input</p>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-card-foreground">Create an account</h3>
          <p className="text-sm text-muted-foreground mb-4">Enter your email to get started.</p>
          
          <div className="space-y-3">
            <input 
              type="email" 
              placeholder="you@example.com" 
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90">
              Submit
            </button>
          </div>
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-2">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Tokens</p>
        <div className="flex gap-2">
          <div className="h-10 flex-1 rounded-md bg-primary ring-1 ring-inset ring-black/10" title="Primary" />
          <div className="h-10 flex-1 rounded-md bg-secondary ring-1 ring-inset ring-black/10" title="Secondary" />
          <div className="h-10 flex-1 rounded-md bg-accent ring-1 ring-inset ring-black/10" title="Accent" />
          <div className="h-10 flex-1 rounded-md bg-destructive ring-1 ring-inset ring-black/10" title="Destructive" />
          <div className="h-10 flex-1 rounded-md bg-muted ring-1 ring-inset ring-black/10" title="Muted" />
        </div>
      </div>

    </div>
  )
}`,
  a11yNotes: [],
}