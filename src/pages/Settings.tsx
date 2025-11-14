import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function Settings() {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Salary Settings</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Label>PF Amount</Label>
          <Input placeholder="3600" />
        </div>

        <div>
          <Label>Professional Tax</Label>
          <Input placeholder="200" />
        </div>

        <div>
          <Label>Basic %</Label>
          <Input placeholder="40" />
        </div>

        <div>
          <Label>Allowance %</Label>
          <Input placeholder="20" />
        </div>

        <Button className="w-fit">Save Settings</Button>
      </CardContent>
    </Card>
  )
}
