import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Box, Typography, Paper, Button, Grid, Stack, Divider, Chip } from '@mui/material';
import Sidebar from '..//components/Layout/Sidebar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const palette = ['#4FC3F7','#FFB74D','#81C784','#BA68C8','#64B5F6','#FF8A65','#AED581','#9575CD','#4DB6AC','#F06292'];
const colorForIndex = (i) => palette[i % palette.length];

const Reports = () => {
  const [ingresosTotales, setIngresosTotales] = useState(0);
  const [ingresosPorEmpresa, setIngresosPorEmpresa] = useState([]);
  const [ingresosMensuales, setIngresosMensuales] = useState([]);
  const [fechaInicio, setFechaInicio] = useState(dayjs().startOf('month'));
  const [fechaFin, setFechaFin] = useState(dayjs().endOf('month'));
  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);

  const cargarTotales = async () => {
    try { const { data } = await api.get('/reports/ingresos/totales'); setIngresosTotales(Number(data.ingresos_totales) || 0); }
    catch { setIngresosTotales(0); }
  };

  const cargarPorEmpresa = async () => {
    try {
      const inicio = fechaInicio.format('YYYY-MM-DD'); const fin = fechaFin.format('YYYY-MM-DD');
      const [{ data: porEmp }, { data: totales }] = await Promise.all([
        api.get('/reports/ingresos/por-empresa', { params: { fecha_inicio: inicio, fecha_fin: fin } }),
        api.get('/reports/ingresos/totales-por-fecha', { params: { fecha_inicio: inicio, fecha_fin: fin } }),
      ]);
      setIngresosPorEmpresa(Array.isArray(porEmp) ? porEmp : []);
      setIngresosTotales(Number(totales.ingresos_totales) || 0);
    } catch { setIngresosPorEmpresa([]); setIngresosTotales(0); }
  };

  const cargarMensuales = async () => {
    try { const { data } = await api.get('/reports/ingresos/mensuales'); setIngresosMensuales(Array.isArray(data) ? data : []); }
    catch { setIngresosMensuales([]); }
  };

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(ingresosPorEmpresa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'IngresosPorEmpresa');
    XLSX.writeFile(wb, 'reporte_ingresos.xlsx');
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text('Reporte de Ingresos', 14, 20);
    doc.setFontSize(12);
    doc.text(`Periodo: ${fechaInicio.format('DD/MM/YYYY')} - ${fechaFin.format('DD/MM/YYYY')}`, 14, 30);
    doc.text(`Ingresos Totales: $${ingresosTotales.toFixed(2)}`, 14, 37);

    const tableData = ingresosPorEmpresa.map((e) => [e.empresa, `$${Number(e.ingresos).toFixed(2)}`]);
    autoTable(doc, { startY: 45, head: [['Empresa', 'Ingresos']], body: tableData });

    const yPosition = (doc.lastAutoTable?.finalY || 45) + 10;
    const barInst = barChartRef.current; if (barInst) { const barImg = barInst.toBase64Image(); doc.addImage(barImg, 'PNG', 14, yPosition, 180, 70); }
    const lineInst = lineChartRef.current; if (lineInst) { const lineImg = lineInst.toBase64Image(); doc.addImage(lineImg, 'PNG', 14, yPosition + 80, 180, 70); }
    doc.save('reporte_ingresos.pdf');
  };

  useEffect(() => { cargarTotales(); cargarMensuales(); }, []);

  const dataChartBar = useMemo(() => ({
    labels: ingresosPorEmpresa.map((e) => e.empresa),
    datasets: [{ label: 'Ingresos ($)', data: ingresosPorEmpresa.map((e) => e.ingresos),
      backgroundColor: ingresosPorEmpresa.map((_, i) => colorForIndex(i)),
      borderColor: ingresosPorEmpresa.map((_, i) => colorForIndex(i)), borderWidth: 1 }],
  }), [ingresosPorEmpresa]);

  const optionsBar = {
    responsive: true,
    plugins: { legend: { position: 'top', labels: { color: '#e6e9ef' } }, title: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` $${Number(ctx.parsed.y).toFixed(2)}` } } },
    scales: { x: { ticks: { color: '#cfd8ff' }, grid: { color: 'rgba(255,255,255,0.08)' } },
      y: { ticks: { color: '#cfd8ff', callback: (v) => `$${Number(v).toFixed(0)}` }, grid: { color: 'rgba(255,255,255,0.08)' } } },
  };

  const dataChartLine = useMemo(() => ({
    labels: ingresosMensuales.map((e) => e.mes),
    datasets: [{ label: 'Ingresos mensuales ($)', data: ingresosMensuales.map((e) => e.ingresos),
      fill: false, borderColor: '#4FC3F7', pointBackgroundColor: '#4FC3F7', pointBorderColor: '#4FC3F7', tension: 0.3 }],
  }), [ingresosMensuales]);

  const optionsLine = {
    responsive: true,
    plugins: { legend: { position: 'top', labels: { color: '#e6e9ef' } }, title: { display: false },
      tooltip: { callbacks: { label: (ctx) => ` $${Number(ctx.parsed.y).toFixed(2)}` } } },
    scales: { x: { ticks: { color: '#cfd8ff' }, grid: { color: 'rgba(255,255,255,0.08)' } },
      y: { ticks: { color: '#cfd8ff', callback: (v) => `$${Number(v).toFixed(0)}` }, grid: { color: 'rgba(255,255,255,0.08)' } } },
  };

  return (
    <Box display="flex" minHeight="100vh" sx={{ background: 'linear-gradient(120deg, #1a2540 70%, #232E4F 100%)' }}>
      <Sidebar />
      <Box flexGrow={1} p={0}>
        <Box sx={{ background: 'linear-gradient(135deg, #1976d2 60%, #00c6fb 100%)', p: 4, borderRadius: '0 0 24px 24px', color: '#fff', mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" fontWeight={800}>Reporte de ingresos</Typography>
              <Typography variant="body2" sx={{ opacity: 0.95 }}>Descarga información por empresa y analiza la evolución mensual.</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', height: '100%' }}>
                <Typography variant="subtitle2">Ingresos Totales</Typography>
                <Typography variant="h4" fontWeight={900}>${Number(ingresosTotales).toFixed(2)}</Typography>
                <Chip size="small" label="Actualizado" sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.25)', color: '#fff' }} />
              </Paper>
            </Grid>
          </Grid>
        </Box>

        <Box px={3}>
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', color: '#e6e9ef' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>Filtros de periodo</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker label="Fecha inicio" value={fechaInicio} onChange={(v) => setFechaInicio(v || dayjs().startOf('month'))}
                    slotProps={{ textField: { fullWidth: true, sx: { input: { color: '#e6e9ef' }, '& .MuiOutlinedInput-root fieldset': { borderColor: '#7ba7ff' }, '& .MuiFormLabel-root': { color: '#cfd8ff' } } } }} />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker label="Fecha fin" value={fechaFin} onChange={(v) => setFechaFin(v || dayjs().endOf('month'))}
                    slotProps={{ textField: { fullWidth: true, sx: { input: { color: '#e6e9ef' }, '& .MuiOutlinedInput-root fieldset': { borderColor: '#7ba7ff' }, '& .MuiFormLabel-root': { color: '#cfd8ff' } } } }} />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md="auto">
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" onClick={cargarPorEmpresa}>Buscar</Button>
                  <Button variant="outlined" onClick={exportarExcel}>Exportar Excel</Button>
                  <Button variant="outlined" color="error" onClick={exportarPDF}>Exportar PDF</Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', color: '#e6e9ef' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>Ingresos por empresa</Typography>
              <Divider flexItem sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
            </Stack>
            <Bar ref={barChartRef} data={dataChartBar} options={optionsBar} />
          </Paper>

          <Paper sx={{ p: 3, mb: 6, borderRadius: 3, backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', color: '#e6e9ef' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>Evolución mensual de ingresos</Typography>
              <Divider flexItem sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
            </Stack>
            <Line ref={lineChartRef} data={dataChartLine} options={optionsLine} />
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Reports;
