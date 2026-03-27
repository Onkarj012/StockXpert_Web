import { redirect } from "next/navigation";

// Default to Editorial design (Design 2)
export default function Home() {
  redirect("/editorial");
}
