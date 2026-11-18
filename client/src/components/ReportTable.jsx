import React from 'react';
import DataTable from './DataTable.jsx';

// One titled table inside a report
export default function ReportTable({ section, multi }) {
  return (
    <>
      {multi && <h3 className="sec-sub">{section.title}</h3>}
      <div className="card flush"><DataTable columns={section.columns} rows={section.rows} empty="No records for this period" /></div>
    </>
  );
}
