import React, { useState, useEffect } from "react";
import {
  getMyLeaveRequests,
  submitLeaveRequest,
  getMyLeaveStats,
  hasPendingLeaveForMonth,
} from "@/api/employees";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarDays,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  CalendarIcon,
  Plus,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface LeaveRequest {
  requestId: string;
  yearMonth: string;
  days: number;
  leaveType: "casual" | "sick" | "earned";
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  comments?: string;
  startDate?: string;
  endDate?: string;
}

interface LeaveStats {
  totalLeaves: number;
  leavesRemaining: number;
  casualLeavesUsed: number;
  casualLeavesTotal: number;
  sickLeavesUsed: number;
  sickLeavesTotal: number;
  pendingRequests: number;
  approvedRequests: number;
}

const MyLeaveRequests: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [leaveStats, setLeaveStats] = useState<LeaveStats | null>(null);
  const [formData, setFormData] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    leaveType: "casual" as "casual" | "sick" | "earned",
    reason: "",
  });
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  // const [showDateSelector, setShowDateSelector] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasPending, setHasPending] = useState(false);
  const [formError, setFormError] = useState("");
  const [, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch leave requests and stats in parallel
      const [requestsData, statsData] = await Promise.all([
        getMyLeaveRequests(),
        getMyLeaveStats(),
      ]);

      setRequests(requestsData);
      setLeaveStats(statsData);
    } catch (err: any) {
      console.error("Error fetching leave data:", err);
      setError(err.message || "Failed to load leave information");
    } finally {
      setLoading(false);
    }
  };

  // Check for pending leaves based on selected month
  useEffect(() => {
    const checkPendingLeave = async () => {
      if (formData.startDate) {
        const yearMonth = format(formData.startDate, "yyyy-MM");
        const hasPendingLeave = await hasPendingLeaveForMonth(yearMonth);
        setHasPending(hasPendingLeave);
        if (hasPendingLeave) {
          setFormError(
            "You already have a pending leave request for this month"
          );
        } else {
          setFormError("");
        }
      }
    };
    checkPendingLeave();
  }, [formData.startDate]);

  // Calculate number of days between dates
  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const diffTime = Math.abs(
        formData.endDate.getTime() - formData.startDate.getTime()
      );
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!formData.startDate || (formData.startDate && formData.endDate)) {
      // Start new selection
      setFormData({ ...formData, startDate: date, endDate: undefined });
      setDateRange({ from: date });
    } else if (formData.startDate && !formData.endDate) {
      // Complete the range
      const start = formData.startDate;
      const end = date < start ? start : date;
      setFormData({ ...formData, endDate: end });
      setDateRange({ from: start, to: end });

      // Generate list of all dates in range
      const datesInRange: Date[] = [];
      const current = new Date(start);
      while (current <= end) {
        datesInRange.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      setSelectedDates(datesInRange);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFormError("");

    // Validate form
    if (!formData.startDate || !formData.endDate) {
      setFormError("Please select start and end dates");
      return;
    }

    if (hasPending) {
      setFormError("You already have a pending leave request for this month");
      return;
    }

    const days = calculateDays();
    if (leaveStats && days > leaveStats.leavesRemaining) {
      setFormError(
        `Insufficient leave balance. Available: ${leaveStats.leavesRemaining} days`
      );
      return;
    }

    if (days <= 0) {
      setFormError("Please select valid dates");
      return;
    }

    setSubmitting(true);
    try {
      // Format yearMonth as YYYY-MM
      const yearMonth = format(formData.startDate, "yyyy-MM");
      const days = calculateDays();

      // Format dates for display in reason
      const startDateStr = format(formData.startDate, "MMM d, yyyy");
      const endDateStr = format(formData.endDate, "MMM d, yyyy");

      // Include dates in the reason field since API doesn't have separate date fields
      const reasonWithDates = formData.reason
        ? `${formData.reason} (${startDateStr} to ${endDateStr})`
        : `Leave from ${startDateStr} to ${endDateStr}`;

      await submitLeaveRequest({
        yearMonth,
        days,
        leaveType: formData.leaveType,
        reason: reasonWithDates,
      });

      setSuccess("Leave request submitted successfully!");
      setTimeout(() => setSuccess(""), 3000);

      // Reset form
      setFormData({
        startDate: undefined,
        endDate: undefined,
        leaveType: "casual",
        reason: "",
      });
      setDateRange({});
      setSelectedDates([]);

      // Refresh data
      fetchData();
    } catch (err: any) {
      console.error("Error submitting leave request:", err);
      setFormError(err.message || "Failed to submit leave request");
      setTimeout(() => setFormError(""), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      startDate: undefined,
      endDate: undefined,
      leaveType: "casual",
      reason: "",
    });
    setDateRange({});
    setSelectedDates([]);
    setFormError("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Pending
          </Badge>
        );
    }
  };

  const getTypeDisplay = (type: string) => {
    switch (type) {
      case "casual":
        return "Casual Leave";
      case "sick":
        return "Sick Leave";
      case "earned":
        return "Earned Leave";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">
              Loading your leave information...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const daysSelected = calculateDays();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          My Leave Requests
        </h1>
        <p className="text-gray-600 mt-1">
          Submit and track your leave requests
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchData}
              className="ml-2 h-auto p-0"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Leave Balance Summary */}
      {leaveStats && (
        <Card>
          <CardHeader>
            <CardTitle>Leave Balance</CardTitle>
            <CardDescription>
              Your current leave allocation and usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">
                  Total Leaves
                </div>
                <div className="text-2xl font-bold">
                  {leaveStats.totalLeaves}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">
                  Leaves Remaining
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {leaveStats.leavesRemaining}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">
                  Casual Leaves
                </div>
                <div className="text-lg font-semibold">
                  {leaveStats.casualLeavesUsed} / {leaveStats.casualLeavesTotal}{" "}
                  used
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500">
                  Sick Leaves
                </div>
                <div className="text-lg font-semibold">
                  {leaveStats.sickLeavesUsed} / {leaveStats.sickLeavesTotal}{" "}
                  used
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submit New Request */}
        <Card>
          <CardHeader>
            <CardTitle>Submit New Leave Request</CardTitle>
            <CardDescription>
              Select dates, choose leave type, and add a reason
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date Selection Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base">Select Leave Dates</Label>
                  {(formData.startDate || formData.endDate) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetForm}
                      className="h-8 px-2"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                {/* Date Display */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="startDate"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.startDate ? (
                            format(formData.startDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.startDate}
                          onSelect={(date: Date | undefined) => handleDateSelect(date)}
                          initialFocus
                          disabled={(date: Date | undefined) => date! < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="endDate"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.endDate && "text-muted-foreground"
                          )}
                          disabled={!formData.startDate}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.endDate ? (
                            format(formData.endDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.endDate}
                          onSelect={(date: Date | undefined) => handleDateSelect(date)}
                          initialFocus
                          disabled={(date: Date | undefined) => {
                            const isPastDate = date! < new Date();
                            const isBeforeStartDate = formData.startDate
                              ? date! < formData.startDate
                              : false;
                            return isPastDate || isBeforeStartDate;
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Selected Dates Summary */}
                {(formData.startDate || formData.endDate) && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium">Selected Period:</span>
                        <span className="ml-2">
                          {formData.startDate &&
                            format(formData.startDate, "MMM d, yyyy")}
                          {formData.endDate &&
                            ` to ${format(formData.endDate, "MMM d, yyyy")}`}
                        </span>
                      </div>
                      <Badge variant="secondary">
                        {daysSelected} day{daysSelected !== 1 ? "s" : ""}
                      </Badge>
                    </div>

                    {selectedDates.length > 0 && (
                      <div className="text-sm">
                        <div className="font-medium text-gray-700 mb-1">
                          Selected Dates:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {selectedDates.map((date, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {format(date, "d MMM")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Leave Type and Reason */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="leaveType">Leave Type</Label>
                  <Select
                    value={formData.leaveType}
                    onValueChange={(value: "casual" | "sick" | "earned") =>
                      setFormData({ ...formData, leaveType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casual">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                          Casual Leave
                        </div>
                      </SelectItem>
                      <SelectItem value="sick">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                          Sick Leave
                        </div>
                      </SelectItem>
                      <SelectItem value="earned">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          Earned Leave
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Leave</Label>
                  <Textarea
                    id="reason"
                    placeholder="Please provide a reason for your leave request..."
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-gray-500">
                    Optional, but recommended for better approval chances
                  </p>
                </div>
              </div>

              {/* Validation Messages */}
              {hasPending && (
                <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200">
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Note</AlertTitle>
                  <AlertDescription>
                    You have a pending leave request for this month
                  </AlertDescription>
                </Alert>
              )}

              {daysSelected > 0 &&
                leaveStats &&
                daysSelected > leaveStats.leavesRemaining && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Insufficient Balance</AlertTitle>
                    <AlertDescription>
                      You have only {leaveStats.leavesRemaining} leave
                      {leaveStats.leavesRemaining !== 1 ? "s" : ""} remaining
                    </AlertDescription>
                  </Alert>
                )}

              {/* Submit Button */}
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={
                    submitting ||
                    hasPending ||
                    !formData.startDate ||
                    !formData.endDate ||
                    (leaveStats
                      ? daysSelected > leaveStats.leavesRemaining
                      : false)
                  }
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Submit Leave Request
                    </>
                  )}
                </Button>

                {daysSelected > 0 && leaveStats && (
                  <div className="text-sm text-center text-gray-600">
                    This will use {daysSelected} of your{" "}
                    {leaveStats.leavesRemaining} remaining leave
                    {leaveStats.leavesRemaining !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Request History */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Request History</CardTitle>
            <CardDescription>
              {requests.length} request{requests.length !== 1 ? "s" : ""} total
              {leaveStats && ` • ${leaveStats.pendingRequests} pending`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.requestId}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-gray-400" />
                            {request.yearMonth}
                          </div>
                          {request.startDate && request.endDate && (
                            <div className="text-xs text-gray-500">
                              {request.startDate} to {request.endDate}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{request.days}</span> days
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTypeDisplay(request.leaveType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(request.status)}
                          {request.comments && (
                            <div
                              className="text-xs text-gray-500 mt-1"
                              title={request.comments}
                            >
                              {request.comments.length > 20
                                ? `${request.comments.substring(0, 20)}...`
                                : request.comments}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                  {requests.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-gray-500"
                      >
                        <div className="flex flex-col items-center">
                          <FileText className="h-12 w-12 text-gray-300 mb-2" />
                          <p>No leave requests yet</p>
                          <p className="text-sm">
                            Submit your first request above
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyLeaveRequests;
