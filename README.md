This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

## Adding shadcn Components

To add shadcn components like `Button`, follow these steps:

1. **Install Shadcn UI**:
   Ensure Shadcn UI is installed in your project:
   ```bash
   npm install @shadcn/ui
   # or
   yarn add @shadcn/ui
   ```

2. **Add a Component**:
   Add a component using the CLI, for example:
   ```bash
   npx shadcn-ui add button
   ```

3. **Use the Component**:
   Import and use the component in your application:
   ```typescript:wavee/src/app/page.tsx
   import { Button } from "@/src/components/ui/button"

   export default function Home() {
     return (
       <div>
         <h1>Welcome to My App</h1>
         <Button>Click Me</Button>
       </div>
     )
   }
   ```

By following these steps, you can add and use Shadcn components in your project.
