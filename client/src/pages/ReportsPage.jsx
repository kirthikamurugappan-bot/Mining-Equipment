import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  BarChart3,
  Download,
  Filter,
  Calendar,
  Truck,
  Wrench,
  Disc,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#2563EB', '#0F766E', '#16A34A', '#F59E0B', '#DC2626', '#7C3AED', '#EC4899', '#6366F1'];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [equipmentList, setEquipmentList] = useState([]);

  // Filters
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('');
  const [status, setStatus] = useState('');

  // Refs for PDF capture
  const pdfRef = useRef(null);
  const chart1Ref = useRef(null);
  const chart2Ref = useRef(null);
  const chart3Ref = useRef(null);
  const chart4Ref = useRef(null);
  const chart5Ref = useRef(null);
  const chart6Ref = useRef(null);
  const chart7Ref = useRef(null);

  useEffect(() => {
    fetchEquipment();
    fetchAnalytics();
  }, [year, month, selectedEquipment, maintenanceType, status]);

  const fetchEquipment = async () => {
    try {
      const res = await api.get('/equipment?limit=100');
      if (res.data?.success) setEquipmentList(res.data.data || []);
    } catch {
      // Ignore
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let url = `/reports/analytics?year=${year}`;
      if (month) url += `&month=${month}`;
      if (selectedEquipment) url += `&equipment=${selectedEquipment}`;
      if (maintenanceType) url += `&maintenanceType=${maintenanceType}`;
      if (status) url += `&status=${status}`;

      const res = await api.get(url);
      if (res.data?.success) {
        setAnalyticsData(res.data.data);
      }
    } catch (err) {
      toast.error('Unable to load analytics report.');
    } finally {
      setLoading(false);
    }
  };

  // High-Quality Multi-Page Non-Clipped PDF Generator
  const generatePDF = async () => {
    setGeneratingPdf(true);
    const toastId = toast.loading('Generating enterprise multi-page PDF report with charts...');

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const usableWidth = pageWidth - (margin * 2);

      // --- PAGE 1: Header + Summary Metrics + Chart 1 & 2 ---
      // Top Header
      pdf.setFillColor(15, 23, 42); // #0F172A
      pdf.rect(0, 0, pageWidth, 28, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('MineTrack — Fleet Maintenance & Cost Report', margin, 14);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(`Generated: ${new Date().toLocaleString()} | Mining Equipment & Tyre Platform`, margin, 21);

      // Summary KPI Grid
      let y = 36;
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Executive Maintenance & Cost Summary (INR ₹)', margin, y);
      y += 6;

      const summary = analyticsData?.summary || {};
      const kpis = [
        ['Total Maintenance Jobs', `${summary.totalJobs || 0}`],
        ['Completed Jobs', `${summary.completed || 0}`],
        ['Pending / In Progress', `${summary.pending || 0}`],
        ['Overdue Operations', `${summary.overdue || 0}`],
        ['Total Maintenance Cost', `${formatINR(summary.totalCost || 0)}`],
        ['Cost Mismatch Variance', `${formatINR(summary.costMismatchAmount || 0)}`],
        ['Machines Serviced', `${summary.equipmentServiced || 0}`],
        ['Tyres Serviced / Checked', `${summary.tyresServiced || 0}`]
      ];

      const boxWidth = (usableWidth - 9) / 4;
      const boxHeight = 16;
      kpis.forEach((kpi, idx) => {
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        const bx = margin + (col * (boxWidth + 3));
        const by = y + (row * (boxHeight + 3));

        pdf.setFillColor(248, 250, 252);
        pdf.setDrawColor(226, 232, 240);
        pdf.roundedRect(bx, by, boxWidth, boxHeight, 2, 2, 'FD');

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text(kpi[0], bx + 3, by + 5);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9.5);
        pdf.setTextColor(15, 23, 42);
        pdf.text(kpi[1], bx + 3, by + 12);
      });

      y += (boxHeight * 2) + 12;

      // Capture Chart 1 & Chart 2 onto Page 1
      if (chart1Ref.current) {
        const canvas1 = await html2canvas(chart1Ref.current, { scale: 2 });
        const imgData1 = canvas1.toDataURL('image/png');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(30, 41, 59);
        pdf.text('1. Monthly Maintenance Job Volume Trend', margin, y);
        y += 4;
        const chartH = 68;
        pdf.addImage(imgData1, 'PNG', margin, y, usableWidth, chartH);
        y += chartH + 10;
      }

      if (chart2Ref.current) {
        const canvas2 = await html2canvas(chart2Ref.current, { scale: 2 });
        const imgData2 = canvas2.toDataURL('image/png');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(30, 41, 59);
        pdf.text('2. Monthly Maintenance Expenditure (INR ₹)', margin, y);
        y += 4;
        const chartH = 68;
        pdf.addImage(imgData2, 'PNG', margin, y, usableWidth, chartH);
      }

      // --- PAGE 2: Chart 3, 4, 5 (Clean Page Break) ---
      pdf.addPage();
      y = 16;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(15, 23, 42);
      pdf.text('MineTrack Analytics Section — Breakdown & Distribution', margin, y);
      y += 8;

      if (chart3Ref.current) {
        const canvas3 = await html2canvas(chart3Ref.current, { scale: 2 });
        const imgData3 = canvas3.toDataURL('image/png');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('3. Equipment-wise Maintenance Cost', margin, y);
        y += 4;
        const chartH = 70;
        pdf.addImage(imgData3, 'PNG', margin, y, usableWidth, chartH);
        y += chartH + 10;
      }

      // Chart 4 & 5 Side by Side on Page 2
      const halfW = (usableWidth - 6) / 2;
      const chartH2 = 75;

      if (chart4Ref.current && chart5Ref.current) {
        const canvas4 = await html2canvas(chart4Ref.current, { scale: 2 });
        const imgData4 = canvas4.toDataURL('image/png');
        const canvas5 = await html2canvas(chart5Ref.current, { scale: 2 });
        const imgData5 = canvas5.toDataURL('image/png');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('4. Maintenance Type Distribution', margin, y);
        pdf.text('5. Operational Status Breakdown', margin + halfW + 6, y);
        y += 4;

        pdf.addImage(imgData4, 'PNG', margin, y, halfW, chartH2);
        pdf.addImage(imgData5, 'PNG', margin + halfW + 6, y, halfW, chartH2);
      }

      // --- PAGE 3: Chart 6 & 7 + Recent Maintenance Table ---
      pdf.addPage();
      y = 16;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(15, 23, 42);
      pdf.text('MineTrack Audit Section — Tyres, Cost Reconciliation & Operations', margin, y);
      y += 8;

      if (chart6Ref.current && chart7Ref.current) {
        const canvas6 = await html2canvas(chart6Ref.current, { scale: 2 });
        const imgData6 = canvas6.toDataURL('image/png');
        const canvas7 = await html2canvas(chart7Ref.current, { scale: 2 });
        const imgData7 = canvas7.toDataURL('image/png');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('6. OTR Tyre Condition Distribution', margin, y);
        pdf.text('7. Cost Mismatch & Reconciliation Overview', margin + halfW + 6, y);
        y += 4;

        pdf.addImage(imgData6, 'PNG', margin, y, halfW, chartH2);
        pdf.addImage(imgData7, 'PNG', margin + halfW + 6, y, halfW, chartH2);
        y += chartH2 + 12;
      }

      // Maintenance Logs Table Summary
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(15, 23, 42);
      pdf.text('Operational Maintenance Log Records (Sample Roster)', margin, y);
      y += 6;

      const records = analyticsData?.records || [];
      const colWidths = [26, 40, 32, 26, 26, 32];
      const headers = ['Job ID', 'Equipment', 'Type', 'Date', 'Status', 'Cost (INR)'];

      // Table Header Row
      pdf.setFillColor(241, 245, 249);
      pdf.rect(margin, y, usableWidth, 7, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(51, 65, 85);

      let curX = margin + 2;
      headers.forEach((h, i) => {
        pdf.text(h, curX, y + 5);
        curX += colWidths[i];
      });
      y += 8;

      // Table Data Rows
      records.slice(0, 10).forEach((rec, idx) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(30, 41, 59);

        let rowX = margin + 2;
        pdf.text(rec.maintenanceId || '', rowX, y + 4);
        rowX += colWidths[0];

        pdf.text(rec.equipment?.name?.substring(0, 20) || 'Equipment', rowX, y + 4);
        rowX += colWidths[1];

        pdf.text(rec.maintenanceType || '', rowX, y + 4);
        rowX += colWidths[2];

        pdf.text(formatDate(rec.scheduledDate), rowX, y + 4);
        rowX += colWidths[3];

        pdf.text(rec.status || '', rowX, y + 4);
        rowX += colWidths[4];

        pdf.text(formatINR(rec.totalCost || 0), rowX, y + 4);

        pdf.setDrawColor(241, 245, 249);
        pdf.line(margin, y + 6, margin + usableWidth, y + 6);
        y += 7;
      });

      // Save PDF
      pdf.save(`MineTrack_Analytics_Report_${year}.pdf`);
      toast.success('Enterprise PDF report generated successfully!', { id: toastId });
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to generate PDF.', { id: toastId });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const summary = analyticsData?.summary || {};
  const charts = analyticsData?.charts || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        padding: '24px 28px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
            Fleet Analytics & Operational Reports
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Real-time analytics across equipment, tyre degradation, maintenance schedules, and automated cost reconciliation.
          </p>
        </div>

        <button
          onClick={generatePDF}
          disabled={generatingPdf || loading}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            backgroundColor: '#0F766E',
            borderColor: '#0F766E'
          }}
        >
          <Download size={18} />
          <span>{generatingPdf ? 'Generating PDF...' : 'Export Complete PDF Report'}</span>
        </button>
      </div>

      {/* Real MongoDB Filter Controls */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '14px',
        border: '1px solid var(--border-color)',
        padding: '16px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '12px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
          <Filter size={16} />
          <span>Filters:</span>
        </div>

        {/* Year Filter */}
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
        >
          <option value="2026">Year 2026</option>
          <option value="2025">Year 2025</option>
          <option value="2024">Year 2024</option>
        </select>

        {/* Month Filter */}
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
        >
          <option value="">Full Year</option>
          <option value="1">January</option>
          <option value="2">February</option>
          <option value="3">March</option>
          <option value="4">April</option>
          <option value="5">May</option>
          <option value="6">June</option>
          <option value="7">July</option>
          <option value="8">August</option>
          <option value="9">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>

        {/* Machine Filter */}
        <select
          value={selectedEquipment}
          onChange={(e) => setSelectedEquipment(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
        >
          <option value="">All Mining Machines</option>
          {equipmentList.map(eq => (
            <option key={eq._id} value={eq._id}>{eq.equipmentId} - {eq.name}</option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={maintenanceType}
          onChange={(e) => setMaintenanceType(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
        >
          <option value="">All Maintenance Types</option>
          <option value="Preventive">Preventive</option>
          <option value="Corrective">Corrective</option>
          <option value="Emergency">Emergency</option>
          <option value="Oil Change">Oil Change</option>
          <option value="Brake Service">Brake Service</option>
          <option value="Tyre Maintenance">Tyre Maintenance</option>
        </select>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
        >
          <option value="">All Job Statuses</option>
          <option value="Completed">Completed</option>
          <option value="Scheduled">Scheduled</option>
          <option value="In Progress">In Progress</option>
          <option value="Pending">Pending</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>

      {/* 8 Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Maintenance Jobs</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)' }}>{summary.totalJobs || 0}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Completed Jobs</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#16A34A' }}>{summary.completed || 0}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pending / In Progress</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#F59E0B' }}>{summary.pending || 0}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Overdue Jobs</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#DC2626' }}>{summary.overdue || 0}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Maintenance Cost</div>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#2563EB' }}>{formatINR(summary.totalCost || 0)}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Cost Mismatch Amount</div>
          <div style={{ fontSize: '1.45rem', fontWeight: '800', color: '#DC2626' }}>{formatINR(summary.costMismatchAmount || 0)}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Equipment Serviced</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#0F766E' }}>{summary.equipmentServiced || 0}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '18px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tyres Serviced / Replaced</div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#7C3AED' }}>{summary.tyresServiced || 0}</div>
        </div>
      </div>

      {/* 7 Real Recharts Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: '24px' }}>
        {/* Chart 1: Monthly Maintenance Job Volume Trend */}
        <div ref={chart1Ref} style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
            1. Monthly Maintenance Job Volume Trend
          </h2>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.monthlyJobVolume || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" name="Total Jobs" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="completed" name="Completed" stroke="#16A34A" strokeWidth={2} />
                <Line type="monotone" dataKey="overdue" name="Overdue" stroke="#DC2626" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Maintenance Cost (INR) */}
        <div ref={chart2Ref} style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
            2. Monthly Maintenance Cost (INR ₹)
          </h2>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyCost || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip formatter={(value) => [formatINR(value), 'Expenditure']} />
                <Bar dataKey="cost" name="Expenditure (₹)" fill="#0F766E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Equipment-wise Maintenance Cost */}
        <div ref={chart3Ref} style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
            3. Equipment-wise Maintenance Cost Comparison
          </h2>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.equipmentCost || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                <XAxis type="number" stroke="var(--text-secondary)" fontSize={12} tickFormatter={(val) => `₹${val / 1000}k`} />
                <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" fontSize={11} width={100} />
                <Tooltip formatter={(val) => [formatINR(val), 'Cost']} />
                <Bar dataKey="cost" name="Total Cost (₹)" fill="#2563EB" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Maintenance Type Distribution */}
        <div ref={chart4Ref} style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
            4. Maintenance Type Distribution
          </h2>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.maintenanceTypeDistribution || []}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(charts.maintenanceTypeDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val} jobs`, 'Count']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Completed vs Pending vs Overdue */}
        <div ref={chart5Ref} style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
            5. Completed vs Pending vs Overdue Operations
          </h2>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.statusDistribution || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {(charts.statusDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6: Tyre Condition Distribution */}
        <div ref={chart6Ref} style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
            6. OTR Tyre Condition Fleet Distribution
          </h2>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.tyreConditionDistribution || []}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  label={({ name, count }) => `${name} (${count})`}
                >
                  {(charts.tyreConditionDistribution || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.name === 'Good' ? '#16A34A' : entry.name === 'Critical' ? '#DC2626' : entry.name === 'Warning' ? '#F59E0B' : '#7C3AED'}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 7: Cost Mismatch Summary */}
        <div ref={chart7Ref} style={{ backgroundColor: 'var(--bg-surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
            7. Automatic Cost Comparison & Reconciliation Summary
          </h2>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.costMismatchSummary || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Job Count" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Maintenance Records Roster */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
            Monthly Maintenance Records
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 18px' }}>Job ID</th>
                <th style={{ padding: '12px 18px' }}>Equipment</th>
                <th style={{ padding: '12px 18px' }}>Type</th>
                <th style={{ padding: '12px 18px' }}>Scheduled Date</th>
                <th style={{ padding: '12px 18px' }}>Status</th>
                <th style={{ padding: '12px 18px' }}>Total Cost (₹)</th>
                <th style={{ padding: '12px 18px' }}>Cost Reconciliation</th>
              </tr>
            </thead>
            <tbody>
              {(analyticsData?.records || []).slice(0, 15).map((rec) => (
                <tr key={rec._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 18px', fontWeight: '700', color: 'var(--primary)' }}>{rec.maintenanceId}</td>
                  <td style={{ padding: '12px 18px' }}>{rec.equipment?.name || 'Equipment'}</td>
                  <td style={{ padding: '12px 18px', color: 'var(--text-secondary)' }}>{rec.maintenanceType}</td>
                  <td style={{ padding: '12px 18px', color: 'var(--text-secondary)' }}>{formatDate(rec.scheduledDate)}</td>
                  <td style={{ padding: '12px 18px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', backgroundColor: rec.status === 'Completed' ? '#DCFCE7' : '#FEF3C7', color: rec.status === 'Completed' ? '#15803D' : '#B45309' }}>
                      {rec.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 18px', fontWeight: '600' }}>{formatINR(rec.totalCost || 0)}</td>
                  <td style={{ padding: '12px 18px' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor: rec.costStatus === 'Cost Matched' ? '#DCFCE7' : rec.costStatus === 'Cost Mismatch' ? '#FEE2E2' : '#F1F5F9',
                      color: rec.costStatus === 'Cost Matched' ? '#15803D' : rec.costStatus === 'Cost Mismatch' ? '#DC2626' : '#64748B'
                    }}>
                      {rec.costStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
