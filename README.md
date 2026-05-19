# AtomQuest Goals

A comprehensive goal management and tracking system built with Next.js, MongoDB, and AI-powered insights.

## Overview

AtomQuest Goals is an enterprise-grade OKR (Objectives and Key Results) management platform that enables organizations to set, track, and evaluate employee goals through quarterly cycles. The system provides role-based access control, automated escalations, AI-powered goal quality analysis, and comprehensive reporting capabilities.

## Features

### Goal Management
- **Goal Sheet Creation**: Employees can create goal sheets with up to 8 goals per quarter
- **Weightage Allocation**: Goals are weighted (total must equal 100%) to prioritize objectives
- **Multiple UoM Types**: Support for numeric (min/max), timeline, and zero-based measurement types
- **Goal Sharing**: Managers can create shared goals that cascade to multiple employees
- **Draft & Submit**: Goals can be saved as drafts and submitted for manager approval

### Check-In System
- **Quarterly Check-Ins**: Employees update progress for each goal on a quarterly basis
- **Progress Scoring**: Automatic calculation of progress scores based on UoM type
- **AI-Generated Summaries**: Cerebras AI generates constructive check-in comments
- **Manager Reviews**: Managers can review and provide feedback on check-ins

### Approval Workflow
- **Manager Approval**: Managers review and approve goal sheets
- **Return for Changes**: Goal sheets can be returned to employees for modifications
- **Locking Mechanism**: Approved sheets can be locked to prevent further changes
- **Audit Trail**: Complete audit log of all changes and approvals

### Escalation System
- **Automated Escalations**: Configurable rules for missed deadlines
- **Multi-Level Notifications**: Escalations to employee, manager, skip-level, and HR
- **Custom Triggers**: Support for goal submission, approval, and check-in deadlines
- **Escalation Tracking**: Log of all escalation events and notification status

### Reporting & Analytics
- **Completion Reports**: Track goal completion rates across the organization
- **Progress Visualization**: Dashboard charts showing goal progress
- **Audit Logs**: Detailed history of all system changes
- **Export Capabilities**: Export data for external analysis

### AI Integration
- **Goal Quality Analysis**: AI evaluates goals against SMART criteria
- **Check-In Summaries**: AI generates empathetic, constructive feedback
- **Quality Scoring**: 1-10 scoring system with strengths and suggestions

## Tech Stack

### Frontend
- **Next.js 16**: React framework with App Router
- **React 19**: UI library
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Recharts**: Data visualization charts
- **Sonner**: Toast notifications

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **NextAuth v5**: Authentication with Google OAuth and Credentials
- **MongoDB**: NoSQL database
- **Mongoose**: ODM for MongoDB

### AI Services
- **Cerebras AI**: Goal quality analysis and check-in summaries

### Development Tools
- **ESLint**: Code linting
- **TypeScript**: Static type checking
- **Zod**: Schema validation

## Project Structure

```
atomquest-goals/
├── app/
│   ├── (auth)/              # Authentication pages (login, register)
│   ├── (dashboard)/         # Dashboard layout and pages
│   │   ├── admin/          # Admin features (users, cycles, reports, escalations)
│   │   ├── employee/       # Employee features (goals, check-ins, progress)
│   │   ├── manager/        # Manager features (approvals, team goals)
│   │   └── layout.tsx      # Dashboard layout with sidebar
│   ├── api/                # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── employee/      # Employee-specific endpoints
│   │   ├── manager/       # Manager-specific endpoints
│   │   └── admin/         # Admin-specific endpoints
│   ├── error.tsx          # Error boundary
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/
│   ├── dashboard/         # Dashboard-specific components
│   ├── goals/            # Goal-related components
│   ├── notifications/    # Notification components
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── auth/             # Authentication utilities
│   ├── cerebras/         # AI integration
│   ├── db/               # Database utilities
│   ├── models/           # Mongoose models
│   └── utils/            # Utility functions
├── types/                # TypeScript type definitions
├── .env.local           # Environment variables (not committed)
├── middleware.ts        # Next.js middleware for auth
├── next.config.ts       # Next.js configuration
├── tailwind.config.ts   # Tailwind CSS configuration
└── package.json         # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 20+ 
- MongoDB instance (local or cloud)
- Cerebras API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd atomquest-goals
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/atomquest-goals

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cerebras AI (optional, for AI features)
CEREBRAS_API_KEY=your-cerebras-api-key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## User Roles

### Employee
- Create and manage personal goal sheets
- Submit goals for manager approval
- Complete quarterly check-ins
- View personal progress and reports

### Manager
- Review and approve employee goal sheets
- Provide feedback on check-ins
- Create shared goals for team members
- View team progress and analytics
- Manage team escalations

### Admin
- Manage user accounts and roles
- Create and manage goal cycles
- Configure escalation rules
- View organization-wide reports
- Manage shared goals
- Access audit logs

## Goal Cycle Workflow

1. **Cycle Creation**: Admin creates a new goal cycle with quarterly dates
2. **Goal Setting**: Employees create goal sheets during the open phase
3. **Submission**: Employees submit goals for manager approval
4. **Approval**: Managers review and approve or return goal sheets
5. **Check-Ins**: Employees update progress each quarter
6. **Reviews**: Managers review check-ins and provide feedback
7. **Completion**: Goals are marked complete at cycle end

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth handlers

### Employee
- `GET /api/employee/checkin` - Get check-in data
- `POST /api/employee/checkin` - Save check-in progress
- `GET /api/goals/sheet` - Get goal sheet
- `POST /api/goals/sheet` - Create/update goal sheet
- `POST /api/goals/sheet/submit` - Submit goal sheet for approval

### Manager
- `GET /api/manager/approvals` - Get pending approvals
- `POST /api/manager/approve` - Approve goal sheet
- `POST /api/manager/return` - Return goal sheet for changes

### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/[id]` - Update user
- `GET /api/admin/cycles` - List goal cycles
- `POST /api/admin/cycles` - Create goal cycle
- `GET /api/admin/reports` - Get analytics reports

## Database Models

### User
- Personal information (name, email, employee ID)
- Role (employee, manager, admin)
- Manager assignment
- Department
- Authentication provider

### GoalCycle
- Cycle name and year
- Phase and quarter open dates
- Active status
- Creator reference

### GoalSheet
- Employee and cycle references
- Status (draft, submitted, approved, returned, locked)
- Goals array with achievements
- Manager comments
- Timestamps for submission/approval/lock

### GoalItem
- Thrust area, title, description
- UoM type and target
- Weightage percentage
- Shared goal reference
- Quarterly achievements
- Status tracking

### CheckIn
- Goal sheet and quarter reference
- Manager and employee references
- Check-in date
- Manager comments

### EscalationRule
- Trigger type (goal submission, approval, check-in)
- Days after trigger
- Notification recipients
- Active status

### EscalationLog
- Rule and user references
- Trigger type
- Days since trigger
- Notification status
- Timestamps

### AuditLog
- Entity type and ID
- Change type
- Changed by user
- Previous and new values
- Reason
- Timestamp

### Notification
- User reference
- Type (escalation, system)
- Title and message
- Related entity reference
- Read status

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `NEXTAUTH_SECRET` | Secret key for NextAuth | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Optional |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | Optional |
| `CEREBRAS_API_KEY` | Cerebras AI API key | Optional |

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Security Considerations

- Passwords are hashed using bcrypt with salt rounds of 12
- Password field is excluded from queries by default
- Role-based access control enforced at API level
- Middleware protects routes based on authentication and roles
- Audit logs track all sensitive operations
- Environment variables for sensitive configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is private and proprietary.

## Support

For support and questions, please contact the development team.
