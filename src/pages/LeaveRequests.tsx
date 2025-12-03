import React, { useState, useEffect } from 'react';
import {
  getAllLeaveRequests,
  processLeaveRequest,
} from '@/api/employees';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface LeaveRequest {
  requestId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  yearMonth: string;
  days: number;
  leaveType: 'casual' | 'sick' | 'earned';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
}

const LeaveRequests: React.FC = () => {
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');

  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAllRequests();
  }, []);

  const fetchAllRequests = async () => {
    try {
      setLoading(true);
      setError('');

      const all = await getAllLeaveRequests("all");
      setAllRequests(all);
      setPendingRequests(all.filter(r => r.status === "pending"));
    } catch (err: any) {
      console.error('Error fetching leave requests:', err);
      setError(err.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (requestId: string, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this leave request?`)) {
      return;
    }

    setProcessing(prev => ({ ...prev, [requestId]: true }));
    
    try {
      const comments = prompt(`Enter comments for ${action} (optional):`);
      await processLeaveRequest(requestId, action, comments || '');

      setSuccess(`Leave request ${action}d successfully!`);
      setTimeout(() => setSuccess(''), 3000);

      fetchAllRequests();
    } catch (err: any) {
      console.error(`Error ${action}ing leave request:`, err);
      setError(err.message || `Failed to ${action} leave request`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: false }));
    }
  };

  // Filter logic for all requests
  const filteredAllRequests = allRequests.filter(request => {
    const matchesSearch =
      request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept =
      departmentFilter === 'all' || request.department === departmentFilter;

    const matchesMonth =
      monthFilter === '' || request.yearMonth === monthFilter;

    const matchesType =
      leaveTypeFilter === 'all' || request.leaveType === leaveTypeFilter;

    return matchesSearch && matchesDept && matchesMonth && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return <Badge variant="outline" className="capitalize">{type} Leave</Badge>;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading leave requests...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">

      {/** HEADER **/}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Leave Requests</h1>
          <p className="text-gray-600 mt-1">Review and manage employee leave requests</p>
        </div>
        <Badge variant="secondary">{pendingRequests.length} pending</Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/** FILTERS FOR ALL REQUESTS **/}
      <Card>
        <CardHeader>
          <CardTitle>Filters for All Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

            <Input
              placeholder="Search name, employee ID, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="ICT">ICT</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              placeholder="Filter by month"
            />

            <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
              <SelectTrigger><SelectValue placeholder="Leave type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="casual">Casual Leave</SelectItem>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="earned">Earned Leave</SelectItem>
              </SelectContent>
            </Select>

          </div>

          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setDepartmentFilter('all');
            setMonthFilter('');
            setLeaveTypeFilter('all');
          }}>
            Clear Filters
          </Button>
        </CardContent>
      </Card>

      {/** PENDING REQUESTS TABLE **/}
      <Card>
        <CardHeader>
          <CardTitle>Pending Leave Requests ({pendingRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="text-gray-500">No pending requests</p>
          ) : (
            <PendingTable
              requests={pendingRequests}
              processing={processing}
              onAction={handleApproveReject}
              getTypeBadge={getTypeBadge}
              getStatusBadge={getStatusBadge}
            />
          )}
        </CardContent>
      </Card>

      {/** ALL PAST REQUESTS TABLE **/}
      <Card>
        <CardHeader>
          <CardTitle>
            All Leave Requests ({filteredAllRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PastRequestsTable
            requests={filteredAllRequests}
            getTypeBadge={getTypeBadge}
            getStatusBadge={getStatusBadge}
          />
        </CardContent>
      </Card>

    </div>
  );
};

export default LeaveRequests;

/**************************************
 * Reusable Table Components
 **************************************/

const PendingTable = ({
  requests,
  processing,
  onAction,
  getTypeBadge,
  getStatusBadge,
}: any) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Employee</TableHead>
          <TableHead>Month</TableHead>
          <TableHead>Days</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request: LeaveRequest) => (
          <TableRow key={request.requestId}>
            <TableCell>{request.requestId.slice(0, 8)}...</TableCell>
            <TableCell>
              <div className="font-medium">{request.employeeName}</div>
              <div className="text-sm text-gray-500">
                {request.employeeId} • {request.department}
              </div>
            </TableCell>
            <TableCell>{request.yearMonth}</TableCell>
            <TableCell>{request.days}</TableCell>
            <TableCell>{getTypeBadge(request.leaveType)}</TableCell>
            <TableCell>{request.reason}</TableCell>
            <TableCell>{getStatusBadge(request.status)}</TableCell>
            <TableCell>
              {new Date(request.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-right space-x-2">
              <Button
                size="sm"
                className="bg-green-600 text-white"
                disabled={processing[request.requestId]}
                onClick={() => onAction(request.requestId, 'approve')}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={processing[request.requestId]}
                onClick={() => onAction(request.requestId, 'reject')}
              >
                Reject
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const PastRequestsTable = ({
  requests,
  getTypeBadge,
  getStatusBadge,
}: any) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Employee</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Month</TableHead>
          <TableHead>Days</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Submitted</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request: LeaveRequest) => (
          <TableRow key={request.requestId}>
            <TableCell>{request.requestId.slice(0, 8)}...</TableCell>
            <TableCell>{request.employeeName}</TableCell>
            <TableCell>{request.department}</TableCell>
            <TableCell>{request.yearMonth}</TableCell>
            <TableCell>{request.days}</TableCell>
            <TableCell>{getTypeBadge(request.leaveType)}</TableCell>
            <TableCell>{getStatusBadge(request.status)}</TableCell>
            <TableCell className="truncate max-w-xs">{request.reason}</TableCell>
            <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
