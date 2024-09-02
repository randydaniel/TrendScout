import { Button } from "@/src/components/ui/button";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-center uppercase">
        Wavee
      </h1>
      <Button variant="destructive">Destructive</Button>
    </main>
  )
}