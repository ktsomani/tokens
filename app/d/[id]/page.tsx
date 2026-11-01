import { notFound } from 'next/navigation'
import { readClient } from '@/lib/supabase/server'
import { TokensSchema } from '@/lib/tokens/schema'
import { SharedStudio } from './SharedStudio'

export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }

export async function generateMetadata({ params }: Params) {
  return { title: `Tokens — shared design ${params.id}`, robots: { index: false } }
}

export default async function SharedDesignPage({ params }: Params) {
  const supabase = readClient()
  if (!supabase) notFound()

  // Reads go through designs_public, which does not expose edit_token.
  const { data, error } = await supabase
    .from('designs_public')
    .select('id, title, tokens, components')
    .eq('id', params.id)
    .maybeSingle()

  if (error || !data) notFound()

  // Stored rows are user content, so they are revalidated on the way out,
  // not trusted because they came from our own database.
  const tokens = TokensSchema.safeParse(data.tokens)
  if (!tokens.success) notFound()

  return (
    <SharedStudio
      id={data.id}
      tokens={tokens.data}
      components={Array.isArray(data.components) ? data.components : []}
    />
  )
}
