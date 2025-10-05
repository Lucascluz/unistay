# System Architecture Diagram

## Database Schema Relationships

```
┌─────────────────┐
│     users       │
│─────────────────│
│ • id (PK)       │
│ • name          │
│ • email         │
│ • password_hash │
│ • created_at    │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐         ┌──────────────────────┐
│    reviews      │         │     companies        │
│─────────────────│         │──────────────────────│
│ • id (PK)       │         │ • id (PK)            │
│ • user_id (FK)  │         │ • name               │
│ • location      │         │ • email              │
│ • property      │         │ • password_hash      │
│ • rating        │         │ • company_type       │
│ • review        │         │ • verification_status│
│ • helpful       │         │ • verification_token │
└────────┬────────┘         │ • tax_id             │
         │                  │ • website            │
         │ 1:N              └──────┬───────────────┘
         │                         │
         │                         │ 1:N
         │                         ▼
         │              ┌─────────────────────────┐
         │              │ company_representatives │
         │              │─────────────────────────│
         │              │ • id (PK)               │
         │              │ • company_id (FK)       │
         │              │ • user_email            │
         │              │ • role                  │
         │              │ • is_primary            │
         │              │ • verified              │
         │              │ • verification_token    │
         │              └─────────────────────────┘
         │
         │
         ▼
┌────────────────────────────┐
│    review_responses        │
│────────────────────────────│
│ • id (PK)                  │
│ • review_id (FK)           │
│ • user_id (FK, nullable)   │◄──── From users (1:N)
│ • company_id (FK, nullable)│◄──── From companies (1:N)
│ • response_text            │
│ • is_company_response      │
│ • created_at               │
└────────────────────────────┘
Constraint: user_id XOR company_id
```

## Authentication Flow

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │
       │ POST /api/auth/register
       │ POST /api/auth/login
       ▼
┌──────────────────────┐
│   JWT Token          │
│   {                  │
│     userId: uuid,    │
│     type: 'user'     │
│   }                  │
└──────────────────────┘


┌─────────────┐
│   Company   │
└──────┬──────┘
       │
       │ POST /api/companies/register → pending
       │
       ▼
┌──────────────────────┐
│  Admin Verification  │
│  POST /api/admin/    │
│  companies/verify    │
└──────┬───────────────┘
       │
       │ Status: verified
       ▼
       │ POST /api/companies/login
       ▼
┌──────────────────────┐
│   JWT Token          │
│   {                  │
│     userId: uuid,    │
│     type: 'company'  │
│   }                  │
└──────────────────────┘
```

## Response Creation Flow

```
                    ┌──────────────┐
                    │    Review    │
                    └──────┬───────┘
                           │
             ┌─────────────┴─────────────┐
             │                           │
    ┌────────▼────────┐         ┌───────▼────────┐
    │   User wants    │         │  Company wants │
    │  to respond     │         │   to respond   │
    └────────┬────────┘         └───────┬────────┘
             │                          │
             │ Auth: User JWT           │ Auth: Company JWT
             │                          │
    POST /api/responses/user    POST /api/responses/company
             │                          │
             │                          │
             │                    ┌─────▼──────────┐
             │                    │ Check:         │
             │                    │ • Verified?    │
             │                    │ • Already      │
             │                    │   responded?   │
             │                    └─────┬──────────┘
             │                          │
             └─────────┬────────────────┘
                       │
                       ▼
            ┌──────────────────┐
            │ Create Response  │
            │ in database      │
            └──────────────────┘
```

## Representative Verification Flow

```
┌──────────────┐
│   Company    │
│  (verified)  │
└──────┬───────┘
       │
       │ POST /api/companies/representatives
       │ { userEmail, role }
       ▼
┌────────────────────────────┐
│  Create Representative     │
│  Generate verification     │
│  token                     │
└──────┬─────────────────────┘
       │
       │ Send email (production)
       │ or return token (dev)
       ▼
┌────────────────────────────┐
│  Representative receives   │
│  verification link/token   │
└──────┬─────────────────────┘
       │
       │ POST /api/companies/representatives/verify
       │ { token }
       ▼
┌────────────────────────────┐
│  Mark as verified          │
│  Representative can now    │
│  act on behalf of company  │
└────────────────────────────┘
```

## Admin Moderation System

```
┌──────────────────────┐
│  Admin Dashboard     │
│  (X-Admin-Key auth)  │
└──────────┬───────────┘
           │
           ├──► GET /api/admin/companies/pending
           │    └──► View pending companies
           │
           ├──► POST /api/admin/companies/verify
           │    └──► Approve/Reject companies
           │
           ├──► GET /api/admin/responses
           │    └──► View all responses
           │
           ├──► DELETE /api/admin/responses/:id
           │    └──► Remove inappropriate content
           │
           └──► GET /api/admin/stats
                └──► View system statistics
```

## API Layer Architecture

```
┌───────────────────────────────────────────────────┐
│                   Express Server                  │
├───────────────────────────────────────────────────┤
│                                                   │
│  ┌──────────────┐  ┌──────────────┐             │
│  │ Middleware   │  │ Middleware   │             │
│  │ • CORS       │  │ • JSON Body  │             │
│  │ • Logging    │  │ • Auth Check │             │
│  └──────────────┘  └──────────────┘             │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │           Route Handlers                    │ │
│  │                                             │ │
│  │  /api/auth          → User authentication  │ │
│  │  /api/companies     → Company management   │ │
│  │  /api/reviews       → Review CRUD          │ │
│  │  /api/responses     → Response system      │ │
│  │  /api/admin         → Admin operations     │ │
│  │  /api/locations     → Location search      │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │           Database Layer (PostgreSQL)       │ │
│  │                                             │ │
│  │  • users                                    │ │
│  │  • companies                                │ │
│  │  • company_representatives                  │ │
│  │  • reviews                                  │ │
│  │  • review_responses                         │ │
│  └─────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

## Security Layers

```
┌────────────────────────────────────┐
│   Request from Client              │
└───────────┬────────────────────────┘
            │
            ▼
┌────────────────────────────────────┐
│   Layer 1: Input Validation        │
│   • Zod schema validation          │
│   • Type checking                  │
│   • Length/format constraints      │
└───────────┬────────────────────────┘
            │
            ▼
┌────────────────────────────────────┐
│   Layer 2: Authentication          │
│   • JWT token verification         │
│   • Token type check (user/company)│
│   • Token expiration check         │
└───────────┬────────────────────────┘
            │
            ▼
┌────────────────────────────────────┐
│   Layer 3: Authorization           │
│   • Company verification status    │
│   • Representative verification    │
│   • Resource ownership check       │
│   • Admin key verification         │
└───────────┬────────────────────────┘
            │
            ▼
┌────────────────────────────────────┐
│   Layer 4: Database Constraints    │
│   • Foreign key constraints        │
│   • Check constraints              │
│   • Unique constraints             │
│   • XOR constraints (responses)    │
└───────────┬────────────────────────┘
            │
            ▼
┌────────────────────────────────────┐
│   Successful Operation             │
└────────────────────────────────────┘
```

## Data Access Patterns

```
GET /api/reviews?includeResponses=true
│
├─► Query reviews table
│   └─► Filter by location, sort, paginate
│
└─► For each review:
    └─► Query review_responses table
        ├─► Join with users (if user_id)
        │   └─► Get user name
        │
        └─► Join with companies (if company_id)
            └─► Get company name & type
```

## Verification State Machine

```
Company Registration:
┌─────────┐  register  ┌─────────┐  admin     ┌──────────┐
│  None   │ ────────► │ Pending │ ────────► │ Verified │
└─────────┘            └────┬────┘  approve   └────┬─────┘
                            │                      │
                            │ admin reject         │ can login
                            ▼                      │ can respond
                       ┌──────────┐                │
                       │ Rejected │                ▼
                       └──────────┘         ┌──────────────┐
                                            │ Full Access  │
                                            └──────────────┘

Representative Verification:
┌─────────┐  add email  ┌────────────┐  verify  ┌──────────┐
│  None   │ ─────────► │ Unverified │ ──────► │ Verified │
└─────────┘             └────────────┘          └────┬─────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │ Can Respond  │
                                              │ for Company  │
                                              └──────────────┘
```
