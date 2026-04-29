'use client'

import { ApolloNextAppProvider } from '@apollo/client-integration-nextjs'
import { ApolloClient, InMemoryCache } from '@apollo/client-integration-nextjs'
import { HttpLink } from '@apollo/client'

function makeClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({ uri: '/api/graphql' }),
  })
}

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  )
}
