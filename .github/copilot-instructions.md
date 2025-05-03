This is a React application with an Express backend which provides a way to create, modify, and run pub trivia quizzes.  A quiz is comprised of a list of rounds, where each round is comprised of a list of questions.  Questions can specify how many and which answers are correct and how a user inputs an answer: text input / radio input.

The application has two operating modes:  

  Quiz Creation and Management: In this mode, a quiz admin must login to an account to create or edit quizzes for their account.  They also have a place to get start a live quiz and manage it as well.

  Live Quiz Operation: In this mode, users do not need to sign in, instead they are given a link or a quiz code that allows them to join a live quiz in progress.  Users then participate in the quiz by filling out answer forms and submitting in real time.

# Project coding standards

## TypeScript Guidelines
- Use TypeScript for all new code
- Follow functional programming principles where possible
- Use interfaces for data structures and type definitions
- Prefer immutable data (const, readonly)
- Use optional chaining (?.) and nullish coalescing (??) operators

## React Guidelines
- Use functional components with hooks
- Follow the React hooks rules (no conditional hooks)
- Use React.FC type for components with children
- Keep components small and focused
- Use styled-components for component styling

## Naming Conventions
- Use PascalCase for component names, interfaces, and type aliases
- Use camelCase for variables, functions, and methods
- Prefix private class members with underscore (_)
- Use ALL_CAPS for constants

## Error Handling
- Use try/catch blocks for async operations
- Implement proper error boundaries in React components
- Always log errors with contextual information