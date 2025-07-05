# MEDSPASYNC PRO AUTONOMOUS EXECUTION MODULE
# YOLO Mode and Execution Settings

## AUTONOMOUS EXECUTION SETTINGS

### Auto-Execute Commands
- Testing: `npm test`, `npm run test:coverage`, `npm run test:ui`
- Building: `npm run build`, `npm run type-check`
- Linting: `npm run lint`, `npm run lint:fix`
- Formatting: `npm run format`
- Performance: `npm run lighthouse`

### Safety Constraints
- Never modify production configuration without approval
- Always run tests before making commits
- Create backup branches for major refactoring
- Stop execution if error rate exceeds 10%
- Require manual approval for external API calls

### Error Recovery
- Implement comprehensive error boundaries
- Automatic rollback on test failures
- Graceful degradation for feature failures
- Detailed error logging and reporting

## YOLO MODE CONFIGURATION

Execute development tasks autonomously with these permissions:
- Testing commands: `npm test`, `npm run test:coverage`, `vitest`
- Build operations: `npm run build`, `npm run type-check`
- File operations: Create, modify, delete files within project
- Package management: `npm install`, `npm update`
- Git operations: `git add`, `git commit` to feature branches
- Development servers: `npm run dev`, `npm run preview`

Safety constraints:
- Never modify production configuration
- Always run tests before making commits
- Create backup branches for major refactoring
- Stop execution if error rate exceeds 10%
- Require manual approval for external API calls

This autonomous execution module enables maximum automation while maintaining safety and quality standards for the MedSpaSync Pro development workflow. 