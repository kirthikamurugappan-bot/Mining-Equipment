/**
 * MineTrack Backend End-to-End API Test Suite
 * Tests authentication, roles, equipment, tyres, maintenance, cost comparison,
 * tasks workflow, availability checks, issues reporting, and reports.
 */
const http = require('http');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 RUNNING MINETRACK END-TO-END API TESTS');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${details}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    const health = await request('GET', '/health');
    assert(health.status === 200 && health.body?.success, 'API Health Check returns 200 OK');

    // 2. Auth - Empty Username
    const emptyUser = await request('POST', '/auth/login', { username: '', password: 'password123' });
    assert(emptyUser.status === 400 && emptyUser.body?.message === 'Username is required.', 'Login validates empty username');

    // 3. Auth - Empty Password
    const emptyPwd = await request('POST', '/auth/login', { username: 'admin', password: '' });
    assert(emptyPwd.status === 400 && emptyPwd.body?.message === 'Password is required.', 'Login validates empty password');

    // 4. Auth - Invalid Password
    const invalidPwd = await request('POST', '/auth/login', { username: 'admin', password: 'wrongpassword' });
    assert(invalidPwd.status === 401 && invalidPwd.body?.message === 'Invalid username or password.', 'Login validates incorrect credentials');

    // 5. Auth - Admin Login
    const adminLogin = await request('POST', '/auth/login', { username: 'admin', password: 'password123' });
    assert(adminLogin.status === 200 && adminLogin.body?.user?.role === 'admin', 'Admin login succeeds & retrieves admin role from DB');
    const adminToken = adminLogin.body?.token;

    // 6. Auth - Supervisor Login
    const supLogin = await request('POST', '/auth/login', { username: 'sup1', password: 'password123' });
    assert(supLogin.status === 200 && supLogin.body?.user?.role === 'supervisor', 'Supervisor login succeeds & retrieves supervisor role from DB');
    const supToken = supLogin.body?.token;

    // 7. Auth - Worker Login
    const wrkLogin = await request('POST', '/auth/login', { username: 'ravi01', password: 'password123' });
    assert(wrkLogin.status === 200 && wrkLogin.body?.user?.role === 'worker', 'Worker login succeeds & retrieves worker role from DB');
    const wrkToken = wrkLogin.body?.token;

    // 8. Role Protection - Worker blocked from Admin API
    const workerBlocked = await request('GET', '/users', null, wrkToken);
    assert(workerBlocked.status === 403, 'Worker is forbidden from accessing Admin User Management');

    // 9. Equipment API
    const eqRes = await request('GET', '/equipment', null, supToken);
    assert(eqRes.status === 200 && Array.isArray(eqRes.body?.data) && eqRes.body.data.length >= 5, 'Equipment list retrieved from MongoDB');

    // 10. Tyre API
    const tyreRes = await request('GET', '/tyres', null, supToken);
    assert(tyreRes.status === 200 && Array.isArray(tyreRes.body?.data) && tyreRes.body.data.length >= 5, 'Tyres list retrieved from MongoDB');

    // 11. Maintenance API & Cost Comparison
    const maintRes = await request('GET', '/maintenance', null, supToken);
    assert(maintRes.status === 200 && Array.isArray(maintRes.body?.data), 'Maintenance list retrieved');
    const matchedRecord = maintRes.body.data.find(m => m.costStatus === 'Cost Matched');
    const mismatchRecord = maintRes.body.data.find(m => m.costStatus === 'Cost Mismatch');
    assert(!!matchedRecord, 'Automatic cost comparison: Cost Matched records exist');
    assert(!!mismatchRecord, 'Automatic cost comparison: Cost Mismatch records exist');

    // 12. Cost Mismatch Review by Supervisor
    if (mismatchRecord) {
      const reviewRes = await request('PUT', `/maintenance/${mismatchRecord._id}/review-cost`, {
        status: 'Approved',
        remarks: 'Test approval: approved difference due to spare part shipping.'
      }, supToken);
      assert(reviewRes.status === 200 && reviewRes.body?.data?.costVerificationStatus === 'Approved', 'Supervisor approves cost mismatch');
    }

    // 13. Tasks Workflow - Worker actions
    const tasksRes = await request('GET', '/tasks', null, wrkToken);
    assert(tasksRes.status === 200 && Array.isArray(tasksRes.body?.data), 'Worker retrieves assigned tasks');
    const assignedTask = tasksRes.body.data.find(t => t.status === 'Assigned' || t.status === 'Acknowledged');
    if (assignedTask) {
      // Worker Acknowledges Task
      const ackRes = await request('PUT', `/tasks/${assignedTask._id}/acknowledge`, { remarks: 'Acknowledged in test' }, wrkToken);
      assert(ackRes.status === 200 && ackRes.body?.data?.status === 'Acknowledged', 'Worker acknowledges task');

      // Worker Starts Task
      const startRes = await request('PUT', `/tasks/${assignedTask._id}/start`, { remarks: 'Started in test' }, wrkToken);
      assert(startRes.status === 200 && startRes.body?.data?.status === 'In Progress', 'Worker starts task (In Progress)');

      // Worker Completes Task
      const compRes = await request('PUT', `/tasks/${assignedTask._id}/complete`, { remarks: 'Completed in test' }, wrkToken);
      assert(compRes.status === 200 && compRes.body?.data?.status === 'Completed', 'Worker completes task');
    }

    // 14. Worker Availability Check before Task Assignment
    // Try assigning task to anil03 who is On Leave
    const anilWorker = await request('GET', '/users?search=anil03', null, adminToken);
    const anilId = anilWorker.body?.data?.[0]?._id;
    if (anilId) {
      const taskUnavailable = await request('POST', '/tasks', {
        title: 'Test Availability Check',
        assignedWorker: anilId,
        equipment: eqRes.body.data[0]._id,
        dueDate: new Date(Date.now() + 86400000)
      }, supToken);
      assert(taskUnavailable.status === 400 && taskUnavailable.body?.workerUnavailable, 'Task assignment checks availability and blocks worker on leave');
    }

    // 15. Issue Reporting & Supervisor Review
    const reportRes = await request('POST', '/issues', {
      equipment: eqRes.body.data[0]._id,
      issueType: 'Engine Fault',
      description: 'Test API reported engine sound issue',
      priority: 'High'
    }, wrkToken);
    assert(reportRes.status === 201 && reportRes.body?.data?.issueId, 'Worker reports equipment fault issue');
    const newIssueId = reportRes.body?.data?._id;

    if (newIssueId) {
      const reviewIssueRes = await request('PUT', `/issues/${newIssueId}/review`, {
        supervisorDecision: 'Inspection Required',
        supervisorRemarks: 'Inspection verified by supervisor in test'
      }, supToken);
      assert(reviewIssueRes.status === 200 && reviewIssueRes.body?.data?.status === 'Inspection Required', 'Supervisor reviews issue and decides Inspection Required');
    }

    // 16. Reports Analytics & 7 Charts Data
    const analyticsRes = await request('GET', '/reports/analytics', null, supToken);
    assert(analyticsRes.status === 200 && analyticsRes.body?.data?.charts, 'Reports Analytics endpoint responds with 200');
    const charts = analyticsRes.body?.data?.charts;
    assert(
      Array.isArray(charts?.monthlyJobVolume) &&
      Array.isArray(charts?.monthlyCost) &&
      Array.isArray(charts?.equipmentCost) &&
      Array.isArray(charts?.maintenanceTypeDistribution) &&
      Array.isArray(charts?.statusDistribution) &&
      Array.isArray(charts?.tyreConditionDistribution) &&
      Array.isArray(charts?.costMismatchSummary),
      'Reports provides calculated data for all 7 required charts'
    );

    // 17. Alerts API
    const alertsRes = await request('GET', '/alerts', null, supToken);
    assert(alertsRes.status === 200 && Array.isArray(alertsRes.body?.data), 'Alerts list retrieved from database');

    console.log('\n========================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
