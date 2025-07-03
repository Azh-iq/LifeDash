# Task List Management Patterns

## Markdown Task List Structure

### Basic Task List File Template

```markdown
# Feature Name Implementation

Brief description of what this feature does and its purpose in the application.

## Completed Tasks

- [x] Task that has been finished
- [x] Another completed task with specific details

## In Progress Tasks

- [ ] Task currently being worked on
- [ ] Task that is partially complete

## Future Tasks

- [ ] Task planned for later implementation
- [ ] Another planned task with requirements

## Implementation Plan

Detailed description of the implementation approach, architecture decisions, and technical requirements.

### Technical Requirements

- List of technologies needed
- Dependencies and integrations
- Performance considerations

### Relevant Files

- `path/to/file1.ts` - ✅ Description of what this file does
- `path/to/file2.tsx` - 🚧 Component for feature X (in progress)
- `path/to/file3.sql` - 📋 Database migration for feature Y (planned)
```

### Task List Update Examples

#### Moving Tasks Between Sections

```markdown
<!-- Before: Task in progress -->

## In Progress Tasks

- [ ] Implement user authentication
- [ ] Set up database schema

## Future Tasks

- [ ] Create dashboard components

<!-- After: Task completed and new task started -->

## Completed Tasks

- [x] Implement user authentication

## In Progress Tasks

- [ ] Set up database schema
- [ ] Create dashboard components

## Future Tasks

(empty - all tasks moved to in progress)
```

#### Adding Discovered Tasks

```markdown
<!-- Original tasks -->

## In Progress Tasks

- [ ] Create user profile component

## Future Tasks

- [ ] Add user settings page

<!-- After discovering additional requirements -->

## In Progress Tasks

- [ ] Create user profile component

## Future Tasks

- [ ] Add user settings page
- [ ] Implement profile image upload (discovered during component work)
- [ ] Add profile validation (security requirement)
- [ ] Create profile edit history (user request)
```

## AI Workflow Patterns

### Before Starting Work

```typescript
// 1. Check current task list status
// Read TASK_LISTS.md or relevant feature file

// 2. Identify next priority task
// Look at "In Progress Tasks" section first, then "Future Tasks"

// 3. Update task status to in progress
// Move task from Future to In Progress if needed
```

### During Implementation

```typescript
// 1. Create/modify files as needed
// Follow the implementation plan

// 2. Add new files to "Relevant Files" section
// Update with ✅ for completed, 🚧 for in progress, 📋 for planned

// 3. Add discovered tasks to appropriate sections
// Technical debt, edge cases, new requirements
```

### After Completing Tasks

```typescript
// 1. Mark task as completed
// Change [ ] to [x] in the appropriate section

// 2. Move task to "Completed Tasks" section
// Keep chronological order of completion

// 3. Update "Relevant Files" with final status
// Mark files as ✅ completed with descriptions

// 4. Add any follow-up tasks discovered
// Technical improvements, testing needs, documentation
```

## File Organization Patterns

### Project-Level Task Lists

```
project-root/
├── TASK_LISTS.md           # Main project tasks
├── AUTHENTICATION.md       # Auth feature tasks
├── DASHBOARD.md            # Dashboard feature tasks
├── USER_PROFILE.md         # Profile feature tasks
└── TASK_MANAGEMENT.md      # Task feature tasks
```

### Task List File Naming

```markdown
<!-- Feature-specific -->

AUTHENTICATION.md # User login/register system
TASK_MANAGEMENT.md # Task CRUD operations
NOTIFICATION_SYSTEM.md # Push/email notifications

<!-- Component-specific -->

USER_DASHBOARD.md # Dashboard implementation
SEARCH_FUNCTIONALITY.md # Search and filtering
API_INTEGRATION.md # External API connections

<!-- Infrastructure -->

DATABASE_SETUP.md # Schema and migrations
DEPLOYMENT.md # Production deployment
TESTING_STRATEGY.md # Test implementation
```

## Progress Tracking Patterns

### Status Indicators in File Lists

```markdown
### Relevant Files

#### Completed (✅)

- `types/task.ts` - ✅ Task type definitions and interfaces
- `components/TaskCard.tsx` - ✅ Individual task display component

#### In Progress (🚧)

- `components/TaskList.tsx` - 🚧 Task list container (needs filtering)
- `app/tasks/page.tsx` - 🚧 Main dashboard page (needs styling)

#### Planned (📋)

- `lib/hooks/use-tasks.ts` - 📋 Custom hooks for task management
- `app/tasks/actions.ts` - 📋 Server actions for CRUD operations
```

### Implementation Notes Pattern

```markdown
## Implementation Notes

### Current Progress

- Database schema: 100% complete
- Basic CRUD operations: 80% complete (missing delete)
- UI components: 60% complete (need styling and validation)
- Testing: 20% complete (basic unit tests only)

### Technical Decisions

- Using Supabase RLS for security
- Server actions for form handling
- React Hook Form for validation
- Zustand for client state management

### Blockers and Challenges

- Need to resolve user permission model
- Waiting for design mockups for mobile view
- Performance optimization needed for large task lists

### Next Steps Priority

1. Complete delete functionality
2. Add form validation
3. Implement responsive design
4. Add comprehensive error handling
```

## Integration with Development Workflow

### Git Commit Messages with Task References

```bash
# Reference task list in commits
git commit -m "feat: implement task creation form

- Completes task from TASK_MANAGEMENT.md
- Adds form validation and error handling
- Updates TaskForm component with TypeScript types

Refs: TASK_MANAGEMENT.md - 'Create task creation form'"
```

### Code Comments Linking to Tasks

```typescript
// components/TaskForm.tsx

/**
 * Task creation and editing form component
 *
 * Implementation status: ✅ Complete
 * Related task list: TASK_MANAGEMENT.md
 *
 * @see TASK_MANAGEMENT.md - "Create task creation/editing form"
 */
export function TaskForm({ task, onSubmit }: TaskFormProps) {
  // Implementation details...
}
```
