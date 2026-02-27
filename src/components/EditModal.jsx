import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

export default function EditModal({ title, fields, values, onSave, onClose }) {
  const [local, setLocal] = useState(values || {});

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setLocal(values || {}); }, [values]);

  const handleChange = (key, value) => {
    setLocal(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(local);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box fade-in">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#e8eaf0' }}>{title}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={14} /></button>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {fields.map(field => (
            <div key={field.key}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#8892b0', marginBottom: 6, fontWeight: 600 }}>
                {field.label}
                {field.hint && <span style={{ color: '#4a5568', marginLeft: 6, fontWeight: 400 }}>{field.hint}</span>}
              </label>
              {field.type === 'number' ? (
                <input
                  className="input-field"
                  type="number"
                  value={local[field.key] ?? ''}
                  onChange={e => handleChange(field.key, parseFloat(e.target.value) || 0)}
                  placeholder={field.placeholder || '0'}
                  min={field.min ?? 0}
                  step={field.step ?? 1}
                />
              ) : field.type === 'date' ? (
                <input
                  className="input-field"
                  type="date"
                  value={local[field.key] ?? ''}
                  onChange={e => handleChange(field.key, e.target.value)}
                />
              ) : field.type === 'select' ? (
                <select
                  className="input-field"
                  value={local[field.key] ?? ''}
                  onChange={e => handleChange(field.key, e.target.value)}
                >
                  {field.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="input-field"
                  type="text"
                  value={local[field.key] ?? ''}
                  onChange={e => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder || ''}
                />
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 22 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={13} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
