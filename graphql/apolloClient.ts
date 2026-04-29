import { ApolloClient, InMemoryCache } from '@apollo/client-integration-nextjs'
import { HttpLink } from '@apollo/client'

/**
 * For Server Components: create a fresh ApolloClient per request.
 * No caching across requests — each SSR render fetches fresh data.
 */
export function getClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:3000/api/graphql',
    }),
  })
}
