/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from 'next'

import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap.js'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

// Nota: aggiunta manuale rispetto al file generato da Payload (vedi header sopra).
// L'admin CMS non deve essere indicizzato da Google (vedi app/(frontend)/mockups/layout.tsx
// per lo stesso pattern usato altrove sul sito). Non si può usare un export statico
// `metadata` in questo file perché coesiste già con `generateMetadata` (Next.js vieta
// entrambi nello stesso segmento), quindi il flag robots viene unito al risultato qui.
export const generateMetadata = async ({ params, searchParams }: Args): Promise<Metadata> => {
  const metadata = await generatePageMetadata({ config, params, searchParams })
  return { ...metadata, robots: { index: false, follow: false } }
}

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config, params, searchParams, importMap })

export default Page
