import { useFiles } from '../context/FileContext.jsx';
import { fmtSize } from '../utils.js';
import '../styles/files.css';

export default function StatCards() {
  const { files, storageUsed, storageTotal } = useFiles();

  const shared = files.filter(f => f.shared).length;
  const pctUsed = storageTotal > 0
    ? ((storageUsed / storageTotal) * 100).toFixed(1)
    : '0';

  const cards = [
    { label: 'Total Files', value: files.length, sub: 'in your drive' },
    { label: 'Storage Used', value: fmtSize(storageUsed), sub: `${pctUsed}% of total` },
    { label: 'Remaining', value: fmtSize(storageTotal - storageUsed), sub: 'available' },
    { label: 'Shared Links', value: shared, sub: `${files.filter(f => f.store === 's3').length} on S3` },
  ];

  return (
    <div className="stats-row">
      {cards.map(c => (
        <div key={c.label} className="stat-card">
          <div className="stat-label">{c.label}</div>
          <div className="stat-value">{c.value}</div>
          <div className="stat-sub">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
