import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from "firebase/firestore";

// ─── FIREBASE CONFIG ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDnFheinUwdNsTX_IQBcoq9IMFHwLTfbso",
  authDomain: "felipe-barbearia.firebaseapp.com",
  projectId: "felipe-barbearia",
  storageBucket: "felipe-barbearia.firebasestorage.app",
  messagingSenderId: "161901166471",
  appId: "1:161901166471:web:15a8bf15b33fccbdc19d22",
  measurementId: "G-7XHJWE687W"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const ALL_HOURS = ["09:00","09:30","10:00","10:30","11:00","11:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30"];
const WEEKDAYS  = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const MONTHS    = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const TODAY     = new Date().toISOString().split("T")[0];
const AVATAR_COLORS = ["#FF6B00","#e85d04","#f48c06","#f72585","#7209b7","#3a86ff","#06d6a0","#ef233c"];

const DEFAULT_SERVICES = [
  { name: "Corte Clássico", duration: 30, price: 45, icon: "✂️", desc: "Corte tradicional com acabamento perfeito" },
  { name: "Barba Completa", duration: 30, price: 35, icon: "🪒", desc: "Modelagem e hidratação da barba" },
  { name: "Corte + Barba",  duration: 60, price: 75, icon: "💈", desc: "Combo completo com desconto especial" },
  { name: "Degradê",        duration: 45, price: 55, icon: "⚡", desc: "Fade moderno com máquina e tesoura" },
  { name: "Hidratação",     duration: 30, price: 40, icon: "💧", desc: "Tratamento profundo para cabelo e barba" },
  { name: "Sobrancelha",    duration: 15, price: 20, icon: "✨", desc: "Design e acabamento de sobrancelha" },
];

const DEFAULT_BARBERS = [
  { name: "Rafael Mendes", specialty: "Degradê & Navalhado", rating: 4.9, reviews: 214, avatar: "R", color: "#FF6B00" },
  { name: "Bruno Costa",   specialty: "Barba & Bigode",       rating: 4.8, reviews: 187, avatar: "B", color: "#CC5500" },
  { name: "Marcos Lima",   specialty: "Corte Clássico",       rating: 4.7, reviews: 156, avatar: "M", color: "#FF8C33" },
];

// ─── PALETA ───────────────────────────────────────────────────────────────────
const G = {
  accent: "#FF6B00", accentD: "#CC5500", accentL: "#FF8C33",
  bg: "#0a0a0a", card: "#141414", card2: "#1c1c1c",
  border: "#FF6B0022", borderM: "#FF6B0055",
  text: "#F0F0F0", muted: "#888888", dim: "#333333",
};

// ─── COMPONENTES BASE ─────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = "primary", disabled, style = {} }) {
  const map = {
    primary: { background: `linear-gradient(135deg,${G.accent},${G.accentD})`, color: "#fff", border: "none" },
    ghost:   { background: "transparent", color: G.muted, border: `1.5px solid ${G.border}` },
    danger:  { background: "#ff111118", color: "#ff4444", border: "1px solid #ff444433" },
    success: { background: "#22c55e18", color: "#22c55e", border: "1px solid #22c55e33" },
    outline: { background: "transparent", color: G.accent, border: `1.5px solid ${G.borderM}` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: "10px 18px", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, transition: "opacity .15s", fontFamily: "inherit", ...map[variant], ...style }}>{children}</button>
  );
}

function Badge({ children, color = G.accent }) {
  return <span style={{ background: color + "22", color, border: `1px solid ${color}44`, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: .8, textTransform: "uppercase" }}>{children}</span>;
}

function Stars({ rating }) {
  return <span style={{ display: "inline-flex", gap: 2 }}>{[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= Math.round(rating) ? G.accent : G.dim, fontSize: 13 }}>★</span>)}</span>;
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div>
      {label && <label style={{ color: G.accent, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 6 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", background: G.bg, border: `1.5px solid ${G.border}`, color: G.text, padding: "11px 14px", borderRadius: 10, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit", outline: "none" }} />
    </div>
  );
}

function Dropdown({ label, value, onChange, children }) {
  return (
    <div>
      {label && <label style={{ color: G.accent, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: 6 }}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", background: G.bg, border: `1.5px solid ${G.border}`, color: G.text, padding: "11px 14px", borderRadius: 10, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit" }}>
        {children}
      </select>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000dd", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20 }}>
      <div style={{ background: G.card, border: `1px solid ${G.borderM}`, borderRadius: 20, padding: 32, width: 460, maxWidth: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", color: G.text, fontSize: 24, margin: 0, letterSpacing: 1 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: G.muted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SectionTitle({ title, sub }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", color: G.text, fontSize: 30, margin: 0, letterSpacing: 1 }}>{title}</h2>
      {sub && <p style={{ color: G.muted, margin: "4px 0 0", fontSize: 13 }}>{sub}</p>}
    </div>
  );
}

function Loading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
      <div style={{ color: G.accent, fontSize: 14 }}>⏳ Carregando...</div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function AdminDashboard({ appointments }) {
  const today   = appointments.filter(a => a.date === TODAY);
  const revenue = today.reduce((s, a) => s + Number(a.price), 0);
  const total   = appointments.reduce((s, a) => s + Number(a.price), 0);
  const svcCount = {};
  appointments.forEach(a => { svcCount[a.service] = (svcCount[a.service] || 0) + 1; });
  const top = Object.entries(svcCount).sort((x, y) => y[1] - x[1]).slice(0, 5);
  const maxTop = top[0]?.[1] || 1;

  return (
    <div>
      <SectionTitle title="Dashboard" sub={`Hoje — ${TODAY}`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Faturamento Hoje", value: `R$ ${revenue}`, sub: `${today.length} atendimentos`, icon: "💰" },
          { label: "Total Geral",      value: `R$ ${total}`,   sub: "Todos os dias",                icon: "📈" },
          { label: "Clientes Hoje",    value: today.length,    sub: "Agendados",                    icon: "👤" },
          { label: "Ticket Médio",     value: today.length ? `R$ ${Math.round(revenue / today.length)}` : "—", sub: "Por atendimento", icon: "🏷" },
        ].map(c => (
          <div key={c.label} style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: "22px 24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 14, right: 18, fontSize: 28, opacity: 0.08 }}>{c.icon}</div>
            <div style={{ color: G.accent, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: G.text, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1, lineHeight: 1 }}>{c.value}</div>
            <div style={{ color: G.muted, fontSize: 12, marginTop: 5 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: 22 }}>
          <div style={{ color: G.accent, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginBottom: 18 }}>Agendamentos de Hoje</div>
          {today.length === 0 && <div style={{ color: G.muted, fontSize: 13 }}>Nenhum agendamento hoje.</div>}
          {today.slice(0, 5).map(a => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${G.border}` }}>
              <div>
                <div style={{ color: G.text, fontSize: 14, fontWeight: 600 }}>{a.client}</div>
                <div style={{ color: G.muted, fontSize: 12 }}>{a.time} · {a.barber?.split(" ")[0]}</div>
              </div>
              <Badge>R$ {a.price}</Badge>
            </div>
          ))}
        </div>
        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: 22 }}>
          <div style={{ color: G.accent, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginBottom: 18 }}>Serviços Populares</div>
          {top.map(([name, count]) => (
            <div key={name} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ color: G.text, fontSize: 13 }}>{name}</span>
                <span style={{ color: G.muted, fontSize: 12 }}>{count}x</span>
              </div>
              <div style={{ background: G.dim, borderRadius: 4, height: 5 }}>
                <div style={{ background: `linear-gradient(90deg,${G.accent},${G.accentD})`, width: `${(count / maxTop) * 100}%`, height: "100%", borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AGENDA ──────────────────────────────────────────────────────────────────
function AdminAgenda({ appointments, services, barbers }) {
  const [filterDate, setFilterDate] = useState(TODAY);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm] = useState({ client: "", phone: "", service: "", barber: "", date: TODAY, time: "", price: "" });

  const filtered = appointments.filter(a => a.date === filterDate).sort((a, b) => a.time?.localeCompare(b.time));
  const statusColor = { confirmed: G.accent, waiting: "#3b82f6", done: "#22c55e", cancelled: "#ff4444" };
  const statusLabel = { confirmed: "Confirmado", waiting: "Aguardando", done: "Concluído", cancelled: "Cancelado" };

  const save = async () => {
    if (!form.client || !form.service || !form.barber || !form.time) return;
    await addDoc(collection(db, "appointments"), { ...form, status: "confirmed", price: Number(form.price), createdAt: new Date().toISOString() });
    setShowModal(false);
    setForm({ client: "", phone: "", service: "", barber: "", date: TODAY, time: "", price: "" });
  };

  const markDone = async id => await updateDoc(doc(db, "appointments", id), { status: "done" });
  const remove   = async id => await deleteDoc(doc(db, "appointments", id));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <SectionTitle title="Agenda" sub={`${filtered.length} agendamento(s)`} />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            style={{ background: G.card, border: `1px solid ${G.borderM}`, color: G.accent, padding: "9px 12px", borderRadius: 10, fontSize: 13, fontFamily: "inherit" }} />
          <Btn onClick={() => setShowModal(true)}>+ Novo Agendamento</Btn>
        </div>
      </div>
      {filtered.length === 0
        ? <div style={{ textAlign: "center", color: G.muted, padding: "60px 0" }}><div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>Nenhum agendamento nesta data</div>
        : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(apt => (
              <div key={apt.id} style={{ background: G.card, border: `1px solid ${G.border}`, borderLeft: `3px solid ${statusColor[apt.status] || G.accent}`, borderRadius: 14, padding: "16px 22px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ background: G.accent + "18", borderRadius: 10, padding: "8px 14px", textAlign: "center", minWidth: 54 }}>
                  <div style={{ color: G.accent, fontWeight: 900, fontSize: 16 }}>{apt.time}</div>
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ color: G.text, fontWeight: 700, fontSize: 15 }}>{apt.client}</div>
                  <div style={{ color: G.muted, fontSize: 12, marginTop: 2 }}>{apt.service} · {apt.barber}</div>
                  {apt.phone && <div style={{ color: G.dim, fontSize: 11, marginTop: 2 }}>{apt.phone}</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: G.accent, fontWeight: 800, fontSize: 17 }}>R$ {apt.price}</div>
                  <div style={{ marginTop: 5 }}><Badge color={statusColor[apt.status]}>{statusLabel[apt.status]}</Badge></div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {apt.status !== "done" && <Btn variant="success" onClick={() => markDone(apt.id)}>✓</Btn>}
                  <Btn variant="danger" onClick={() => remove(apt.id)}>✕</Btn>
                </div>
              </div>
            ))}
          </div>
      }
      {showModal && (
        <Modal title="Novo Agendamento" onClose={() => setShowModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Cliente" value={form.client} onChange={v => setForm(p => ({ ...p, client: v }))} placeholder="Nome do cliente" />
            <Field label="WhatsApp" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} placeholder="(11) 9 9999-9999" />
            <Field label="Data" value={form.date} onChange={v => setForm(p => ({ ...p, date: v }))} type="date" />
            <Dropdown label="Serviço" value={form.service} onChange={v => { const s = services.find(x => x.name === v); setForm(p => ({ ...p, service: v, price: s ? s.price : "" })); }}>
              <option value="">Selecionar...</option>
              {services.map(s => <option key={s.id} value={s.name}>{s.icon} {s.name} — R$ {s.price}</option>)}
            </Dropdown>
            <Dropdown label="Barbeiro" value={form.barber} onChange={v => setForm(p => ({ ...p, barber: v }))}>
              <option value="">Selecionar...</option>
              {barbers.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </Dropdown>
            <Dropdown label="Horário" value={form.time} onChange={v => setForm(p => ({ ...p, time: v }))}>
              <option value="">Selecionar...</option>
              {ALL_HOURS.map(h => <option key={h} value={h}>{h}</option>)}
            </Dropdown>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <Btn variant="ghost" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancelar</Btn>
            <Btn onClick={save} style={{ flex: 2 }}>Confirmar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── SERVIÇOS ─────────────────────────────────────────────────────────────────
function AdminServicos({ services }) {
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm] = useState({ name: "", duration: "", price: "", icon: "✂️", desc: "" });

  const addService = async () => {
    if (!form.name || !form.price) return;
    await addDoc(collection(db, "services"), { ...form, duration: Number(form.duration), price: Number(form.price) });
    setShowAdd(false);
    setForm({ name: "", duration: "", price: "", icon: "✂️", desc: "" });
  };

  const saveEdit = async id => {
    await updateDoc(doc(db, "services", id), { price: Number(editData.price), duration: Number(editData.duration), desc: editData.desc });
    setEditing(null);
  };

  const remove = async id => await deleteDoc(doc(db, "services", id));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <SectionTitle title="Serviços" sub="Edite preços e cadastre novos" />
        <Btn onClick={() => setShowAdd(true)}>+ Novo Serviço</Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
        {services.map(s => (
          <div key={s.id} style={{ background: G.card, border: `1px solid ${editing === s.id ? G.accent : G.border}`, borderRadius: 16, padding: 22, transition: "border-color .2s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <span style={{ fontSize: 30 }}>{s.icon}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn variant="outline" onClick={() => { if (editing === s.id) { saveEdit(s.id); } else { setEditing(s.id); setEditData({ price: s.price, duration: s.duration, desc: s.desc }); } }} style={{ padding: "5px 12px", fontSize: 11 }}>{editing === s.id ? "✓ Salvar" : "Editar"}</Btn>
                <Btn variant="danger" onClick={() => remove(s.id)} style={{ padding: "5px 10px", fontSize: 11 }}>✕</Btn>
              </div>
            </div>
            <div style={{ color: G.text, fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{s.name}</div>
            {editing === s.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: G.muted, fontSize: 11 }}>Preço R$</label>
                    <input type="number" value={editData.price} onChange={e => setEditData(p => ({ ...p, price: e.target.value }))}
                      style={{ width: "100%", background: G.bg, border: `1px solid ${G.border}`, color: G.accent, padding: "8px 10px", borderRadius: 8, fontSize: 14, boxSizing: "border-box", marginTop: 4, fontFamily: "inherit" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: G.muted, fontSize: 11 }}>Duração (min)</label>
                    <input type="number" value={editData.duration} onChange={e => setEditData(p => ({ ...p, duration: e.target.value }))}
                      style={{ width: "100%", background: G.bg, border: `1px solid ${G.border}`, color: G.accent, padding: "8px 10px", borderRadius: 8, fontSize: 14, boxSizing: "border-box", marginTop: 4, fontFamily: "inherit" }} />
                  </div>
                </div>
                <input value={editData.desc} onChange={e => setEditData(p => ({ ...p, desc: e.target.value }))} placeholder="Descrição"
                  style={{ width: "100%", background: G.bg, border: `1px solid ${G.border}`, color: G.text, padding: "8px 10px", borderRadius: 8, fontSize: 13, boxSizing: "border-box", fontFamily: "inherit" }} />
              </div>
            ) : (
              <>
                <div style={{ color: G.muted, fontSize: 12, marginBottom: 12 }}>{s.desc}</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Badge>R$ {s.price}</Badge>
                  <Badge color="#3b82f6">{s.duration} min</Badge>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      {showAdd && (
        <Modal title="Novo Serviço" onClose={() => setShowAdd(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Nome" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Ex: Pigmentação" />
            <Field label="Descrição" value={form.desc} onChange={v => setForm(p => ({ ...p, desc: v }))} placeholder="Breve descrição..." />
            <div style={{ display: "flex", gap: 12 }}>
              <Field label="Preço R$" value={form.price} onChange={v => setForm(p => ({ ...p, price: v }))} type="number" placeholder="0" />
              <Field label="Duração (min)" value={form.duration} onChange={v => setForm(p => ({ ...p, duration: v }))} type="number" placeholder="30" />
            </div>
            <Field label="Ícone (emoji)" value={form.icon} onChange={v => setForm(p => ({ ...p, icon: v }))} placeholder="✂️" />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <Btn variant="ghost" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Cancelar</Btn>
            <Btn onClick={addService} style={{ flex: 2 }}>Cadastrar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── EQUIPE ───────────────────────────────────────────────────────────────────
function AdminEquipe({ barbers, appointments }) {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm] = useState({ name: "", specialty: "", rating: "5.0", reviews: "0" });

  const save = async () => {
    if (!form.name) return;
    const data = { name: form.name, specialty: form.specialty, rating: Number(form.rating), reviews: Number(form.reviews), avatar: form.name[0]?.toUpperCase() || "?", color: AVATAR_COLORS[barbers.length % AVATAR_COLORS.length] };
    if (editId) { await updateDoc(doc(db, "barbers", editId), data); }
    else { await addDoc(collection(db, "barbers"), data); }
    setShowModal(false); setEditId(null);
    setForm({ name: "", specialty: "", rating: "5.0", reviews: "0" });
  };

  const openEdit = b => { setEditId(b.id); setForm({ name: b.name, specialty: b.specialty, rating: String(b.rating), reviews: String(b.reviews) }); setShowModal(true); };
  const remove   = async id => await deleteDoc(doc(db, "barbers", id));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <SectionTitle title="Equipe" sub="Cadastre e gerencie seus barbeiros" />
        <Btn onClick={() => { setEditId(null); setForm({ name: "", specialty: "", rating: "5.0", reviews: "0" }); setShowModal(true); }}>+ Novo Barbeiro</Btn>
      </div>
      {barbers.length === 0 && <div style={{ textAlign: "center", color: G.muted, padding: "60px 0" }}><div style={{ fontSize: 40, marginBottom: 12 }}>💈</div>Nenhum barbeiro cadastrado.</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 18 }}>
        {barbers.map(b => {
          const todayApts    = appointments.filter(a => a.barber === b.name && a.date === TODAY);
          const todayRevenue = todayApts.reduce((s, a) => s + Number(a.price), 0);
          return (
            <div key={b.id} style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 20, padding: 26, textAlign: "center" }}>
              <div style={{ width: 68, height: 68, borderRadius: "50%", background: `linear-gradient(135deg,${b.color || G.accent},${(b.color || G.accent)}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900, color: "#fff", margin: "0 auto 14px" }}>{b.avatar}</div>
              <div style={{ color: G.text, fontWeight: 700, fontSize: 17, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>{b.name}</div>
              <div style={{ color: G.muted, fontSize: 12, margin: "4px 0 10px" }}>{b.specialty}</div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginBottom: 16 }}>
                <Stars rating={b.rating} /><span style={{ color: G.accent, fontSize: 13, fontWeight: 700 }}>{b.rating}</span><span style={{ color: G.dim, fontSize: 12 }}>({b.reviews})</span>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
                <div style={{ background: G.accent + "11", border: `1px solid ${G.border}`, borderRadius: 10, padding: "10px 16px" }}>
                  <div style={{ color: G.accent, fontWeight: 800, fontSize: 20 }}>{todayApts.length}</div>
                  <div style={{ color: G.muted, fontSize: 11 }}>hoje</div>
                </div>
                <div style={{ background: G.accent + "11", border: `1px solid ${G.border}`, borderRadius: 10, padding: "10px 16px" }}>
                  <div style={{ color: G.accent, fontWeight: 800, fontSize: 20 }}>R${todayRevenue}</div>
                  <div style={{ color: G.muted, fontSize: 11 }}>faturado</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <Btn variant="outline" onClick={() => openEdit(b)} style={{ fontSize: 12, padding: "7px 14px" }}>✏ Editar</Btn>
                <Btn variant="danger"  onClick={() => remove(b.id)} style={{ fontSize: 12, padding: "7px 14px" }}>✕ Remover</Btn>
              </div>
            </div>
          );
        })}
      </div>
      {showModal && (
        <Modal title={editId ? "Editar Barbeiro" : "Novo Barbeiro"} onClose={() => { setShowModal(false); setEditId(null); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Nome completo" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Ex: Felipe Silva" />
            <Field label="Especialidade" value={form.specialty} onChange={v => setForm(p => ({ ...p, specialty: v }))} placeholder="Ex: Degradê & Barba" />
            <div style={{ display: "flex", gap: 12 }}>
              <Field label="Avaliação (0-5)" value={form.rating}  onChange={v => setForm(p => ({ ...p, rating: v }))}  type="number" placeholder="5.0" />
              <Field label="Nº avaliações"   value={form.reviews} onChange={v => setForm(p => ({ ...p, reviews: v }))} type="number" placeholder="0" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <Btn variant="ghost" onClick={() => { setShowModal(false); setEditId(null); }} style={{ flex: 1 }}>Cancelar</Btn>
            <Btn onClick={save} style={{ flex: 2 }}>{editId ? "Salvar" : "Cadastrar"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── CLIENTES ─────────────────────────────────────────────────────────────────
function AdminClientes({ appointments }) {
  const [search, setSearch] = useState("");
  const clientMap = {};
  appointments.forEach(a => {
    if (!clientMap[a.client]) clientMap[a.client] = { name: a.client, phone: a.phone || "—", visits: 0, total: 0, last: a.date };
    clientMap[a.client].visits++;
    clientMap[a.client].total += Number(a.price);
    if (a.date > clientMap[a.client].last) clientMap[a.client].last = a.date;
  });
  const clients = Object.values(clientMap).filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <SectionTitle title="Clientes" sub={`${clients.length} cliente(s)`} />
        <input placeholder="🔍 Buscar..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ background: G.card, border: `1px solid ${G.border}`, color: G.text, padding: "10px 16px", borderRadius: 10, fontSize: 13, fontFamily: "inherit", width: 200, outline: "none" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {clients.map(c => (
          <div key={c.name} style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, padding: "16px 22px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${G.accent},${G.accentD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{c.name[0]}</div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ color: G.text, fontWeight: 700, fontSize: 15 }}>{c.name}</div>
              <div style={{ color: G.muted, fontSize: 12, marginTop: 2 }}>{c.phone}</div>
            </div>
            <div style={{ textAlign: "center" }}><div style={{ color: G.accent, fontWeight: 800, fontSize: 20 }}>{c.visits}</div><div style={{ color: G.muted, fontSize: 11 }}>visitas</div></div>
            <div style={{ textAlign: "center" }}><div style={{ color: G.text, fontWeight: 700 }}>R$ {c.total}</div><div style={{ color: G.muted, fontSize: 11 }}>total</div></div>
            <div style={{ textAlign: "right" }}><div style={{ color: G.muted, fontSize: 11 }}>Última visita</div><div style={{ color: G.accent, fontSize: 13, fontWeight: 600 }}>{c.last}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────
function AdminConfig({ adminPass, setAdminPass }) {
  const [current, setCurrent]   = useState("");
  const [nova, setNova]         = useState("");
  const [confirma, setConferma] = useState("");
  const [msg, setMsg]           = useState(null);

  const salvar = async () => {
    if (current !== adminPass) { setMsg({ type: "error", text: "❌ Senha atual incorreta." }); return; }
    if (nova.length < 4)       { setMsg({ type: "error", text: "❌ Mínimo 4 caracteres." }); return; }
    if (nova !== confirma)     { setMsg({ type: "error", text: "❌ As senhas não coincidem." }); return; }
    await setDoc(doc(db, "config", "admin"), { password: nova });
    setAdminPass(nova);
    setCurrent(""); setNova(""); setConferma("");
    setMsg({ type: "success", text: "✅ Senha alterada!" });
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div>
      <SectionTitle title="Configurações" sub="Gerencie as opções do sistema" />
      <div style={{ maxWidth: 460 }}>
        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 18, padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg,${G.accent},${G.accentD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🔐</div>
            <div><div style={{ color: G.text, fontWeight: 700, fontSize: 16 }}>Alterar Senha do Admin</div><div style={{ color: G.muted, fontSize: 12 }}>Salva no banco de dados</div></div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Senha Atual"         value={current}  onChange={setCurrent}  type="password" placeholder="Digite a senha atual" />
            <Field label="Nova Senha"           value={nova}     onChange={setNova}     type="password" placeholder="Mínimo 4 caracteres" />
            <Field label="Confirmar Nova Senha" value={confirma} onChange={setConferma} type="password" placeholder="Repita a nova senha" />
          </div>
          {msg && <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: msg.type === "error" ? "#ff111118" : "#22c55e18", border: `1px solid ${msg.type === "error" ? "#ff444433" : "#22c55e33"}`, color: msg.type === "error" ? "#ff4444" : "#22c55e", fontSize: 13 }}>{msg.text}</div>}
          <Btn onClick={salvar} style={{ marginTop: 18, width: "100%", padding: "13px" }}>Salvar Nova Senha</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── PAINEL ADMIN ─────────────────────────────────────────────────────────────
const ADMIN_NAV = [
  { id: "dashboard", label: "Dashboard", icon: "◈" },
  { id: "agenda",    label: "Agenda",    icon: "📅" },
  { id: "clientes",  label: "Clientes",  icon: "👥" },
  { id: "servicos",  label: "Serviços",  icon: "✂️" },
  { id: "equipe",    label: "Equipe",    icon: "💈" },
  { id: "config",    label: "Config.",   icon: "⚙️" },
];

function AdminPanel({ appointments, services, barbers, adminPass, setAdminPass, onLogout }) {
  const [tab, setTab] = useState("dashboard");
  return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ width: 210, background: G.card, borderRight: `1px solid ${G.border}`, display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 20px 24px", borderBottom: `1px solid ${G.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg,${G.accent},${G.accentD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💈</div>
            <div>
              <div style={{ color: G.text, fontWeight: 800, fontSize: 14, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1, lineHeight: 1 }}>Felipe</div>
              <div style={{ color: G.muted, fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase" }}>Barbearia · Admin</div>
            </div>
          </div>
        </div>
        <nav style={{ padding: "16px 10px", flex: 1 }}>
          {ADMIN_NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, marginBottom: 3, background: tab === n.id ? G.accent + "18" : "transparent", border: tab === n.id ? `1px solid ${G.borderM}` : "1px solid transparent", color: tab === n.id ? G.accent : G.muted, fontWeight: tab === n.id ? 700 : 500, fontSize: 13, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all .15s" }}>
              <span style={{ fontSize: 15 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${G.border}` }}>
          <div style={{ color: G.muted, fontSize: 11, marginBottom: 2 }}>Hoje</div>
          <div style={{ color: G.accent, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>{appointments.filter(a => a.date === TODAY).length} agendamentos</div>
          <button onClick={onLogout} style={{ background: "transparent", border: `1px solid ${G.border}`, color: G.muted, padding: "7px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit", width: "100%" }}>Sair</button>
        </div>
      </div>
      <div style={{ flex: 1, padding: "36px 40px", overflowY: "auto", maxHeight: "100vh" }}>
        {tab === "dashboard" && <AdminDashboard appointments={appointments} />}
        {tab === "agenda"    && <AdminAgenda appointments={appointments} services={services} barbers={barbers} />}
        {tab === "clientes"  && <AdminClientes appointments={appointments} />}
        {tab === "servicos"  && <AdminServicos services={services} />}
        {tab === "equipe"    && <AdminEquipe barbers={barbers} appointments={appointments} />}
        {tab === "config"    && <AdminConfig adminPass={adminPass} setAdminPass={setAdminPass} />}
      </div>
    </div>
  );
}

// ─── PÁGINA DO CLIENTE ────────────────────────────────────────────────────────
const STEPS = ["Serviço","Barbeiro","Data & Hora","Confirmação"];

function BookingProgress({ step }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 40 }}>
      {STEPS.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: i < step ? `linear-gradient(135deg,${G.accent},${G.accentD})` : i === step ? G.card : G.bg, border: `2px solid ${i <= step ? G.accent : G.dim}`, display: "flex", alignItems: "center", justifyContent: "center", color: i < step ? "#fff" : i === step ? G.accent : G.dim, fontWeight: 800, fontSize: 13, flexShrink: 0, transition: "all .3s" }}>
              {i < step ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 9, color: i === step ? G.accent : i < step ? G.accentD : G.dim, fontWeight: i === step ? 700 : 500, letterSpacing: .5, whiteSpace: "nowrap", textTransform: "uppercase" }}>{s}</span>
          </div>
          {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? `linear-gradient(90deg,${G.accent},${G.accentD})` : G.card, margin: "0 6px", marginBottom: 20, transition: "background .3s" }} />}
        </div>
      ))}
    </div>
  );
}

function getDays() {
  const days = [];
  const base = new Date(TODAY);
  for (let i = 0; i < 14; i++) { const d = new Date(base); d.setDate(base.getDate() + i); days.push(d); }
  return days;
}

function ClientBooking({ services, barbers }) {
  const [step, setStep]       = useState(0);
  const [service, setService] = useState(null);
  const [barber, setBarber]   = useState(null);
  const [date, setDate]       = useState(null);
  const [time, setTime]       = useState(null);
  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [done, setDone]       = useState(false);
  const days = getDays();

  const reset = () => { setStep(0); setService(null); setBarber(null); setDate(null); setTime(null); setName(""); setPhone(""); setDone(false); };

  const confirm = async () => {
    if (!name || !phone) return;
    const dateStr = date ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}` : "";
    await addDoc(collection(db, "appointments"), { client: name, phone, service: service.name, barber: barber.name, date: dateStr, time, price: service.price, status: "confirmed", createdAt: new Date().toISOString() });
    setDone(true);
  };

  if (done) return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", color: G.text, fontSize: 38, margin: "0 0 10px", letterSpacing: 1 }}>Agendado!</h2>
        <p style={{ color: G.muted, fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>Olá <strong style={{ color: G.accent }}>{name}</strong>, seu horário está confirmado!</p>
        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 18, padding: 22, textAlign: "left", marginBottom: 22 }}>
          {[["Serviço", service?.name], ["Barbeiro", barber?.name], ["Data", date ? `${WEEKDAYS[date.getDay()]}, ${date.getDate()}/${date.getMonth()+1}` : ""], ["Horário", time], ["Valor", `R$ ${service?.price}`]].map(([k,v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${G.border}` }}>
              <span style={{ color: G.muted, fontSize: 13 }}>{k}</span>
              <span style={{ color: G.text, fontWeight: 600, fontSize: 14 }}>{v}</span>
            </div>
          ))}
        </div>
        <Btn onClick={reset} style={{ width: "100%", padding: "14px", fontSize: 15 }}>Fazer novo agendamento</Btn>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: G.bg, fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ borderBottom: `1px solid ${G.border}`, padding: "18px 0", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg,${G.accent},${G.accentD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>💈</div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", color: G.text, fontSize: 26, letterSpacing: 2, lineHeight: 1 }}>Felipe</div>
            <div style={{ color: G.muted, fontSize: 9, letterSpacing: 3, textTransform: "uppercase" }}>Barbearia</div>
          </div>
        </div>
      </div>

      {step === 0 && (
        <div style={{ textAlign: "center", padding: "44px 24px 0" }}>
          <div style={{ display: "inline-block", background: G.accent + "18", border: `1px solid ${G.borderM}`, borderRadius: 20, padding: "5px 18px", marginBottom: 18 }}>
            <span style={{ color: G.accent, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Agende Online</span>
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", color: G.text, fontSize: "clamp(36px,7vw,60px)", margin: "0 0 10px", lineHeight: 1, letterSpacing: 2 }}>SEU ESTILO,<br /><span style={{ color: G.accent }}>NO SEU TEMPO</span></h1>
          <p style={{ color: G.muted, fontSize: 14, maxWidth: 360, margin: "0 auto 36px", lineHeight: 1.6 }}>Escolha o serviço, o barbeiro e o horário.</p>
        </div>
      )}

      <div style={{ maxWidth: 660, margin: "0 auto", padding: "28px 20px 60px" }}>
        <BookingProgress step={step} />

        {step === 0 && (
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", color: G.text, fontSize: 28, margin: "0 0 20px", letterSpacing: 1 }}>Qual serviço?</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {services.map(s => (
                <button key={s.id} onClick={() => { setService(s); setStep(1); }}
                  style={{ background: G.card, border: `1.5px solid ${G.border}`, borderRadius: 16, padding: "20px 16px", cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "border-color .2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = G.accent}
                  onMouseLeave={e => e.currentTarget.style.borderColor = G.border}>
                  <div style={{ fontSize: 26, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ color: G.text, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{s.name}</div>
                  <div style={{ color: G.muted, fontSize: 12, marginBottom: 12, lineHeight: 1.4 }}>{s.desc}</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: G.accent, fontWeight: 800, fontSize: 16 }}>R$ {s.price}</span>
                    <span style={{ color: G.dim, fontSize: 12 }}>{s.duration}min</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", color: G.text, fontSize: 28, margin: "0 0 20px", letterSpacing: 1 }}>Escolha o barbeiro</h2>
            {barbers.length === 0 && <div style={{ color: G.muted, textAlign: "center", padding: "40px 0" }}>Nenhum barbeiro disponível.</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {barbers.map(b => (
                <button key={b.id} onClick={() => { setBarber(b); setStep(2); }}
                  style={{ background: G.card, border: `1.5px solid ${G.border}`, borderRadius: 16, padding: "18px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, textAlign: "left", fontFamily: "inherit", transition: "border-color .2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = G.accent}
                  onMouseLeave={e => e.currentTarget.style.borderColor = G.border}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg,${b.color || G.accent},${(b.color || G.accent)}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#fff", flexShrink: 0 }}>{b.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: G.text, fontWeight: 700, fontSize: 15 }}>{b.name}</div>
                    <div style={{ color: G.muted, fontSize: 12, margin: "3px 0 6px" }}>{b.specialty}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Stars rating={b.rating} /><span style={{ color: G.accent, fontSize: 12, fontWeight: 700 }}>{b.rating}</span></div>
                  </div>
                  <span style={{ color: G.accent, fontSize: 20 }}>›</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(0)} style={{ marginTop: 18, background: "transparent", border: "none", color: G.muted, fontSize: 13, cursor: "pointer" }}>← Voltar</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", color: G.text, fontSize: 28, margin: "0 0 20px", letterSpacing: 1 }}>Quando?</h2>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 26 }}>
              {days.map((d, i) => {
                const sel = date && d.toDateString() === date.toDateString();
                return (
                  <button key={i} onClick={() => { setDate(d); setTime(null); }}
                    style={{ flexShrink: 0, width: 58, padding: "10px 0", background: sel ? `linear-gradient(135deg,${G.accent},${G.accentD})` : G.card, border: `1.5px solid ${sel ? G.accent : G.border}`, borderRadius: 14, cursor: "pointer", textAlign: "center", fontFamily: "inherit", transition: "all .15s" }}>
                    <div style={{ color: sel ? "#fff" : G.muted, fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>{WEEKDAYS[d.getDay()]}</div>
                    <div style={{ color: sel ? "#fff" : G.text, fontSize: 20, fontWeight: 800, margin: "3px 0" }}>{d.getDate()}</div>
                    <div style={{ color: sel ? "#ffffff88" : G.dim, fontSize: 9 }}>{MONTHS[d.getMonth()]}</div>
                  </button>
                );
              })}
            </div>
            {date && (
              <>
                <div style={{ color: G.accent, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>Horários disponíveis</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(76px,1fr))", gap: 8 }}>
                  {ALL_HOURS.map(h => {
                    const sel = time === h;
                    return <button key={h} onClick={() => setTime(h)} style={{ padding: "11px 0", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", background: sel ? `linear-gradient(135deg,${G.accent},${G.accentD})` : G.card, border: `1.5px solid ${sel ? G.accent : G.border}`, color: sel ? "#fff" : G.text, fontFamily: "inherit", transition: "all .15s" }}>{h}</button>;
                  })}
                </div>
              </>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <Btn variant="ghost" onClick={() => setStep(1)}>← Voltar</Btn>
              {date && time && <Btn onClick={() => setStep(3)} style={{ flex: 1 }}>Continuar →</Btn>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", color: G.text, fontSize: 28, margin: "0 0 20px", letterSpacing: 1 }}>Confirmar</h2>
            <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: 20, marginBottom: 22 }}>
              {[["Serviço", `${service?.icon} ${service?.name}`], ["Barbeiro", barber?.name], ["Data", date ? `${WEEKDAYS[date.getDay()]}, ${date.getDate()}/${date.getMonth()+1}` : ""], ["Horário", time], ["Duração", `${service?.duration} min`]].map(([k,v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${G.border}` }}>
                  <span style={{ color: G.muted, fontSize: 13 }}>{k}</span>
                  <span style={{ color: G.text, fontSize: 14, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0" }}>
                <span style={{ color: G.accent, fontWeight: 700 }}>Total</span>
                <span style={{ color: G.accent, fontWeight: 900, fontSize: 24, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1 }}>R$ {service?.price}</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
              <Field label="Seu nome" value={name} onChange={setName} placeholder="Como prefere ser chamado?" />
              <Field label="WhatsApp" value={phone} onChange={setPhone} placeholder="(11) 9 9999-9999" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="ghost" onClick={() => setStep(2)}>← Voltar</Btn>
              <Btn onClick={confirm} disabled={!name || !phone} style={{ flex: 1, padding: "13px", fontSize: 15 }}>✓ Confirmar Agendamento</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginModal({ onLogin, onClose, adminPass }) {
  const [pass, setPass] = useState("");
  const [err,  setErr]  = useState(false);
  const attempt = () => { if (pass === adminPass) { onLogin(); } else { setErr(true); setPass(""); } };
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000dd", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 20 }}>
      <div style={{ background: G.card, border: `1px solid ${G.borderM}`, borderRadius: 20, padding: 36, width: 360, maxWidth: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg,${G.accent},${G.accentD})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 14px" }}>🔐</div>
          <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", color: G.text, fontSize: 26, margin: 0, letterSpacing: 1 }}>Área Admin</h3>
          <p style={{ color: G.muted, fontSize: 13, marginTop: 4 }}>Felipe — Barbearia</p>
        </div>
        <Field label="Senha" value={pass} onChange={v => { setPass(v); setErr(false); }} type="password" placeholder="Digite a senha de acesso" />
        {err && <p style={{ color: "#ff4444", fontSize: 12, marginTop: 8, marginBottom: 0 }}>❌ Senha incorreta.</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <Btn variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancelar</Btn>
          <Btn onClick={attempt} style={{ flex: 2 }}>Entrar</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [appointments, setAppointments] = useState([]);
  const [services,     setServices]     = useState([]);
  const [barbers,      setBarbers]      = useState([]);
  const [adminPass,    setAdminPass]    = useState("1234");
  const [isAdmin,      setIsAdmin]      = useState(false);
  const [showLogin,    setShowLogin]    = useState(false);
  const [loading,      setLoading]      = useState(true);

  // Carrega dados do Firebase em tempo real
  useEffect(() => {
    const unsubs = [];

    // Senha admin
    const initConfig = async () => {
      const { getDoc } = await import("firebase/firestore");
      const snap = await getDoc(doc(db, "config", "admin"));
      if (snap.exists()) setAdminPass(snap.data().password);
    };
    initConfig();

    unsubs.push(onSnapshot(collection(db, "appointments"), snap => {
      setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }));

    unsubs.push(onSnapshot(collection(db, "services"), async snap => {
      let svcs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (svcs.length === 0) {
        // Popula serviços padrão na primeira vez
        for (const s of DEFAULT_SERVICES) await addDoc(collection(db, "services"), s);
      } else {
        setServices(svcs);
        setLoading(false);
      }
    }));

    unsubs.push(onSnapshot(collection(db, "barbers"), async snap => {
      let brbs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (brbs.length === 0) {
        for (const b of DEFAULT_BARBERS) await addDoc(collection(db, "barbers"), b);
      } else {
        setBarbers(brbs);
      }
    }));

    return () => unsubs.forEach(u => u());
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: G.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700;800&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💈</div>
        <div style={{ color: G.accent, fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, letterSpacing: 2 }}>FELIPE BARBEARIA</div>
        <div style={{ color: G.muted, fontSize: 13, marginTop: 8 }}>Carregando...</div>
      </div>
    </div>
  );

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;700;800&display=swap" rel="stylesheet" />
      {!isAdmin && (
        <button onClick={() => setShowLogin(true)}
          style={{ position: "fixed", bottom: 22, right: 22, background: `linear-gradient(135deg,${G.accent},${G.accentD})`, border: "none", color: "#fff", padding: "12px 20px", borderRadius: 50, fontWeight: 800, fontSize: 13, cursor: "pointer", zIndex: 100, boxShadow: `0 4px 24px ${G.accent}55`, fontFamily: "inherit" }}>
          🔐 Admin
        </button>
      )}
      {showLogin && <LoginModal adminPass={adminPass} onLogin={() => { setIsAdmin(true); setShowLogin(false); }} onClose={() => setShowLogin(false)} />}
      {isAdmin
        ? <AdminPanel appointments={appointments} services={services} barbers={barbers} adminPass={adminPass} setAdminPass={setAdminPass} onLogout={() => setIsAdmin(false)} />
        : <ClientBooking services={services} barbers={barbers} />
      }
    </>
  );
}
