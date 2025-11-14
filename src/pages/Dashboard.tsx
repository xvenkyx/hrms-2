import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function Dashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        Welcome to the Payroll Management System.
        <br />
        Select a section from the sidebar.
      </CardContent>
    </Card>
  )
}
