const { Package, Carrier, Recipient, Expense, User } = require('../models');
const XLSX = require('xlsx-js-style');

const exportPackages = async (req, res) => {
    // Keep this for backwards compatibility if needed via specific route
    return res.status(400).json({ message: 'Use /api/export/all instead' });
};

const exportAllData = async (req, res) => {
    try {
        // Safe role check
        if (!req.user || req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Forbidden: Admins only' });
        }

        // Fetch all data
        const expenses = await Expense.findAll({
            where: { type: 'gasto' },
            include: [{ model: User, as: 'user', attributes: ['name'] }],
            order: [['date', 'DESC']],
        });

        const packages = await Package.findAll({
            include: [
                { model: Carrier, as: 'carrier', attributes: ['name'] },
                { model: Recipient, as: 'finalRecipient', attributes: ['name'] },
            ],
            order: [['createdAt', 'DESC']],
        });

        // ================= HOJA 1: PAQUETERIAS =================
        const wsPackages = XLSX.utils.aoa_to_sheet([]);
        const packagesData = packages.map((p) => ({
            ID: p.id,
            TIPO_PAQUETERIA: p.carrierId ? p.carrier?.name : p.type,
            COSTO_ENVIO: p.shippingCost,
            FECHA_RECIBIDO: p.receivedDate ? new Date(p.receivedDate).toLocaleDateString() : '',
            ESTADO: p.status,
            DESTINATARIO: p.recipientId ? p.finalRecipient?.name : p.recipientName,
        }));

        // Headers
        const pkgHeaders = ['ID', 'TIPO_PAQUETERIA', 'COSTO_ENVIO', 'FECHA_RECIBIDO', 'ESTADO', 'DESTINATARIO'];
        
        // ================= HOJA 2: GASTOS =================
        const wsExpenses = XLSX.utils.aoa_to_sheet([]);
        let totalExpenses = 0;
        const expensesData = expenses.map((e) => {
            const numMonto = parseFloat(e.amount) || 0;
            totalExpenses += numMonto;
            return {
                ID: e.id,
                TIPO_GASTO: e.concept,
                DESCRIPCION: e.description,
                MONTO: numMonto,
                FECHA: e.date ? new Date(e.date).toLocaleDateString() : '',
                REGISTRADO_POR: e.user ? e.user.name : 'Desconocido',
            };
        });

        // Add Total Row
        expensesData.push({
            ID: '',
            TIPO_GASTO: '',
            DESCRIPCION: 'TOTAL DE GASTOS ADICIONALES',
            MONTO: totalExpenses,
            FECHA: '',
            REGISTRADO_POR: '',
        });

        const expHeaders = ['ID', 'TIPO_GASTO', 'DESCRIPCION', 'MONTO', 'FECHA', 'REGISTRADO_POR'];

        // Helper function to build professional sheet
        const buildSheet = (ws, dataArray, headersObj, isPackage) => {
            // 1. Branding Header (Mock Logo via Styled Cells)
            XLSX.utils.sheet_add_aoa(ws, [
                ['ICAUTOMATION'], // Mock Logo Place
                ['REPORTE DE PAQUETERÍAS Y GASTOS (ADMINISTRATIVO)'], 
                [] // Empty spacer
            ], { origin: 'A1' });

            // 2. Data Headers
            XLSX.utils.sheet_add_aoa(ws, [headersObj], { origin: 'A4' });

            // 3. Data Rows
            const aoaData = dataArray.map(obj => headersObj.map(h => obj[h]));
            XLSX.utils.sheet_add_aoa(ws, aoaData, { origin: 'A5' });

            // 4. Styling
            const headerStyle = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "4F46E5" } }, // Indigo primary color
                border: { 
                    top: {style: "thin", color: {auto: 1}},
                    bottom: {style: "thin", color: {auto: 1}},
                    left: {style: "thin", color: {auto: 1}},
                    right: {style: "thin", color: {auto: 1}}
                },
                alignment: { horizontal: "center" }
            };

            const cellStyle = {
                border: { 
                    top: {style: "thin", color: {rgb: "DDDDDD"}},
                    bottom: {style: "thin", color: {rgb: "DDDDDD"}},
                    left: {style: "thin", color: {rgb: "DDDDDD"}},
                    right: {style: "thin", color: {rgb: "DDDDDD"}}
                }
            };
            
            const currencyStyle = {
                ...cellStyle,
                numFmt: '"$"#,##0.00_"MXN"'
            };

            const totalRowStyle = {
                font: { bold: true },
                fill: { fgColor: { rgb: "F59E0B" } }, // Warning Orange
                border: cellStyle.border,
                numFmt: '"$"#,##0.00_"MXN"'
            };

            // Range of data
            const range = XLSX.utils.decode_range(ws['!ref']);
            
            // Apply Styles
            for (let R = 0; R <= range.e.r; ++R) {
                for (let C = 0; C <= range.e.c; ++C) {
                    const cellRef = XLSX.utils.encode_cell({c: C, r: R});
                    if (!ws[cellRef]) ws[cellRef] = {v: "", t: "s"};
                    
                    if (R === 0 && C === 0) {
                        // Title/Logo Style
                        ws[cellRef].s = { font: { bold: true, sz: 16, color: { rgb: "F59E0B" } } };
                    } else if (R === 1 && C === 0) {
                        // Report Title Style
                        ws[cellRef].s = { font: { bold: true, sz: 14 } };
                    } else if (R === 3) {
                        // Table Headers
                        ws[cellRef].s = headerStyle;
                    } else if (R >= 4) {
                        // Data Cells
                        ws[cellRef].s = cellStyle;

                        // Apply Currency Formatting
                        const isCostCol = isPackage ? (C === 2) : (C === 3); // COSTO_ENVIO (idx 2) or MONTO (idx 3)
                        
                        // If it's the last row of Expenses (Total Row)
                        if (!isPackage && R === range.e.r) {
                            if (C === 2 || C === 3) {
                                ws[cellRef].s = totalRowStyle;
                            } else {
                                ws[cellRef].s = { ...cellStyle, fill: { fgColor: { rgb: "F1F5F9" } } }; // Grey out others
                            }
                        } else if (isCostCol && typeof ws[cellRef].v === 'number') {
                            ws[cellRef].s = currencyStyle;
                        }
                    }
                }
            }

            // Merges for titles
            ws['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(0, headersObj.length - 1) } },
                { s: { r: 1, c: 0 }, e: { r: 1, c: Math.max(0, headersObj.length - 1) } }
            ];

            // Auto-fit Columns
            ws['!cols'] = headersObj.map(h => ({ wch: Math.max(h.length, 15) }));
        };

        buildSheet(wsPackages, packagesData, pkgHeaders, true);
        buildSheet(wsExpenses, expensesData, expHeaders, false);

        // Build Workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, wsPackages, 'Paquetes');
        XLSX.utils.book_append_sheet(wb, wsExpenses, 'Gastos Adicionales');

        // Export Buffer
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="Reporte_ICAUTOMATION.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(buf);
    } catch (error) {
        console.error('Export error:', error);
        return res.status(500).json({ message: 'Error exporting data' });
    }
};

module.exports = { exportPackages, exportAllData };
