import * as XLSX from 'xlsx';
import { Sponsored } from '../types';

// تصدير إلى Excel
export const exportToExcel = (
  data: Sponsored[],
  filename: string = 'المكفولين',
) => {
  if (!data || data.length === 0) return;
  const exportData = data.map((s) => ({
    الاسم: s.fullName,
    'رقم الهوية': s.idNumber,
    الهاتف: s.phone || '-',
    'الكفالة السنوية': s.annualAmount,
    'المدفوع هذا العام': s.totalPaidThisYear || 0,
    المتبقي: s.remaining || 0,
    الحالة: s.status === 'active' ? 'نشط' : 'منتهي',
    'تاريخ البداية': new Date(s.sponsorshipStartDate).toLocaleDateString(
      'ar-SA',
    ),
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'المكفولين');

  ws['!cols'] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 12 },
    { wch: 10 },
    { wch: 15 },
  ];

  XLSX.writeFile(
    wb,
    `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`,
  );
};

// تصدير إلى PDF بالعربية (طباعة من المتصفح)
export const exportToPDF = (data: Sponsored[], filename: string = 'تقرير') => {
  if (!data || data.length === 0) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لتصدير PDF');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>${filename}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Arial, sans-serif; 
          padding: 20px;
          direction: rtl;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #1e3a5f;
        }
        .header h1 { color: #1e3a5f; margin-bottom: 10px; }
        .header p { color: #666; }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px;
        }
        th { 
          background: #1e3a5f; 
          color: white; 
          padding: 12px 8px;
          text-align: right;
          font-weight: 600;
        }
        td { 
          padding: 10px 8px; 
          border-bottom: 1px solid #ddd;
          text-align: right;
        }
        tr:nth-child(even) { background: #f9f9f9; }
        tr:hover { background: #f0f0f0; }
        .status-active { color: #52c41a; font-weight: 600; }
        .status-inactive { color: #999; }
        .amount { font-weight: 600; }
        .footer {
          margin-top: 30px;
          text-align: center;
          color: #999;
          font-size: 12px;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📋 تقرير المكفولين</h1>
        <p>التاريخ: ${new Date().toLocaleDateString('ar-SA')} | عدد السجلات: ${data.length}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>الاسم</th>
            <th>رقم الهوية</th>
            <th>الهاتف</th>
            <th>الكفالة السنوية</th>
            <th>المدفوع</th>
            <th>المتبقي</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (s, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${s.fullName}</td>
              <td>${s.idNumber}</td>
              <td>${s.phone || '-'}</td>
              <td class="amount">${s.annualAmount.toLocaleString('ar-SA')}</td>
              <td class="amount">${(s.totalPaidThisYear || 0).toLocaleString('ar-SA')}</td>
              <td class="amount">${(s.remaining || 0).toLocaleString('ar-SA')}</td>
              <td class="${s.status === 'active' ? 'status-active' : 'status-inactive'}">
                ${s.status === 'active' ? '✓ نشط' : 'منتهي'}
              </td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
      
      <div class="footer">
        <p>نظام إدارة المكفولين</p>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
