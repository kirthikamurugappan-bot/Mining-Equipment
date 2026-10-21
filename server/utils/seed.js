/**
 * MineTrack Database Seed Script
 * Inserts realistic mining company operational data into MongoDB
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Equipment = require('../models/Equipment');
const Tyre = require('../models/Tyre');
const Maintenance = require('../models/Maintenance');
const Task = require('../models/Task');
const Issue = require('../models/Issue');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Bill = require('../models/Bill');
const AuditLog = require('../models/AuditLog');

const connectDB = require('../config/db');

async function seed() {
  await connectDB();
  console.log('\n🌱 Starting MineTrack seed...\n');

  // Clear existing database collections
  await mongoose.connection.db.dropDatabase();
  await Promise.all([
    User.syncIndexes(), Equipment.syncIndexes(), Tyre.syncIndexes(),
    Maintenance.syncIndexes(), Task.syncIndexes(), Issue.syncIndexes(),
    Alert.syncIndexes(), Notification.syncIndexes(), Attendance.syncIndexes(), LeaveRequest.syncIndexes(),
    Bill.syncIndexes(), AuditLog.syncIndexes()
  ]);
  console.log('✓ Cleared database and initialized indexes');

  // Helper date generators
  const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
  const daysLater = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

  // ── 1. Users ────────────────────────────────────────────────────────────────
  // Demo accounts:
  // Admin: admin / password123 (or admin@minetrack.com)
  // Supervisor: sup1 / password123 (or sup1@minetrack.com)
  // Worker: ravi01 / password123 (or wrk1@minetrack.com)
  const admin = await User.create({
    userId: 'ADM-001',
    employeeId: 'ADM3001',
    username: 'admin',
    name: 'Rajesh Kumar',
    email: 'admin@minetrack.com',
    password: 'password123',
    role: 'admin',
    phone: '+91 98765 43210',
    department: 'Management',
    designation: 'System Administrator',
    availability: 'Available',
    isActive: true
  });

  const sup1 = await User.create({
    userId: 'SUP-001',
    employeeId: 'SUP2001',
    username: 'sup1',
    name: 'Anand Sharma',
    email: 'sup1@minetrack.com',
    password: 'password123',
    role: 'supervisor',
    phone: '+91 98765 43211',
    department: 'Maintenance',
    designation: 'Maintenance Supervisor',
    availability: 'Available',
    isActive: true
  });

  const sup2 = await User.create({
    userId: 'SUP-002',
    employeeId: 'SUP2002',
    username: 'sup2',
    name: 'Priya Nair',
    email: 'sup2@minetrack.com',
    password: 'password123',
    role: 'supervisor',
    phone: '+91 98765 43212',
    department: 'Operations',
    designation: 'Operations Supervisor',
    availability: 'Available',
    isActive: true
  });

  const workerDocs = [
    {
      userId: 'WRK-001',
      employeeId: 'EMP1001',
      username: 'ravi01',
      name: 'Ravi Singh',
      email: 'wrk1@minetrack.com',
      password: 'password123',
      role: 'worker',
      phone: '+91 98765 43220',
      department: 'Mining Operations',
      designation: 'Dump Truck Operator',
      availability: 'Available',
      isActive: true
    },
    {
      userId: 'WRK-002',
      employeeId: 'EMP1002',
      username: 'suresh02',
      name: 'Suresh Patel',
      email: 'wrk2@minetrack.com',
      password: 'password123',
      role: 'worker',
      phone: '+91 98765 43221',
      department: 'Maintenance',
      designation: 'Tyre Specialist & Mechanic',
      availability: 'Available',
      isActive: true
    },
    {
      userId: 'WRK-003',
      employeeId: 'EMP1003',
      username: 'anil03',
      name: 'Anil Kumar',
      email: 'wrk3@minetrack.com',
      password: 'password123',
      role: 'worker',
      phone: '+91 98765 43222',
      department: 'Material Handling',
      designation: 'Wheel Loader Operator',
      availability: 'On Leave', // Worker on leave for availability test
      isActive: true
    },
    {
      userId: 'WRK-004',
      employeeId: 'EMP1004',
      username: 'deepak04',
      name: 'Deepak Verma',
      email: 'wrk4@minetrack.com',
      password: 'password123',
      role: 'worker',
      phone: '+91 98765 43223',
      department: 'Site Clearing',
      designation: 'Bulldozer Operator',
      availability: 'Available',
      isActive: true
    },
    {
      userId: 'WRK-005',
      employeeId: 'EMP1005',
      username: 'kavitha05',
      name: 'Kavitha Rao',
      email: 'wrk5@minetrack.com',
      password: 'password123',
      role: 'worker',
      phone: '+91 98765 43224',
      department: 'Drilling & Blasting',
      designation: 'Drilling Machine Operator',
      availability: 'Available',
      isActive: true
    }
  ];

  const workers = await Promise.all(workerDocs.map(w => User.create(w)));
  console.log('✓ Created 8 user accounts (1 Admin, 2 Supervisors, 5 Workers)');

  // ── 2. Equipment ────────────────────────────────────────────────────────────
  const equipment = await Equipment.insertMany([
    {
      equipmentId: 'DT-205',
      name: 'DT-205 Dump Truck',
      type: 'Dump Truck',
      model: 'Caterpillar 793F',
      manufacturer: 'Caterpillar Inc.',
      year: 2021,
      serialNumber: 'CAT-793F-2021-001',
      department: 'Mining Operations',
      site: 'Pit Alpha - Sector 1',
      location: 'Pit Alpha - Sector 1',
      purchaseDate: new Date('2021-03-15'),
      status: 'Operational',
      assignedWorker: workers[0]._id, // ravi01
      notes: '240-ton payload heavy dump truck for main overburden haulage.',
      lastMaintenanceDate: daysAgo(5),
      nextMaintenanceDate: daysLater(25),
      createdBy: admin._id
    },
    {
      equipmentId: 'EX-102',
      name: 'EX-102 Hydraulic Excavator',
      type: 'Excavator',
      model: 'Komatsu PC8000-6',
      manufacturer: 'Komatsu Mining Corp.',
      year: 2020,
      serialNumber: 'KOM-8000-2020-002',
      department: 'Mining Operations',
      site: 'Bench B - North Face',
      location: 'Bench B - North Face',
      purchaseDate: new Date('2020-07-20'),
      status: 'Under Maintenance',
      assignedWorker: workers[1]._id, // suresh02
      notes: '42 cubic meter bucket hydraulic excavator for primary rock loading.',
      lastMaintenanceDate: daysAgo(10),
      nextMaintenanceDate: daysLater(2),
      createdBy: admin._id
    },
    {
      equipmentId: 'LD-301',
      name: 'LD-301 Wheel Loader',
      type: 'Wheel Loader',
      model: 'LeTourneau L-2350',
      manufacturer: 'Joy Global / Komatsu',
      year: 2021,
      serialNumber: 'LT-2350-2021-004',
      department: 'Material Handling',
      site: 'Crusher Feed Zone 3',
      location: 'Crusher Feed Zone 3',
      purchaseDate: new Date('2021-09-05'),
      status: 'Operational',
      assignedWorker: workers[2]._id, // anil03 (on leave)
      notes: 'World largest wheel loader, 53 cu yard bucket capacity.',
      lastMaintenanceDate: daysAgo(20),
      nextMaintenanceDate: daysLater(10),
      createdBy: admin._id
    },
    {
      equipmentId: 'BD-110',
      name: 'BD-110 Heavy Bulldozer',
      type: 'Bulldozer',
      model: 'Komatsu D575A-3',
      manufacturer: 'Komatsu Mining Corp.',
      year: 2022,
      serialNumber: 'KOM-575-2022-003',
      department: 'Site Clearing',
      site: 'Waste Dump Sector 4',
      location: 'Waste Dump Sector 4',
      purchaseDate: new Date('2022-01-10'),
      status: 'Operational',
      assignedWorker: workers[3]._id, // deepak04
      notes: 'Super dozer for ripping and mass spoil grading.',
      lastMaintenanceDate: daysAgo(15),
      nextMaintenanceDate: daysAgo(1),
      createdBy: admin._id
    },
    {
      equipmentId: 'DR-405',
      name: 'DR-405 Rotary Drill Rig',
      type: 'Drilling Machine',
      model: 'Atlas Copco Pit Viper 271',
      manufacturer: 'Epiroc / Atlas Copco',
      year: 2020,
      serialNumber: 'AC-271-2020-005',
      department: 'Drilling & Blasting',
      site: 'Bench C - East Ridge',
      location: 'Bench C - East Ridge',
      purchaseDate: new Date('2020-11-30'),
      status: 'Operational',
      assignedWorker: workers[4]._id, // kavitha05
      notes: 'Multi-pass rotary blasthole drilling rig for 270mm diameter holes.',
      lastMaintenanceDate: daysAgo(30),
      nextMaintenanceDate: daysLater(5),
      createdBy: admin._id
    },
    {
      equipmentId: 'GR-012',
      name: 'GR-012 Motor Grader',
      type: 'Grader',
      model: 'Caterpillar 24M',
      manufacturer: 'Caterpillar Inc.',
      year: 2019,
      serialNumber: 'CAT-24M-2019-012',
      department: 'Haul Road Maintenance',
      site: 'Haul Road Junction 2',
      location: 'Haul Road Junction 2',
      purchaseDate: new Date('2019-06-18'),
      status: 'Inactive',
      assignedWorker: null,
      notes: 'Currently decommissioned pending transmission replacement overhaul.',
      lastMaintenanceDate: daysAgo(60),
      nextMaintenanceDate: null,
      createdBy: admin._id
    }
  ]);
  console.log(`✓ Created ${equipment.length} equipment units`);

  // ── 3. Tyres ────────────────────────────────────────────────────────────────
  const tyres = await Tyre.insertMany([
    {
      tyreId: 'TY-1001',
      brand: 'Michelin',
      size: '40.00R57',
      type: 'Radial',
      equipment: equipment[0]._id, // DT-205
      position: 'Front-Left',
      installationDate: new Date('2024-01-15'),
      condition: 'Good',
      status: 'In Service',
      mileage: 12500,
      lastInspectionDate: daysAgo(10),
      nextInspectionDate: daysLater(20),
      notes: 'Tread depth 68mm, uniform wear pattern.',
      createdBy: admin._id
    },
    {
      tyreId: 'TY-1002',
      brand: 'Michelin',
      size: '40.00R57',
      type: 'Radial',
      equipment: equipment[0]._id, // DT-205
      position: 'Front-Right',
      installationDate: new Date('2024-01-15'),
      condition: 'Good',
      status: 'In Service',
      mileage: 12300,
      lastInspectionDate: daysAgo(10),
      nextInspectionDate: daysLater(20),
      notes: 'Tread depth 67mm, optimal condition.',
      createdBy: admin._id
    },
    {
      tyreId: 'TY-1003',
      brand: 'Bridgestone',
      size: '40.00R57',
      type: 'Radial',
      equipment: equipment[0]._id, // DT-205
      position: 'Rear-Left-Outer',
      installationDate: new Date('2023-06-10'),
      condition: 'Warning',
      status: 'In Service',
      mileage: 28000,
      lastInspectionDate: daysAgo(12),
      nextInspectionDate: daysLater(18),
      notes: 'Sidewall rubber scuffing detected. Weekly pressure log monitored.',
      createdBy: admin._id
    },
    {
      tyreId: 'TY-1004',
      brand: 'Bridgestone',
      size: '40.00R57',
      type: 'Radial',
      equipment: equipment[0]._id, // DT-205
      position: 'Rear-Right-Outer',
      installationDate: new Date('2023-06-10'),
      condition: 'Critical',
      status: 'Replacement Required',
      mileage: 31000,
      lastInspectionDate: daysAgo(2),
      nextInspectionDate: daysLater(2),
      notes: 'Severe tread separation on shoulder. Immediate replacement scheduled.',
      createdBy: admin._id
    },
    {
      tyreId: 'TY-1005',
      brand: 'Goodyear',
      size: '37.00R57',
      type: 'Radial',
      equipment: equipment[2]._id, // LD-301
      position: 'Front-Left',
      installationDate: new Date('2024-03-20'),
      condition: 'Good',
      status: 'In Service',
      mileage: 8500,
      lastInspectionDate: daysAgo(15),
      nextInspectionDate: daysLater(15),
      notes: 'Tread depth 72mm. Good traction performance.',
      createdBy: admin._id
    },
    {
      tyreId: 'TY-1006',
      brand: 'Goodyear',
      size: '37.00R57',
      type: 'Radial',
      equipment: equipment[2]._id, // LD-301
      position: 'Front-Right',
      installationDate: new Date('2024-03-20'),
      condition: 'Replacement Required',
      status: 'Replacement Required',
      mileage: 29500,
      lastInspectionDate: daysAgo(3),
      nextInspectionDate: daysLater(4),
      notes: 'Deep rock cut penetrating steel belt. Cannot be re-grooved.',
      createdBy: admin._id
    },
    {
      tyreId: 'TY-1007',
      brand: 'Michelin',
      size: '26.5R25',
      type: 'Radial',
      equipment: null,
      position: 'Spare',
      installationDate: null,
      condition: 'Good',
      status: 'Spare',
      mileage: 0,
      lastInspectionDate: daysAgo(30),
      nextInspectionDate: daysLater(60),
      notes: 'Brand new tyre in central warehouse storage.',
      createdBy: admin._id
    }
  ]);
  console.log(`✓ Created ${tyres.length} tyre records`);

  // ── 4. Maintenance Records (With All Cost Comparison States) ────────────────
  const maintenanceRecords = await Maintenance.insertMany([
    // A) Cost Matched 1: Entered = ₹3,100, Bill = ₹3,100 (from prompt specification)
    {
      maintenanceId: 'MA-1001',
      equipment: equipment[0]._id, // DT-205
      tyre: tyres[0]._id,
      maintenanceType: 'Brake Service',
      priority: 'Medium',
      title: 'Brake Caliper Pad Replacement & Bleed',
      description: 'Routine front brake inspection, brake fluid flush, and friction pad change.',
      scheduledDate: daysAgo(8),
      startDate: daysAgo(8),
      completedDate: daysAgo(7),
      assignedWorker: workers[0]._id,
      supervisor: sup1._id,
      status: 'Completed',
      enteredCost: 3100,
      billCost: 3100,
      variance: 0,
      variancePercentage: 0,
      costStatus: 'Cost Matched',
      costVerificationStatus: 'Cost Matched',
      remarks: 'Brake test passed on haul ramp slope.',
      createdBy: sup1._id
    },
    // B) Cost Mismatch 1: Entered = ₹8,000, Bill = ₹9,500 (from prompt specification)
    {
      maintenanceId: 'MA-1002',
      equipment: equipment[1]._id, // EX-102
      tyre: null,
      maintenanceType: 'Corrective',
      priority: 'High',
      title: 'Hydraulic Hose & Manifold Leak Repair',
      description: 'Replaced burst high pressure return line hose and resealed manifold block.',
      scheduledDate: daysAgo(5),
      startDate: daysAgo(5),
      completedDate: daysAgo(4),
      assignedWorker: workers[1]._id,
      supervisor: sup1._id,
      status: 'Completed',
      enteredCost: 8000,
      billCost: 9500,
      variance: 1500,
      variancePercentage: 18.75,
      costStatus: 'Cost Mismatch',
      costVerificationStatus: 'Pending',
      remarks: 'Vendor invoice included additional unexpected fitting surcharges.',
      createdBy: sup1._id
    },
    // C) Cost Matched 2: Entered = ₹14,200, Bill = ₹14,200
    {
      maintenanceId: 'MA-1003',
      equipment: equipment[0]._id, // DT-205
      tyre: tyres[1]._id,
      maintenanceType: 'Oil Change',
      priority: 'Medium',
      title: 'Engine Lube Oil & Fuel Filter Service',
      description: '45-liter synthetic heavy diesel engine oil drain and 3-stage fuel filter assembly.',
      scheduledDate: daysAgo(12),
      startDate: daysAgo(12),
      completedDate: daysAgo(11),
      assignedWorker: workers[3]._id,
      supervisor: sup1._id,
      status: 'Completed',
      enteredCost: 14200,
      billCost: 14200,
      variance: 0,
      variancePercentage: 0,
      costStatus: 'Cost Matched',
      costVerificationStatus: 'Cost Matched',
      createdBy: sup1._id
    },
    // D) Cost Mismatch 2: Entered = ₹1,25,000, Bill = ₹1,42,000
    {
      maintenanceId: 'MA-1004',
      equipment: equipment[1]._id, // EX-102
      tyre: null,
      maintenanceType: 'Emergency',
      priority: 'Critical',
      title: 'Swing Motor Gearbox Overhaul',
      description: 'Excavator upper carriage swing motor planetary bearing seized during bench extraction.',
      scheduledDate: daysAgo(2),
      startDate: daysAgo(2),
      assignedWorker: workers[1]._id,
      supervisor: sup1._id,
      status: 'In Progress',
      enteredCost: 125000,
      billCost: 142000,
      variance: 17000,
      variancePercentage: 13.6,
      costStatus: 'Cost Mismatch',
      costVerificationStatus: 'Pending',
      remarks: 'Machining work at specialized lathe workshop increased bill total.',
      createdBy: sup1._id
    },
    // E) Bill Cost Missing: Entered = ₹12,500, Bill = null
    {
      maintenanceId: 'MA-1005',
      equipment: equipment[2]._id, // LD-301
      tyre: tyres[4]._id,
      maintenanceType: 'Preventive',
      priority: 'Medium',
      title: 'Wheel Loader Bucket Tooth Re-shanking',
      description: 'Replaced 4 weld-on bucket teeth adapters and shanks.',
      scheduledDate: daysAgo(3),
      startDate: daysAgo(3),
      completedDate: daysAgo(2),
      assignedWorker: workers[0]._id,
      supervisor: sup2._id,
      status: 'Completed',
      enteredCost: 12500,
      billCost: null,
      variance: 0,
      variancePercentage: 0,
      costStatus: 'Bill Cost Missing',
      costVerificationStatus: 'Pending',
      remarks: 'Work completed; awaiting final vendor tax invoice delivery.',
      createdBy: sup2._id
    },
    // F) Entered Cost Missing: Entered = null, Bill = ₹6,800
    {
      maintenanceId: 'MA-1006',
      equipment: equipment[4]._id, // DR-405
      tyre: null,
      maintenanceType: 'Inspection',
      priority: 'Low',
      title: 'Drill Rig Air Compressor Calibration',
      description: 'Third-party certified safety pop-off valve testing and compressor CFM flow audit.',
      scheduledDate: daysAgo(1),
      startDate: daysAgo(1),
      completedDate: daysAgo(1),
      assignedWorker: workers[4]._id,
      supervisor: sup2._id,
      status: 'Completed',
      enteredCost: null,
      billCost: 6800,
      variance: 0,
      variancePercentage: 0,
      costStatus: 'Entered Cost Missing',
      costVerificationStatus: 'Pending',
      createdBy: sup2._id
    },
    // G) Awaiting Cost Data: Entered = null, Bill = null (Scheduled future job)
    {
      maintenanceId: 'MA-1007',
      equipment: equipment[0]._id, // DT-205
      tyre: tyres[3]._id, // TY-1004 (Critical tyre)
      maintenanceType: 'Tyre Maintenance',
      priority: 'Critical',
      title: 'Replace Rear Outer Tyre TY-1004',
      description: 'Dismount critical condition tyre TY-1004 and mount fresh 40.00R57 radial.',
      scheduledDate: daysLater(2),
      assignedWorker: workers[1]._id,
      supervisor: sup1._id,
      status: 'Scheduled',
      enteredCost: null,
      billCost: null,
      variance: 0,
      variancePercentage: 0,
      costStatus: 'Awaiting Cost Data',
      costVerificationStatus: 'Pending',
      createdBy: sup1._id
    },
    // H) Overdue maintenance
    {
      maintenanceId: 'MA-1008',
      equipment: equipment[3]._id, // BD-110
      tyre: null,
      maintenanceType: 'Preventive',
      priority: 'High',
      title: 'Track Tensioning & Under-carriage Measurement',
      description: 'Measure track link pin wear, idler wheel alignment and adjust grease cylinder tension.',
      scheduledDate: daysAgo(10),
      assignedWorker: workers[3]._id,
      supervisor: sup2._id,
      status: 'Overdue',
      enteredCost: 8500,
      billCost: null,
      variance: 0,
      variancePercentage: 0,
      costStatus: 'Bill Cost Missing',
      costVerificationStatus: 'Pending',
      createdBy: sup2._id
    }
  ]);
  console.log(`✓ Created ${maintenanceRecords.length} maintenance records with varied cost comparison states`);

  // ── 5. Equipment Issues / Fault Reports ─────────────────────────────────────
  const issues = await Issue.insertMany([
    {
      issueId: 'ISS-1001',
      equipment: equipment[0]._id, // DT-205
      reportedBy: workers[0]._id, // ravi01
      issueType: 'Brake Failure',
      description: 'Retarder braking temperature sensor triggering warning on downhill grade under full ore payload.',
      priority: 'High',
      date: daysAgo(2),
      status: 'Under Review',
      supervisorDecision: null,
      createdBy: workers[0]._id
    },
    {
      issueId: 'ISS-1002',
      equipment: equipment[1]._id, // EX-102
      reportedBy: workers[1]._id, // suresh02
      issueType: 'Hydraulic Leak',
      description: 'Minor oil weep near boom cylinder main gland packing seal.',
      priority: 'Medium',
      date: daysAgo(4),
      status: 'Maintenance Required',
      supervisorDecision: 'Maintenance Required',
      supervisorRemarks: 'Included in MA-1002 scope of work.',
      reviewedBy: sup1._id,
      reviewedAt: daysAgo(3),
      relatedMaintenance: maintenanceRecords[1]._id
    },
    {
      issueId: 'ISS-1003',
      equipment: equipment[4]._id, // DR-405
      reportedBy: workers[4]._id, // kavitha05
      issueType: 'Abnormal Noise/Vibration',
      description: 'Rotation head gear case emitting loud metallic grinding tone above 60 RPM.',
      priority: 'Critical',
      date: daysAgo(1),
      status: 'Inspection Required',
      supervisorDecision: 'Inspection Required',
      supervisorRemarks: 'Technician inspection task assigned immediately.',
      reviewedBy: sup2._id,
      reviewedAt: daysAgo(1)
    },
    {
      issueId: 'ISS-1004',
      equipment: equipment[3]._id, // BD-110
      reportedBy: workers[3]._id, // deepak04
      issueType: 'Electrical Issue',
      description: 'Cabin HVAC blower fan not turning on in high speed position.',
      priority: 'Low',
      date: daysAgo(5),
      status: 'No Action Required',
      supervisorDecision: 'No Action Required',
      supervisorRemarks: 'Operator dial was loose on spline; tightened and verified functioning.',
      reviewedBy: sup2._id,
      reviewedAt: daysAgo(4)
    }
  ]);
  console.log(`✓ Created ${issues.length} fault issue reports`);

  // ── 6. Tasks ────────────────────────────────────────────────────────────────
  const tasks = await Task.insertMany([
    {
      taskId: 'TSK-1001',
      title: 'Replace Critical Tyre TY-1004 on DT-205',
      description: 'Tyre TY-1004 has severe shoulder damage. Transport new radial from warehouse and install with torque wrench.',
      equipment: equipment[0]._id,
      maintenance: maintenanceRecords[6]._id,
      assignedWorker: workers[1]._id, // suresh02
      createdBy: sup1._id,
      priority: 'Critical',
      status: 'Assigned',
      assignedDate: daysAgo(1),
      dueDate: daysLater(2),
      instructions: '1. Lock out dump truck. 2. Verify tire bead breaker pressure. 3. Torque nuts to 850 Nm.',
      remarks: 'Awaiting bay availability.'
    },
    {
      taskId: 'TSK-1002',
      title: 'Inspect Retarder Temperature Warning on DT-205',
      description: 'Check brake thermal sensor wiring harness and radiator cooling flow as reported in ISS-1001.',
      equipment: equipment[0]._id,
      assignedWorker: workers[0]._id, // ravi01
      createdBy: sup1._id,
      priority: 'High',
      status: 'Acknowledged',
      assignedDate: daysAgo(2),
      acknowledgedDate: daysAgo(1),
      dueDate: daysLater(1),
      instructions: 'Connect diagnostic handheld scanner and clear fault codes after testing.',
      workerRemarks: 'Acknowledged task. Scanning planned for afternoon shift.'
    },
    {
      taskId: 'TSK-1003',
      title: 'Excavator Swing Motor Gearbox Teardown',
      description: 'Disassemble planetary drive gears and inspect teeth for pitting or spalling.',
      equipment: equipment[1]._id,
      maintenance: maintenanceRecords[3]._id,
      assignedWorker: workers[1]._id, // suresh02
      createdBy: sup1._id,
      priority: 'Critical',
      status: 'In Progress',
      assignedDate: daysAgo(3),
      acknowledgedDate: daysAgo(3),
      startDate: daysAgo(2),
      dueDate: daysLater(3),
      progressPercentage: 55,
      workerRemarks: 'Main carrier bearing pulled; gear teeth intact, bearings replacement underway.'
    },
    {
      taskId: 'TSK-1004',
      title: 'Routine Daily Pre-Op Inspection - DT-205',
      description: 'Execute mandatory 20-point pre-shift equipment safety checklist before pit entry.',
      equipment: equipment[0]._id,
      assignedWorker: workers[0]._id, // ravi01
      createdBy: sup1._id,
      priority: 'Medium',
      status: 'Completed',
      assignedDate: daysAgo(4),
      acknowledgedDate: daysAgo(4),
      startDate: daysAgo(4),
      dueDate: daysAgo(3),
      completedDate: daysAgo(3),
      progressPercentage: 100,
      workerRemarks: 'All safety interlocks, fire suppression, and steering secondary pumps tested normal.'
    },
    {
      taskId: 'TSK-1005',
      title: 'Bulldozer Track Tensioning Maintenance - OVERDUE',
      description: 'Scheduled undercarriage track tensioning for BD-110.',
      equipment: equipment[3]._id,
      maintenance: maintenanceRecords[7]._id,
      assignedWorker: workers[3]._id, // deepak04
      createdBy: sup2._id,
      priority: 'High',
      status: 'Overdue',
      assignedDate: daysAgo(15),
      dueDate: daysAgo(10),
      instructions: 'Check sag between carrier rollers (nominal 50mm).'
    },
    {
      taskId: 'TSK-1006',
      title: 'Drill Rig Rotation Head Acoustic Inspection',
      description: 'Perform frequency vibration analysis on DR-405 rotation head as per ISS-1003.',
      equipment: equipment[4]._id,
      assignedWorker: workers[4]._id, // kavitha05
      createdBy: sup2._id,
      priority: 'High',
      status: 'Assigned',
      assignedDate: daysAgo(1),
      dueDate: daysLater(2),
      instructions: 'Use accelerometer probe on top flange and log readings.'
    }
  ]);
  console.log(`✓ Created ${tasks.length} task workflow records`);

  // ── 7. Alerts ───────────────────────────────────────────────────────────────
  await Alert.insertMany([
    // Cost Mismatch alert
    {
      alertId: 'ALT-1001',
      type: 'cost_mismatch',
      title: 'Cost Mismatch: MA-1002',
      message: 'Maintenance MA-1002 has cost mismatch: Entered ₹8,000 vs Bill ₹9,500 (Variance: ₹1,500, 18.75%). Supervisor review required.',
      priority: 'High',
      severity: 'critical',
      status: 'Active',
      targetRole: 'supervisor',
      relatedModule: 'maintenance',
      relatedId: maintenanceRecords[1]._id
    },
    {
      alertId: 'ALT-1002',
      type: 'cost_mismatch',
      title: 'Cost Mismatch: MA-1004',
      message: 'Maintenance MA-1004 has cost mismatch: Entered ₹1,25,000 vs Bill ₹1,42,000 (Variance: ₹17,000, 13.6%). Supervisor review required.',
      priority: 'Critical',
      severity: 'critical',
      status: 'Active',
      targetRole: 'supervisor',
      relatedModule: 'maintenance',
      relatedId: maintenanceRecords[3]._id
    },
    // Tyre alert
    {
      alertId: 'ALT-1003',
      type: 'tyre_alert',
      title: 'Critical Tyre Condition: TY-1004',
      message: 'Tyre TY-1004 (Bridgestone 40.00R57) on DT-205 Dump Truck (Rear-Right) is in CRITICAL condition. Immediate replacement required.',
      priority: 'Critical',
      severity: 'critical',
      status: 'Active',
      targetRole: 'supervisor',
      relatedModule: 'tyre',
      relatedId: tyres[3]._id
    },
    // Maintenance due
    {
      alertId: 'ALT-1004',
      type: 'maintenance_due',
      title: 'Maintenance Due: MA-1007',
      message: 'Tyre replacement MA-1007 on DT-205 is scheduled in 2 days.',
      priority: 'High',
      severity: 'warning',
      status: 'Active',
      targetRole: 'supervisor',
      relatedModule: 'maintenance',
      relatedId: maintenanceRecords[6]._id
    },
    // Maintenance overdue
    {
      alertId: 'ALT-1005',
      type: 'maintenance_overdue',
      title: 'Maintenance Overdue: MA-1008',
      message: 'Maintenance MA-1008 on BD-110 Bulldozer is overdue by 10 days.',
      priority: 'High',
      severity: 'critical',
      status: 'Active',
      targetRole: 'supervisor',
      relatedModule: 'maintenance',
      relatedId: maintenanceRecords[7]._id
    },
    // Task overdue
    {
      alertId: 'ALT-1006',
      type: 'task_overdue',
      title: 'Task Overdue: TSK-1005',
      message: 'Task TSK-1005 (Bulldozer Track Tensioning) assigned to Deepak Verma is overdue.',
      priority: 'High',
      severity: 'warning',
      status: 'Active',
      targetRole: 'supervisor',
      relatedModule: 'task',
      relatedId: tasks[4]._id
    },
    // Worker unavailable alert
    {
      alertId: 'ALT-1007',
      type: 'worker_unavailable',
      title: 'Worker Unavailable: Anil Kumar',
      message: 'Worker Anil Kumar (WRK-003) is currently On Leave. Reassignment or rescheduling is required for pending wheel loader tasks.',
      priority: 'Medium',
      severity: 'warning',
      status: 'Active',
      targetRole: 'supervisor',
      relatedModule: 'task',
      relatedId: tasks[0]._id
    },
    // Worker specific alert
    {
      alertId: 'ALT-1008',
      type: 'task_assigned',
      title: 'New Task Assigned: TSK-1002',
      message: 'You have been assigned task "Inspect Retarder Temperature Warning on DT-205". Please acknowledge.',
      priority: 'High',
      severity: 'info',
      status: 'Acknowledged',
      targetUser: workers[0]._id, // ravi01
      relatedModule: 'task',
      relatedId: tasks[1]._id
    }
  ]);
  console.log('✓ Created 8 operational alerts');

  // ── 8. Attendance ───────────────────────────────────────────────────────────
  const allWorkers = workers;
  const attendanceDocs = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Today's attendance
  attendanceDocs.push(
    { worker: workers[0]._id, date: today, checkIn: new Date(today.getTime() + 7.5 * 3600000), status: 'Present' },
    { worker: workers[1]._id, date: today, checkIn: new Date(today.getTime() + 8 * 3600000), status: 'Present' },
    { worker: workers[2]._id, date: today, status: 'Leave', remarks: 'Annual sanctioned leave' },
    { worker: workers[3]._id, date: today, checkIn: new Date(today.getTime() + 7.8 * 3600000), status: 'Present' },
    { worker: workers[4]._id, date: today, checkIn: new Date(today.getTime() + 8.2 * 3600000), status: 'Present' }
  );

  // Past 20 days attendance
  for (let d = 1; d <= 20; d++) {
    const curDate = new Date();
    curDate.setDate(curDate.getDate() - d);
    curDate.setHours(0, 0, 0, 0);

    for (const w of allWorkers) {
      if (d % 7 === 0) continue; // Sunday off
      const isAbsent = Math.random() < 0.05;
      const inTime = new Date(curDate.getTime() + 8 * 3600000 + Math.floor(Math.random() * 25) * 60000);
      const outTime = new Date(curDate.getTime() + 17 * 3600000 + Math.floor(Math.random() * 30) * 60000);

      attendanceDocs.push({
        worker: w._id,
        date: curDate,
        checkIn: isAbsent ? undefined : inTime,
        checkOut: isAbsent ? undefined : outTime,
        status: isAbsent ? 'Absent' : 'Present',
        hoursWorked: isAbsent ? 0 : 9
      });
    }
  }
  await Attendance.insertMany(attendanceDocs);
  console.log(`✓ Created ${attendanceDocs.length} attendance logs`);

  // ── 9. Leave Requests ───────────────────────────────────────────────────────
  await LeaveRequest.insertMany([
    {
      leaveId: 'LV-1001',
      worker: workers[2]._id, // anil03
      leaveType: 'Annual Leave',
      startDate: daysAgo(2),
      endDate: daysLater(5),
      totalDays: 8,
      reason: 'Attending family wedding in home village.',
      status: 'Approved',
      reviewedBy: sup2._id,
      reviewDate: daysAgo(3),
      reviewRemarks: 'Approved. Relieved by temporary operator.',
      createdBy: workers[2]._id
    },
    {
      leaveId: 'LV-1002',
      worker: workers[0]._id, // ravi01
      leaveType: 'Casual Leave',
      startDate: daysLater(10),
      endDate: daysLater(12),
      totalDays: 3,
      reason: 'Personal administrative work.',
      status: 'Pending',
      createdBy: workers[0]._id
    }
  ]);
  console.log('✓ Created leave records');

  // ── 10. Audit Logs ──────────────────────────────────────────────────────────
  await AuditLog.insertMany([
    {
      auditId: 'AUD-01001',
      user: admin._id,
      userRole: 'admin',
      action: 'System Initialized',
      module: 'general',
      description: 'System seed initialized with standard mining asset master records.'
    },
    {
      auditId: 'AUD-01002',
      user: sup1._id,
      userRole: 'supervisor',
      action: 'Create Maintenance',
      module: 'maintenance',
      recordId: 'MA-1001',
      description: 'Supervisor Anand Sharma created maintenance MA-1001 for Brake Caliper Pad Replacement.'
    },
    {
      auditId: 'AUD-01003',
      user: workers[0]._id,
      userRole: 'worker',
      action: 'Report Fault Issue',
      module: 'issue',
      recordId: 'ISS-1001',
      description: 'Worker Ravi Singh reported brake retarder warning on DT-205.'
    },
    {
      auditId: 'AUD-01004',
      user: sup1._id,
      userRole: 'supervisor',
      action: 'Create Task',
      module: 'task',
      recordId: 'TSK-1001',
      description: 'Supervisor Anand Sharma assigned tyre replacement task TSK-1001 to Suresh Patel.'
    }
  ]);
  console.log('✓ Created audit log records');

  console.log('\n======================================================');
  console.log('✅ MINETRACK DATABASE SEEDED SUCCESSFULLY!');
  console.log('======================================================');
  console.log('DEMO ACCOUNTS (Single Login Page):');
  console.log('------------------------------------------------------');
  console.log('👤 ADMIN:');
  console.log('   Username: admin    (or ADM-001, admin@minetrack.com)');
  console.log('   Password: password123');
  console.log('------------------------------------------------------');
  console.log('👷 SUPERVISOR:');
  console.log('   Username: sup1     (or SUP-001, sup1@minetrack.com)');
  console.log('   Password: password123');
  console.log('   Username: sup2     (or SUP-002, sup2@minetrack.com)');
  console.log('   Password: password123');
  console.log('------------------------------------------------------');
  console.log('🚜 WORKER:');
  console.log('   Username: ravi01   (or WRK-001, wrk1@minetrack.com)');
  console.log('   Password: password123');
  console.log('   Username: suresh02 (or WRK-002, wrk2@minetrack.com)');
  console.log('   Password: password123');
  console.log('   Username: anil03   (On Leave)');
  console.log('   Password: password123');
  console.log('======================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
