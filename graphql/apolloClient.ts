import { ApolloClient, InMemoryCache } from '@apollo/client-integration-nextjs'
import { HttpLink } from '@apollo/client'

function getGraphQLUri(): string {
  // On Vercel, VERCEL_URL is the canonical deployment URL (no protocol)
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}/api/graphql`
  // Custom override
  if (process.env.NEXT_PUBLIC_GRAPHQL_URL) return process.env.NEXT_PUBLIC_GRAPHQL_URL
  // Local dev
  return 'http://localhost:3000/api/graphql'
}

/**
 * For Server Components: create a fresh ApolloClient per request.
 * Uses VERCEL_URL on Vercel, falls back to localhost for local dev.
 */
export function getClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: getGraphQLUri(),
    }),
  })
}
