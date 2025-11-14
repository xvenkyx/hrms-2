import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function Bonus() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Bonus</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-4">
          <Button className="w-fit">Add Bonus</Button>

          <p className="text-sm text-gray-600">
            Record monthly performance incentives for employees.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
