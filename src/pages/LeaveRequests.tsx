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
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchLeaveRequests();
  }, [filterStatus]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const requests = await getAllLeaveRequests(filterStatus === 'all' ? undefined : filterStatus);
      setRequests(requests);
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
      
      fetchLeaveRequests(); // Refresh the list
    } catch (err: any) {
      console.error(`Error ${action}ing leave request:`, err);
      setError(err.message || `Failed to ${action} leave request`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const filteredRequests = requests.filter(request => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      request.employeeName?.toLowerCase().includes(searchLower) ||
      request.employeeId?.toLowerCase().includes(searchLower) ||
      request.department?.toLowerCase().includes(searchLower) ||
      request.requestId?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant="outline" className="capitalize">
        {type} Leave
      </Badge>
    );
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

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Leave Requests</h1>
          <p className="text-gray-600 mt-1">
            Review and manage employee leave requests
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {pendingCount} pending
        </Badge>
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
              onClick={fetchLeaveRequests}
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

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by employee name, ID, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-64">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('pending');
              }}
            >
              Clear Filters
            </Button>
            <Button
              variant="default"
              onClick={fetchLeaveRequests}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filterStatus === 'all' ? 'All Leave Requests' : 
             filterStatus === 'pending' ? 'Pending Leave Requests' :
             `${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Leave Requests`}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredRequests.length} requests)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
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
                  {filteredRequests.map((request) => (
                    <TableRow key={request.requestId}>
                      <TableCell className="font-mono text-xs">
                        {request.requestId.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.employeeName}</div>
                          <div className="text-sm text-gray-500">
                            {request.employeeId} • {request.department}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {request.yearMonth}
                      </TableCell>
                      <TableCell>
                        <Badge variant={request.days > 3 ? "destructive" : "outline"}>
                          {request.days} {request.days === 1 ? 'day' : 'days'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(request.leaveType)}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={request.reason}>
                          {request.reason || "No reason provided"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(request.status)}
                      </TableCell>
                      <TableCell>
                        {new Date(request.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {request.status === 'pending' ? (
                          <div className="flex justify-end space-x-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApproveReject(request.requestId, 'approve')}
                              disabled={processing[request.requestId]}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {processing[request.requestId] ? 'Processing...' : 'Approve'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleApproveReject(request.requestId, 'reject')}
                              disabled={processing[request.requestId]}
                            >
                              {processing[request.requestId] ? 'Processing...' : 'Reject'}
                            </Button>
                          </div>
                        ) : (
                          <div className="text-right space-y-1">
                            {request.approvedBy && (
                              <div className="text-sm text-gray-500">
                                By: {request.approvedBy}
                              </div>
                            )}
                            {request.comments && (
                              <div className="text-xs text-gray-400" title={request.comments}>
                                {request.comments.length > 30 
                                  ? `${request.comments.substring(0, 30)}...`
                                  : request.comments}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No leave requests found
              </h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'pending' 
                  ? 'Try adjusting your filters or search term'
                  : 'No pending leave requests at the moment'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaveRequests;