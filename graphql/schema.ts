import { gql } from 'graphql-tag'

export const typeDefs = gql`
  scalar DateTime

  enum PropertyType {
    STUDIO
    ONE_ROOM
    TWO_ROOM
    OFFICE_TEL
  }

  type Address {
    full: String!
    dong: String!
    lat: Float!
    lng: Float!
  }

  type Photo {
    id: ID!
    url: String!
    uploadedAt: DateTime!
  }

  type ReviewRatings {
    noise: Int!
    pests: Int!
    winterCold: Int!
    summerHeat: Int!
    landlordResponse: Int!
    overallSatisfaction: Int!
  }

  type Review {
    id: ID!
    listingId: ID!
    tenancyPeriod: String!
    ratings: ReviewRatings!
    pros: String!
    cons: String!
    createdAt: DateTime!
  }

  type TrustSignal {
    label: String!
    passed: Boolean!
    points: Int!
  }

  type Broker {
    id: ID!
    name: String!
    phone: String
  }

  type Listing {
    id: ID!
    title: String!
    address: Address!
    price: Int!
    deposit: Int!
    propertyType: PropertyType!
    area: Float!
    floor: Int
    totalFloors: Int
    description: String
    photos: [Photo!]!
    reviews: [Review!]!
    trustScore: Float!
    trustSignals: [TrustSignal!]!
    broker: Broker
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ListingPage {
    listings: [Listing!]!
    totalCount: Int!
    hasNextPage: Boolean!
  }

  input ListingFilter {
    dong: String
    propertyType: PropertyType
    minPrice: Int
    maxPrice: Int
    minArea: Float
    trustScoreMin: Float
    keywords: String
  }

  type ParsedFilter {
    dong: String
    propertyType: PropertyType
    minPrice: Int
    maxPrice: Int
    minArea: Float
    trustScoreMin: Float
    keywords: String
  }

  type Query {
    listings(filter: ListingFilter, page: Int, perPage: Int): ListingPage!
    listing(id: ID!): Listing
    reviewSummary(listingId: ID!): String!
    parseSearchQuery(query: String!): ParsedFilter!
  }

  input CreateReviewInput {
    listingId: ID!
    tenancyStart: DateTime!
    tenancyEnd: DateTime!
    noise: Int!
    pests: Int!
    winterCold: Int!
    summerHeat: Int!
    landlordResponse: Int!
    overallSatisfaction: Int!
    pros: String!
    cons: String!
  }

  type Mutation {
    createReview(input: CreateReviewInput!): Review!
  }
`
