import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { typeDefs } from '../../../graphql/schema'
import { listingResolvers } from '../../../graphql/resolvers/listing'
import { reviewResolvers } from '../../../graphql/resolvers/review'
import { aiResolvers } from '../../../graphql/resolvers/ai'
import { DateTimeResolver } from 'graphql-scalars'
import { NextRequest } from 'next/server'

if (!process.env.OPENAI_API_KEY) {
  console.warn('WARNING: OPENAI_API_KEY is not set. AI features will fail.')
}
if (!process.env.DATABASE_URL) {
  throw new Error('FATAL: DATABASE_URL is not set.')
}

const resolvers = {
  DateTime: DateTimeResolver,
  Query: {
    ...listingResolvers.Query,
    ...aiResolvers.Query,
  },
  Mutation: {
    ...reviewResolvers.Mutation,
  },
}

const schema = makeExecutableSchema({ typeDefs, resolvers })

const server = new ApolloServer({ schema })

const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => ({ req }),
})

export async function GET(request: NextRequest) {
  return handler(request)
}

export async function POST(request: NextRequest) {
  return handler(request)
}
