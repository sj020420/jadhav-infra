// Column definitions shared by pages, reports and exports
export const jobCols = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'customerName', label: 'Customer' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'location', label: 'Location' },
  { key: 'workType', label: 'Work Type' },
  { key: 'start', label: 'Start Time', type: 'time' },
  { key: 'end', label: 'End Time', type: 'time' },
  { key: 'hours', label: 'Hours' },
  { key: 'rate', label: 'Rate/Hr', type: 'money' },
  { key: 'total', label: 'Final Total', type: 'money' },
  { key: 'paid', label: 'Paid', type: 'money' },
  { key: 'pending', label: 'Pending', type: 'money' },
  { key: 'method', label: 'Payment Method' },
  { key: 'status', label: 'Status', badge: true },
];
export const expenseCols = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'type', label: 'Expense Type' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount', type: 'money' },
  { key: 'method', label: 'Payment Method' },
  { key: 'paidTo', label: 'Paid To' },
  { key: 'notes', label: 'Notes' },
];
export const dieselCols = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'machine', label: 'Machine' },
  { key: 'litres', label: 'Litres' },
  { key: 'finalPrice', label: 'Final Price', type: 'money', val: (r) => r.finalPrice ?? r.total },
  { key: 'paymentBy', label: 'Payment By' },
  { key: 'method', label: 'Payment Method' },
  { key: 'notes', label: 'Notes' },
];
export const empCols = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'name', label: 'Name' },
  { key: 'personType', label: 'Type' },
  { key: 'reason', label: 'Work / Reason' },
  { key: 'amount', label: 'Amount', type: 'money' },
  { key: 'method', label: 'Payment Method' },
  { key: 'status', label: 'Status', badge: true },
  { key: 'notes', label: 'Notes' },
];
export const customerSummaryCols = [
  { key: 'customerName', label: 'Customer' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'hours', label: 'Hours' },
  { key: 'total', label: 'Total Bill', type: 'money' },
  { key: 'paid', label: 'Paid', type: 'money' },
  { key: 'pending', label: 'Pending', type: 'money' },
  { key: 'status', label: 'Status', badge: true },
];
export const statementCols = [
  { key: 'date', label: 'Date', type: 'date' },
  { key: 'workType', label: 'Work' },
  { key: 'location', label: 'Location' },
  { key: 'hours', label: 'Hours' },
  { key: 'rate', label: 'Rate', type: 'money' },
  { key: 'total', label: 'Amount', type: 'money' },
  { key: 'paid', label: 'Paid', type: 'money' },
  { key: 'pending', label: 'Pending', type: 'money' },
];
