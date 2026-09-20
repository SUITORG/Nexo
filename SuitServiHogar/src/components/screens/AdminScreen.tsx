import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

type AdminTab = 'dashboard' | 'technicians' | 'disputes' | 'config';

interface ConfigItem {
  key: string;
  value: any;
  description: string;
  category: string;
  updated_at: string;
  updated_by: string | null;
}

interface DashboardStats {
  totalOrders: number;
  ordersToday: number;
  totalRevenue: number;
  activeTechnicians: number;
  avgRating: number;
  pendingDisputes: number;
}

interface TechnicianRow {
  id: string;
  name: string;
  email: string;
  rating: number;
  review_count: number;
  category_ids: string[];
  active: boolean;
  role: string;
}

interface DisputeRow {
  id: string;
  service_name: string;
  client_name: string;
  technician_name: string;
  status: string;
  total_mxn: number;
  created_at: string;
}

interface ConfigItemRowProps {
  config: ConfigItem;
  index: number;
  isEditing: boolean;
  editValue: string;
  onStartEdit: (key: string, value: any) => void;
  onCancelEdit: () => void;
  onUpdate: (key: string, value: any) => void;
  onEditValueChange: (v: string) => void;
}

const ConfigItemRow: React.FC<ConfigItemRowProps> = ({
  config, index, isEditing, editValue, onStartEdit, onCancelEdit, onUpdate, onEditValueChange,
}) => (
  <div className="bg-surface-alt rounded-lg p-3 space-y-2">
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-label-md font-bold text-text-primary truncate">{config.key}</p>
        <p className="text-label-sm text-text-muted mt-0.5">{config.description}</p>
        <p className="text-[10px] text-text-muted mt-1">
          Actualizado: {new Date(config.updated_at).toLocaleString('es-MX')} {config.updated_by ? `por ${config.updated_by}` : ''}
        </p>
      </div>
      {isEditing ? (
        <div className="flex gap-2 ml-4">
          <textarea
            value={editValue}
            onChange={e => onEditValueChange(e.target.value)}
            className="flex-1 min-h-[100px] px-3 py-2 border border-border-subtle rounded-lg text-body-sm bg-surface-alt text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono text-xs"
            placeholder="JSON value"
          />
          <div className="flex flex-col gap-1">
            <button onClick={() => {
              try {
                onUpdate(config.key, JSON.parse(editValue));
              } catch { alert('JSON inválido'); }
            }} className="px-3 py-1 bg-primary text-on-primary rounded-lg text-label-sm font-bold hover:bg-primary/90 transition-colors">
              Guardar
            </button>
            <button onClick={onCancelEdit} className="px-3 py-1 bg-surface-alt text-text-primary rounded-lg text-label-sm font-bold hover:bg-border-subtle transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <pre className="flex-1 min-h-[60px] max-h-[200px] overflow-auto p-3 bg-surface-card border border-border-subtle rounded-lg text-xs font-mono text-text-primary whitespace-pre-wrap">
            {JSON.stringify(config.value, null, 2)}
          </pre>
          <button onClick={() => onStartEdit(config.key, config.value)} className="px-3 py-1 bg-primary text-on-primary rounded-lg text-label-sm font-bold hover:bg-primary/90 transition-colors whitespace-nowrap">
            Editar
          </button>
        </div>
      )}
    </div>
  </div>
);

export const AdminScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [technicians, setTechnicians] = useState<TechnicianRow[]>([]);
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);

      const [ordersRes, techRes, disputesRes] = await Promise.all([
        supabase.from('sh_orders').select('id, status, total_mxn, created_at'),
        supabase.from('sh_technicians').select('id, name, email, rating, review_count, category_ids, active, role'),
        supabase.from('sh_orders').select('id, service_name, client_name, technician_name, status, total_mxn, created_at')
          .in('status', ['cancelled', 'disputed']),
      ]);

      const orders = ordersRes.data ?? [];
      const techs = (techRes.data ?? []) as TechnicianRow[];
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);

      setStats({
        totalOrders: orders.length,
        ordersToday: orders.filter(o => o.created_at?.startsWith(todayStr)).length,
        totalRevenue: orders.filter(o => o.status === 'released').reduce((s, o) => s + (o.total_mxn || 0), 0),
        activeTechnicians: techs.filter(t => t.active).length,
        avgRating: techs.length ? +(techs.reduce((s, t) => s + (t.rating || 0), 0) / techs.length).toFixed(1) : 0,
        pendingDisputes: (disputesRes.data ?? []).filter(d => d.status === 'disputed').length,
      });

      setTechnicians(techs);
      setDisputes((disputesRes.data ?? []) as DisputeRow[]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const loadConfigs = async () => {
      setConfigLoading(true);
      try {
        const { data, error } = await supabase
          .from('sh_config')
          .select('*')
          .order('category', { ascending: true });
        if (error) throw error;
        setConfigs(data || []);
      } catch (err: any) {
        console.error('Error loading configs:', err);
      } finally {
        setConfigLoading(false);
      }
    };
    loadConfigs();
  }, []);

  const handleConfigUpdate = async (key: string, newValue: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('sh_config')
        .update({ 
          value: newValue, 
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('key', key);
      if (error) throw error;
      setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: newValue, updated_at: new Date().toISOString() } : c));
      setEditingKey(null);
    } catch (err: any) {
      console.error('Error updating config:', err);
    }
  };

  const startEdit = (key: string, value: any) => {
    setEditingKey(key);
    setEditValue(JSON.stringify(value, null, 2));
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const toggleActive = async (tech: TechnicianRow) => {
    try {
      const { error } = await supabase
        .from('sh_technicians')
        .update({ active: !tech.active })
        .eq('id', tech.id);
      if (error) throw error;
      setTechnicians(prev => prev.map(t => t.id === tech.id ? { ...t, active: !t.active } : t));
    } catch (err: any) {
      console.error('Error toggling technician:', err);
    }
  };

  return (
    <div className="space-y-4 pb-14">
      <div className="flex items-center gap-3 px-1">
        <button onClick={onBack} className="p-2 hover:bg-surface-alt rounded-full transition-colors">
          <span className="material-symbols-outlined text-text-primary">arrow_back</span>
        </button>
        <h1 className="text-headline-lg font-bold text-text-primary">Admin Panel</h1>
      </div>

      <div className="flex gap-1 bg-surface-alt rounded-xl p-1">
        {(['dashboard', 'technicians', 'disputes', 'config'] as AdminTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-label-sm font-medium transition-colors ${tab === t ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text-primary'}`}>
            {t === 'dashboard' ? 'Dashboard' : t === 'technicians' ? 'Técnicos' : t === 'disputes' ? 'Disputas' : 'Config'}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-text-muted">Cargando...</div>}

      {!loading && tab === 'dashboard' && stats && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Órdenes totales', value: stats.totalOrders, icon: 'receipt_long', color: 'text-blue-400' },
            { label: 'Órdenes hoy', value: stats.ordersToday, icon: 'today', color: 'text-emerald-safe' },
            { label: 'Ingresos totales', value: `$${stats.totalRevenue.toLocaleString()}`, icon: 'attach_money', color: 'text-amber-dark' },
            { label: 'Técnicos activos', value: stats.activeTechnicians, icon: 'engineering', color: 'text-trust-blue' },
            { label: 'Rating promedio', value: stats.avgRating, icon: 'star', color: 'text-amber-dark' },
            { label: 'Disputas pendientes', value: stats.pendingDisputes, icon: 'gavel', color: stats.pendingDisputes > 0 ? 'text-red-500' : 'text-emerald-safe' },
          ].map((s, i) => (
            <div key={i} className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs space-y-1">
              <span className={`material-symbols-outlined text-[22px] ${s.color}`}>{s.icon}</span>
              <p className="text-headline-sm font-bold text-text-primary">{s.value}</p>
              <p className="text-label-sm text-text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'technicians' && (
        <div className="space-y-2">
          {technicians.map(tech => (
            <div key={tech.id} className="bg-surface-card rounded-xl p-3 border border-border-subtle shadow-xs flex items-center gap-3">
              <img src={tech.email ? `https://ui-avatars.com/api/?name=${encodeURIComponent(tech.name)}&background=006C4C&color=fff&size=80` : ''} alt="" className="w-10 h-10 rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="text-label-md text-text-primary font-bold truncate">{tech.name}</p>
                <p className="text-label-sm text-text-muted">{tech.email}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-label-sm text-amber-dark">★ {tech.rating}</span>
                  <span className="text-label-sm text-text-muted">({tech.review_count})</span>
                  {tech.role === 'admin' && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">ADMIN</span>}
                </div>
              </div>
              <button onClick={() => toggleActive(tech)}
                className={`px-3 py-1.5 rounded-lg text-label-sm font-bold transition-colors ${tech.active ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-emerald-safe/10 text-emerald-safe hover:bg-emerald-safe/20'}`}>
                {tech.active ? 'Suspender' : 'Activar'}
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'disputes' && (
        <div className="space-y-2">
          {disputes.length === 0 && <p className="text-center py-8 text-text-muted">Sin disputas registradas.</p>}
          {disputes.map(d => (
            <div key={d.id} className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-label-md text-text-primary font-bold">{d.id}</span>
                <span className={`text-label-sm px-2 py-0.5 rounded-full font-bold ${d.status === 'disputed' ? 'bg-amber-dark/20 text-amber-dark' : 'bg-text-muted/20 text-text-muted'}`}>
                  {d.status === 'disputed' ? 'Disputa' : 'Cancelada'}
                </span>
              </div>
              <p className="text-body-sm text-text-muted">{d.service_name} — {d.total_mxn} MXN</p>
              <p className="text-label-sm text-text-muted">Cliente: {d.client_name} | Técnico: {d.technician_name}</p>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'config' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-headline-sm font-bold text-text-primary">Configuración del Sistema</h2>
            {configLoading && <span className="text-label-sm text-text-muted">Cargando...</span>}
          </div>

          {configLoading ? (
            <div className="text-center py-8 text-text-muted">Cargando configuración...</div>
          ) : (
            <div className="space-y-4">
              {['antifuga', 'off_app_payments', 'platform', 'referrals', 'gamification', 'decisions']
                .filter(category => configs.some(c => c.category === category))
                .map(category => {
                  const categoryConfigs = configs.filter(c => c.category === category);
                  return (
                    <div key={category} className="bg-surface-card rounded-xl p-4 border border-border-subtle shadow-xs space-y-3">
                      <h3 className="text-label-lg font-bold text-text-primary capitalize">{category.replace('_', ' ')}</h3>
                      <div className="space-y-3">
                        {categoryConfigs.map((config, index) => (
                          <ConfigItemRow
                            key={`${config.key}-${index}`}
                            config={config}
                            index={index}
                            isEditing={editingKey === config.key}
                            editValue={editValue}
                            onStartEdit={startEdit}
                            onCancelEdit={cancelEdit}
                            onUpdate={handleConfigUpdate}
                            onEditValueChange={setEditValue}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminScreen;