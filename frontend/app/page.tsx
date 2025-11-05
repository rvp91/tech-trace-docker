import { redirect } from "next/navigation"

export default function Page() {
  // Redirect to dashboard as the main entry point
  redirect("/dashboard")
}
