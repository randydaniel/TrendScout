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

2. **Create a Component**:
   Create a new file for your component, for example `Button.tsx` in the `src/components/ui` directory:
   ```typescript:wavee/src/components/ui/Button.tsx
   import { Button } from "@shadcn/ui"

   export default function MyButton() {
     return (
       <Button className="bg-blue-500 text-white">
         Click Me
       </Button>
     )
   }
   ```

3. **Use the Component**:
   Import and use the component in your application:
   ```typescript:wavee/src/pages/index.tsx
   import MyButton from '../components/ui/Button'

   export default function Home() {
     return (
       <div>
         <h1>Welcome to My App</h1>
         <MyButton />
       </div>
     )
   }
   ```

By following these steps, you can add and use Shadcn components in your project.
