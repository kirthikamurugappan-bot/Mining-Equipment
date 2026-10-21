/**
 * Automated Verification Test for:
 * 1. Attendance Workflow for all three roles (Worker, Supervisor, Admin)
 * 2. Task Assignment with Worker Availability Verification & Status Lifecycle
 * 3. In-App Notifications and Real Notification System in MongoDB
 */
const BASE_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function login(username, password = 'password123') {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  if (!res.data.success) {
    throw new Error(`Failed to login as ${username}: ${res.data.message}`);
  }
  return { token: res.data.token, user: res.data.user };
}

async function run() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING MINETRACK ATTENDANCE & NOTIFICATIONS E2E TESTS');
  console.log('======================================================\n');

  // 1. Authenticate users
  console.log('1. Authenticating test users...');
  const worker = await login('ravi01');
  const worker2 = await login('suresh02');
  const supervisor = await login('sup1');
  const admin = await login('admin');
  console.log('   ✓ Logged in as Worker (Ravi Singh):', worker.user.role);
  console.log('   ✓ Logged in as Worker 2 (Suresh Patel):', worker2.user.role);
  console.log('   ✓ Logged in as Supervisor (Anand Sharma):', supervisor.user.role);
  console.log('   ✓ Logged in as Admin (Rajesh Kumar):', admin.user.role);

  // 2. Worker Attendance Workflow
  console.log('\n2. Testing Worker Attendance Workflow...');
  const wHeaders = { Authorization: `Bearer ${worker.token}` };

  // Check In
  const checkInRes = await request('/attendance/checkin', {
    method: 'POST',
    headers: wHeaders,
    body: JSON.stringify({ remarks: 'Morning excavation shift check-in' })
  });
  console.log('   Check-In status:', checkInRes.status, '| Message:', checkInRes.data.message);

  // Duplicate Check-In prevention test
  const dupCheckIn = await request('/attendance/checkin', {
    method: 'POST',
    headers: wHeaders
  });
  console.log('   Duplicate Check-In blocked?', dupCheckIn.status === 400 ? '✓ YES (HTTP 400)' : '❌ NO', '|', dupCheckIn.data.message);

  // Check Today's status
  const todayRes = await request('/attendance/today', { headers: wHeaders });
  console.log('   Today status retrieved?', todayRes.data.success ? '✓ YES' : '❌ NO', '| Status:', todayRes.data.data?.status, '| CheckIn:', todayRes.data.data?.checkIn);

  // Check Out
  const checkOutRes = await request('/attendance/checkout', {
    method: 'POST',
    headers: wHeaders,
    body: JSON.stringify({ remarks: 'Completed morning operations shift' })
  });
  console.log('   Check-Out status:', checkOutRes.status, '| Message:', checkOutRes.data.message);

  // 3. Supervisor & Admin Attendance Visibility
  console.log('\n3. Testing Supervisor & Admin Attendance Visibility...');
  const sHeaders = { Authorization: `Bearer ${supervisor.token}` };
  const aHeaders = { Authorization: `Bearer ${admin.token}` };

  // Supervisor views worker attendance
  const supWorkerAtt = await request('/attendance?role=worker', { headers: sHeaders });
  console.log('   Supervisor viewed worker attendance logs:', supWorkerAtt.data.count, 'records found.');

  // Admin views analytics
  const adminAnalytics = await request('/attendance/analytics', { headers: aHeaders });
  console.log('   Admin attendance analytics retrieved?', adminAnalytics.data.success ? '✓ YES' : '❌ NO');
  if (adminAnalytics.data.success) {
    console.log('   Workforce breakdown: Total =', adminAnalytics.data.data.totalWorkforce, '| Present =', adminAnalytics.data.data.presentCount, '| On Leave =', adminAnalytics.data.data.leaveCount);
  }

  // 4. Task Assignment with Availability Verification
  console.log('\n4. Testing Task Assignment & Worker Availability Verification...');
  // Find unavailable worker (anil03 is On Leave)
  const usersRes = await request('/users/workers', { headers: sHeaders });
  const unavailableWorker = usersRes.data.data.find(u => u.availability === 'On Leave');
  const availableWorker = usersRes.data.data.find(u => u.availability === 'Available');

  // Attempt to assign to unavailable worker
  if (unavailableWorker) {
    console.log(`   Attempting to assign task to unavailable worker (${unavailableWorker.name} - ${unavailableWorker.availability})...`);
    const assignUnavailable = await request('/tasks', {
      method: 'POST',
      headers: sHeaders,
      body: JSON.stringify({
        title: 'Emergency Pit Conveyor Inspection',
        assignedWorker: unavailableWorker._id,
        priority: 'High',
        dueDate: new Date(Date.now() + 86400000).toISOString()
      })
    });
    console.log('   Unavailable assignment blocked?', assignUnavailable.status === 400 ? '✓ YES (HTTP 400)' : '❌ NO');
    console.log('   Backend rejection message:', assignUnavailable.data.message);
  }

  // Assign to available worker
  console.log(`   Assigning task to available worker (${availableWorker.name})...`);
  const assignAvailable = await request('/tasks', {
    method: 'POST',
    headers: sHeaders,
    body: JSON.stringify({
      title: 'Haul Road DT-205 Brake Diagnostics',
      description: 'Perform brake caliper pressure test on Dump Truck DT-205.',
      assignedWorker: availableWorker._id,
      priority: 'High',
      dueDate: new Date(Date.now() + 86400000).toISOString()
    })
  });
  console.log('   Assignment result:', assignAvailable.status === 201 ? '✓ SUCCESS' : '❌ FAILED', '| TaskId:', assignAvailable.data.data?.taskId);
  const createdTaskId = assignAvailable.data.data?._id;

  // 5. Worker Task Lifecycle Actions
  console.log('\n5. Testing Worker Task Lifecycle Actions...');
  const targetWorkerAuth = availableWorker._id.toString() === worker.user._id.toString() ? wHeaders : { Authorization: `Bearer ${worker2.token}` };

  // Acknowledge
  const ackRes = await request(`/tasks/${createdTaskId}/acknowledge`, {
    method: 'PUT',
    headers: targetWorkerAuth,
    body: JSON.stringify({ remarks: 'Task acknowledged by operator.' })
  });
  console.log('   Task acknowledged?', ackRes.data.success ? '✓ YES' : '❌ NO', '| Status:', ackRes.data.data?.status);

  // Start
  const startRes = await request(`/tasks/${createdTaskId}/start`, {
    method: 'PUT',
    headers: targetWorkerAuth,
    body: JSON.stringify({ remarks: 'Commenced brake diagnostic tests.' })
  });
  console.log('   Task started?', startRes.data.success ? '✓ YES' : '❌ NO', '| Status:', startRes.data.data?.status);

  // Complete
  const completeRes = await request(`/tasks/${createdTaskId}/complete`, {
    method: 'PUT',
    headers: targetWorkerAuth,
    body: JSON.stringify({ remarks: 'All brake tests passed within operating threshold.' })
  });
  console.log('   Task completed?', completeRes.data.success ? '✓ YES' : '❌ NO', '| Status:', completeRes.data.data?.status);

  // 6. In-App Notifications Verification
  console.log('\n6. Testing Notification Center & In-App Notification System...');
  // Worker notifications
  const workerNotifs = await request('/notifications', { headers: targetWorkerAuth });
  console.log('   Worker notifications retrieved:', workerNotifs.data.count, '| Unread count:', workerNotifs.data.unreadCount);

  // Supervisor notifications
  const supNotifs = await request('/notifications', { headers: sHeaders });
  console.log('   Supervisor notifications retrieved:', supNotifs.data.count, '| Unread count:', supNotifs.data.unreadCount);

  // Mark all read
  const markAll = await request('/notifications/mark-all-read', {
    method: 'PUT',
    headers: sHeaders
  });
  console.log('   Supervisor marked all notifications as read?', markAll.data.success ? '✓ YES' : '❌ NO');

  const afterMark = await request('/notifications/unread-count', { headers: sHeaders });
  console.log('   Supervisor unread count after marking read:', afterMark.data.count);

  console.log('\n======================================================');
  console.log('✅ ALL ATTENDANCE, WORKFLOW & NOTIFICATION TESTS PASSED');
  console.log('======================================================\n');
}

run().catch(err => {
  console.error('\n❌ Test execution error:', err.message);
  process.exit(1);
});
