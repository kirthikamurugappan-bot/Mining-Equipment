const API_BASE = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runE2EWorkflow() {
  console.log('====================================================');
  console.log('🚀 MINETRACK COMPLETE END-TO-END WORKFLOW VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // PHASE 1: SINGLE LOGIN & ROLE VERIFICATION (NO ROLE DROPDOWN)
    // ----------------------------------------------------
    console.log('--- TEST GROUP 1: Single Login & Role Identification ---');

    // 1. Worker Login (ravi01)
    const workerAuthRes = await req('/auth/login', {
      method: 'POST',
      body: { username: 'ravi01', password: 'password123' }
    });
    assert(workerAuthRes.data.success, 'Worker ravi01 authenticated successfully');
    assert(workerAuthRes.data.user.role === 'worker', 'Backend identified role as WORKER from MongoDB');
    const workerToken = workerAuthRes.data.token;
    const workerHeaders = { Authorization: `Bearer ${workerToken}` };

    // 2. Supervisor Login (sup1)
    const supAuthRes = await req('/auth/login', {
      method: 'POST',
      body: { username: 'sup1', password: 'password123' }
    });
    assert(supAuthRes.data.success, 'Supervisor sup1 authenticated successfully');
    assert(supAuthRes.data.user.role === 'supervisor', 'Backend identified role as SUPERVISOR from MongoDB');
    const supToken = supAuthRes.data.token;
    const supHeaders = { Authorization: `Bearer ${supToken}` };

    // 3. Admin Login (admin)
    const adminAuthRes = await req('/auth/login', {
      method: 'POST',
      body: { username: 'admin', password: 'password123' }
    });
    assert(adminAuthRes.data.success, 'Admin authenticated successfully');
    assert(adminAuthRes.data.user.role === 'admin', 'Backend identified role as ADMIN from MongoDB');
    const adminToken = adminAuthRes.data.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 4. Inactive user rejection test
    const inactiveRes = await req('/auth/login', {
      method: 'POST',
      body: { username: 'inactive_worker', password: 'password123' }
    });
    assert(!inactiveRes.data.success && (inactiveRes.status === 401 || inactiveRes.data.message?.includes('inactive')), 'Inactive user login correctly rejected');

    // ----------------------------------------------------
    // PHASE 2: WORKER END-TO-END FLOW
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 2: Worker Pit Operations Flow ---');

    // Worker gets assigned equipment
    const eqRes = await req('/equipment', { headers: workerHeaders });
    assert(eqRes.data.success && eqRes.data.data.length > 0, `Worker retrieved fleet list (${eqRes.data.data.length} machines)`);
    const targetEq = eqRes.data.data[0];

    // Worker gets assigned tasks
    const tasksRes = await req('/tasks', { headers: workerHeaders });
    assert(tasksRes.data.success, `Worker retrieved assigned tasks (${tasksRes.data.data.length} tasks)`);
    const testTask = tasksRes.data.data[0];

    if (testTask) {
      // Worker acknowledges task
      const ackRes = await req(`/tasks/${testTask._id}/acknowledge`, { method: 'PUT', headers: workerHeaders });
      assert(ackRes.data.success && ackRes.data.data.status === 'Acknowledged', 'Worker acknowledged task');

      // Worker starts task
      const startRes = await req(`/tasks/${testTask._id}/start`, { method: 'PUT', headers: workerHeaders });
      assert(startRes.data.success && startRes.data.data.status === 'In Progress', 'Worker started task (In Progress)');

      // Worker adds remarks
      const remarksRes = await req(`/tasks/${testTask._id}/remarks`, {
        method: 'PUT',
        headers: workerHeaders,
        body: { remarks: 'Pre-shift inspection completed. Oil pressure normal at 45 PSI.' }
      });
      assert(remarksRes.data.success, 'Worker recorded operational remarks');

      // Worker completes task
      const completeRes = await req(`/tasks/${testTask._id}/complete`, { method: 'PUT', headers: workerHeaders });
      assert(completeRes.data.success && completeRes.data.data.status === 'Completed', 'Worker completed task');
    }

    // Worker reports equipment fault issue
    const reportIssueRes = await req('/issues', {
      method: 'POST',
      headers: workerHeaders,
      body: {
        equipment: targetEq._id,
        issueType: 'Hydraulic',
        description: 'Minor hydraulic hose seepage detected during daily pre-start walkaround.',
        priority: 'High'
      }
    });
    assert(reportIssueRes.data.success, 'Worker reported equipment issue successfully');
    const createdIssueId = reportIssueRes.data.data._id;

    // Worker attendance check
    const todayAttRes = await req('/attendance/today', { headers: workerHeaders });
    assert(todayAttRes.data.success, 'Worker retrieved live shift attendance status');

    // ----------------------------------------------------
    // PHASE 3: SUPERVISOR TRIAGE & AUTOMATIC COST COMPARISON
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 3: Supervisor Triage, Maintenance & Cost Reconciliation ---');

    // Supervisor reviews newly reported issue
    const reviewIssueRes = await req(`/issues/${createdIssueId}/review`, {
      method: 'PUT',
      headers: supHeaders,
      body: {
        supervisorDecision: 'Maintenance Required',
        supervisorRemarks: 'Scheduled for pit workshop hydraulic seal replacement.'
      }
    });
    assert(reviewIssueRes.data.success && reviewIssueRes.data.data.status === 'Maintenance Required', 'Supervisor triaged issue to Maintenance Required');

    // Supervisor schedules maintenance
    const schedMaintRes = await req('/maintenance', {
      method: 'POST',
      headers: supHeaders,
      body: {
        maintenanceId: `MNT-TST-${Date.now().toString().slice(-4)}`,
        title: 'Hydraulic Coupling Replacement',
        equipment: targetEq._id,
        maintenanceType: 'Corrective',
        priority: 'High',
        scheduledDate: new Date(),
        description: 'Replace hydraulic coupling and test under load.',
        enteredCost: 8000,
        totalCost: 8000,
        billCost: 9500
      }
    });
    assert(schedMaintRes.data.success, 'Supervisor scheduled maintenance job with Entered ₹8,000 and Bill ₹9,500');
    const createdMaint = schedMaintRes.data.data;

    // Verify automatic cost comparison
    assert(createdMaint.costStatus === 'Cost Mismatch', `System classified status as Cost Mismatch (Variance = ₹${createdMaint.variance})`);
    assert(createdMaint.variance === 1500, 'Calculated variance matches formula (9500 - 8000 = 1500)');
    assert(createdMaint.variancePercentage === 18.75, 'Calculated variance % matches formula (18.75%)');

    // Supervisor reviews cost mismatch
    const reviewCostRes = await req(`/maintenance/${createdMaint._id}/review-cost`, {
      method: 'PUT',
      headers: supHeaders,
      body: {
        decision: 'Approved',
        remarks: 'Approved additional ₹1,500 due to rush delivery of high-pressure replacement seal.'
      }
    });
    assert(reviewCostRes.data.success, 'Supervisor reviewed and approved cost mismatch');

    // Worker availability check enforcement
    const workersListRes = await req('/users/workers', { headers: supHeaders });
    const onLeaveWorker = workersListRes.data.data.find(w => w.availability === 'On Leave');
    if (onLeaveWorker) {
      const leaveTaskRes = await req('/tasks', {
        method: 'POST',
        headers: supHeaders,
        body: {
          title: 'Emergency Tyre Inflation',
          equipment: targetEq._id,
          assignedWorker: onLeaveWorker._id,
          priority: 'Critical',
          dueDate: new Date()
        }
      });
      assert(!leaveTaskRes.ok && leaveTaskRes.status === 400, 'Worker availability check strictly enforced: Worker on leave cannot be assigned');
    }

    // ----------------------------------------------------
    // PHASE 4: REPORTS, ANALYTICS & INR COMPLIANCE
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 4: Real MongoDB Reports & Analytics ---');

    const analyticsRes = await req('/reports/analytics?year=2026', { headers: supHeaders });
    assert(analyticsRes.data.success, 'Analytics endpoint returned real database report');
    const charts = analyticsRes.data.data.charts;
    assert(Array.isArray(charts.monthlyJobVolume), 'Chart 1: Monthly job volume dataset present');
    assert(Array.isArray(charts.monthlyCost), 'Chart 2: Monthly maintenance cost dataset present');
    assert(Array.isArray(charts.equipmentCost), 'Chart 3: Equipment-wise cost dataset present');
    assert(Array.isArray(charts.maintenanceTypeDistribution), 'Chart 4: Type distribution dataset present');
    assert(Array.isArray(charts.statusDistribution), 'Chart 5: Status distribution dataset present');
    assert(Array.isArray(charts.tyreConditionDistribution), 'Chart 6: Tyre condition dataset present');
    assert(Array.isArray(charts.costMismatchSummary), 'Chart 7: Cost mismatch summary dataset present');

    // ----------------------------------------------------
    // PHASE 5: ADMIN USER MANAGEMENT & AUDIT TRAIL
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 5: Admin Management & Audit Trails ---');

    // Admin creates new employee user account
    const newEmpRes = await req('/users', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        name: 'Rohan Verma',
        username: `rohan${Date.now().toString().slice(-4)}`,
        employeeId: `EMP${Math.floor(1000 + Math.random() * 9000)}`,
        email: `rohan${Date.now().toString().slice(-4)}@minetrack.com`,
        password: 'password123',
        role: 'worker',
        department: 'Pit Operations',
        designation: 'Excavator Operator',
        availability: 'Available'
      }
    });
    assert(newEmpRes.data.success, 'Admin successfully created new employee account');
    assert(!newEmpRes.data.data?.password, 'Password hash is NOT exposed in response');

    // Admin inspects audit trail
    const auditRes = await req('/audit?limit=10', { headers: adminHeaders });
    assert(auditRes.data.success && auditRes.data.data.length > 0, `Audit trail recorded operations (${auditRes.data.data.length} recent events)`);

    console.log('\n====================================================');
    console.log(`SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal execution error during E2E testing:', err.message);
    process.exit(1);
  }
}

runE2EWorkflow();
