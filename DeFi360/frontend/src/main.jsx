import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const { useState, useEffect, useRef, useCallback } = React;

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const COINS = ['ETH','BTC','USDC','USDT','DAI','LINK'];

const PricesContext = React.createContext({ prices:{}, ready:false });
const usePrices = () => React.useContext(PricesContext);

function PricesProvider({ children }){
  const [prices,setPrices]=useState({});
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    let alive=true;
    API.getPrices()
      .then(d=>{ if(alive && d?.prices){ setPrices(d.prices); setReady(true); } })
      .catch(()=>{ if(alive) setReady(true); });
    return ()=>{ alive=false; };
  },[]);
  return <PricesContext.Provider value={{ prices, ready }}>{children}</PricesContext.Provider>;
}

function evalRisk(ltv){
  const v = parseFloat(ltv);
  if (v >= 95) return { riskLevel:'critical', isHealthy:false, message:'ALERTA: riesgo inminente de liquidación' };
  if (v >= 90) return { riskLevel:'high',     isHealthy:false, message:'PRECAUCIÓN: LTV cerca del límite de liquidación' };
  if (v >= 75) return { riskLevel:'medium',   isHealthy:true,  message:'LTV elevado pero dentro del límite' };
  return        { riskLevel:'low',      isHealthy:true,  message:'LTV saludable' };
}
const RISK_LABEL = { low:'Bajo', medium:'Medio', high:'Alto', critical:'Crítico' };
const RISK_ICON  = { low:'shield', medium:'warning', high:'priority_high', critical:'release_alert' };

const usd  = (n, d=2) => '$' + Number(n||0).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const usd0 = (n) => '$' + Math.round(Number(n||0)).toLocaleString('en-US');
const pct  = (n, d=1) => Number(n||0).toFixed(d) + '%';
const shortAddr = (a) => a ? a.slice(0,6) + '…' + a.slice(-4) : '—';
function mockAddress(){
  let s='0x'; const h='0123456789abcdef';
  for (let i=0;i<40;i++) s += h[Math.floor(Math.random()*16)];
  return s;
}
function fmtDate(iso){ return iso ? new Date(iso).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}) : '—'; }
const ltvOf = (amount, collType, collAmount, prices={}) => {
  const price = prices[collType];
  if(!price || !collAmount) return null;
  return +(( amount / (collAmount * price) ) * 100).toFixed(2);
};

const TOKEN_KEY='authToken', USER_KEY='userData', SESSION_KEY='defi360_session';
function setSession(user, token){
  const { wallet, ...identity } = user || {};
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(identity));
  localStorage.setItem(SESSION_KEY, '1');
}
function clearSession(){ [TOKEN_KEY,USER_KEY,SESSION_KEY].forEach(k=>localStorage.removeItem(k)); }
function getStoredUser(){ try{ return JSON.parse(localStorage.getItem(USER_KEY)); }catch(e){ return null; } }
function hasSession(){ return localStorage.getItem(SESSION_KEY)==='1' && !!localStorage.getItem(TOKEN_KEY); }
function currentUserId(){ const u=getStoredUser(); return u ? u.id : null; }

const num = (v) => (v===null || v===undefined || v==='') ? v : (isNaN(+v) ? v : +v);

function normWallet(w){
  if(!w) return w;
  return { ...w,
    totalBalance:num(w.totalBalance), availableBalance:num(w.availableBalance),
    blockedBalance:num(w.blockedBalance), totalEarned:num(w.totalEarned) };
}
function normOffer(o){
  return { ...o,
    amount:num(o.amount), apy:num(o.apy), duration:num(o.duration),
    collateralAmount:num(o.collateralAmount), collateralPrice:num(o.collateralPrice),
    collateralValueUSD:num(o.collateralValueUSD), ltv:num(o.ltv),
    createdAt:o.createdAt || o.created_at };
}
function normLoan(l){
  const off = l.Offer || {};
  return { ...l,
    amount:num(l.amount), apy:num(l.apy), baseApy:num(l.baseApy), ltv:num(l.ltv),
    remainingBalance:num(l.remainingBalance), duration:num(l.duration),
    collateralType: l.collateralType || off.collateralType,
    collateralAmount: num(l.collateralAmount != null ? l.collateralAmount : off.collateralAmount),
    startDate: l.startDate || l.start_date,
    endDate: l.endDate || l.end_date,
    nextRateAdjustmentDate: l.nextRateAdjustmentDate || l.next_rate_adjustment_date,
    createdAt: l.createdAt || l.created_at };
}

async function request(path, { method='GET', body } = {}){
  const headers = { 'Content-Type':'application/json' };
  const token = localStorage.getItem(TOKEN_KEY);
  if(token) headers.Authorization = 'Bearer ' + token;

  let res;
  try{
    res = await fetch(API_BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  }catch(e){
    throw apiErr('No se pudo contactar al servidor. ¿El backend está corriendo en :3000?');
  }
  let data = null;
  try{ data = await res.json(); }catch(e){}
  if(!res.ok){ const err = apiErr(data?.message || ('Error '+res.status)); err.details = data?.details; err.status = res.status; throw err; }
  return data;
}
function apiErr(message){ const e=new Error(message); e.isApiError=true; return e; }

function persist(d){
  if(d && d.token){
    const user = { ...d.user, wallet: normWallet(d.user.wallet) };
    setSession(user, d.token);
    d.user = user;
  }
  return d;
}

const API = {
  async connectWallet(walletAddress){ return persist(await request('/auth/connect-wallet',{ method:'POST', body:{ walletAddress } })); },
  async register(body){ return persist(await request('/auth/register',{ method:'POST', body })); },
  async login(body){ return persist(await request('/auth/login',{ method:'POST', body })); },
  async getProfile(){ const d=await request('/auth/profile'); d.wallet=normWallet(d.wallet); return d; },

  async getOffers(query={}){
    const qs = new URLSearchParams(query).toString();
    const d = await request('/marketplace/offers' + (qs?`?${qs}`:''));
    return { ...d, offers:(d.offers||[]).map(normOffer) };
  },
  async createOffer(body){ const d=await request('/marketplace/offers',{ method:'POST', body }); d.offer=normOffer(d.offer); return d; },
  async cancelOffer(id){ return request(`/marketplace/offers/${id}`,{ method:'DELETE' }); },
  async getCacheStats(){ return request('/marketplace/cache-stats'); },
  async getPrices(){ return request('/marketplace/prices'); },

  async calculateLTV(body){ const d=await request('/loans/calculate-ltv',{ method:'POST', body }); d.ltv=num(d.ltv); d.collateralValue=num(d.collateralValue); return d; },
  async simulate(body){ return request('/loans/simulate',{ method:'POST', body }); },
  async requestLoan(body){ const d=await request('/loans/request',{ method:'POST', body }); d.offer=normOffer(d.offer); return d; },
  async getMyLoans(){
    const d = await request('/loans/my-loans');
    return { asLender:(d.asLender||[]).map(normLoan), asBorrower:(d.asBorrower||[]).map(normLoan) };
  },
  async matchLoan(id, { rateType='fixed' } = {}){ return request(`/loans/match/${id}`,{ method:'POST', body:{ rateType } }); },
  async payLoan(id, { amount }){ return request(`/loans/${id}/pay`,{ method:'POST', body:{ amount } }); },

  async createTicket(body){ return request('/support/tickets',{ method:'POST', body }); },
  async getTickets(){ return request('/support/tickets'); },
};

function Icon({ name, size, fill=0, wght=400, className='', style }){
  const s = size ? { fontSize:size } : null;
  return <span className={'ms '+className}
    style={{ ...(s||{}), fontVariationSettings:`'FILL' ${fill},'wght' ${wght},'GRAD' 0,'opsz' 24`, ...(style||{}) }}>{name}</span>;
}

function Logo({ size=34 }){
  return (
    <span className="logo" style={{ width:size, height:size }}>
      <Icon name="radar" size={size*0.62} wght={500} />
    </span>
  );
}

function Button({ variant='default', size, icon, iconEnd, loading, children, className='', ...rest }){
  const cls = ['btn', variant!=='default'&&'btn-'+variant, size&&'btn-'+size, !children&&'btn-icon', className].filter(Boolean).join(' ');
  return (
    <button className={cls} disabled={loading||rest.disabled} {...rest}>
      {loading ? <Icon name="progress_activity" className="spin" /> : icon ? <Icon name={icon} /> : null}
      {children}
      {iconEnd && !loading ? <Icon name={iconEnd} /> : null}
    </button>
  );
}

function Card({ pad, className='', children, ...rest }){
  return <div className={'card '+(pad?'card-pad ':'')+className} {...rest}>{children}</div>;
}

function Badge({ children, color, className='' }){
  return <span className={'badge '+className} style={color?{color}:null}>{children}</span>;
}
function RiskBadge({ level, ltv, showLtv=true, sm }){
  if(!level) return null;
  return (
    <span className={'badge risk risk-'+level} style={sm?{height:21,padding:'0 8px',fontSize:11}:null}>
      <Icon name={RISK_ICON[level]} size={sm?13:14} />
      {RISK_LABEL[level]}{showLtv && ltv!=null ? <span className="num" style={{opacity:.85}}>· {Number(ltv).toFixed(1)}%</span> : null}
    </span>
  );
}
function TypeTag({ type }){
  return <span className={'tag '+(type==='lend'?'tag-lend':'tag-borrow')}>
    <Icon name={type==='lend'?'trending_up':'request_quote'} size={13} />
    {type==='lend'?'Lend':'Borrow'}
  </span>;
}
function StatusChip({ status }){
  const map={ active:'Activa', matched:'Financiado', cancelled:'Cancelada', completed:'Completada', paid:'Pagado', defaulted:'Impago', liquidated:'Liquidado' };
  return <span className={'badge status status-'+status}><span className="dot"></span>{map[status]||status}</span>;
}

function Coin({ sym, size=38 }){
  return <span className={'coin '+sym} style={{ width:size, height:size, fontSize:size*0.3 }}>{sym}</span>;
}

function Field({ label, hint, children, error }){
  return (
    <label className="field">
      {label && <span className="label">{label}</span>}
      {children}
      {error ? <span className="faint" style={{fontSize:12,color:'var(--risk-critical)'}}>{error}</span>
             : hint ? <span className="faint" style={{fontSize:12}}>{hint}</span> : null}
    </label>
  );
}
function Input({ icon, suffix, ...rest }){
  if(icon||suffix) return (
    <span className="input-group">
      {icon && <Icon name={icon} />}
      <input className="input" {...rest} />
      {suffix && <span className="input-suffix">{suffix}</span>}
    </span>
  );
  return <input className="input" {...rest} />;
}
function Select({ children, ...rest }){ return <select className="select" {...rest}>{children}</select>; }
function Textarea(props){ return <textarea className="textarea" {...props} />; }

function Seg({ value, onChange, options }){
  return (
    <div className="seg">
      {options.map(o=>(
        <button key={o.value} className={(value===o.value?'on ':'')+(o.tone||'')}
          onClick={()=>onChange(o.value)}>
          {o.icon && <Icon name={o.icon} />}{o.label}
        </button>
      ))}
    </div>
  );
}

function LTVMeter({ ltv, height=9, ticks=true }){
  const v=Math.max(0,Math.min(120, Number(ltv)||0));
  const { riskLevel }=evalRisk(v);
  const color='var(--risk-'+riskLevel+')';
  return (
    <div>
      <div className="meter" style={{height}}>
        <i style={{ width:Math.min(100,v/1.2)+'%', background:color, boxShadow:'0 0 12px '+color }}></i>
      </div>
      {ticks && (
        <div className="meter-ticks">
          {[75,90,95].map(t=><span key={t} style={{left:(t/1.2)+'%'}}><b>{t}</b></span>)}
        </div>
      )}
    </div>
  );
}

function KPI({ icon, label, value, sub, accent }){
  return (
    <Card className={'kpi rise '+(accent?'accent':'')}>
      <div className="k-top">
        <span className="k-lab">{label}</span>
        <span className="k-ic"><Icon name={icon} /></span>
      </div>
      <div className="k-val num">{value}</div>
      {sub && <div className="k-sub">{sub}</div>}
    </Card>
  );
}

function Spark({ data, pos }){
  const max=Math.max(...data,1);
  return <div className={'spark '+(pos?'pos':'')}>{data.map((d,i)=><i key={i} style={{height:(d/max*100)+'%'}}></i>)}</div>;
}

function AddressChip({ address, name }){
  const [copied,setCopied]=useState(false);
  const copy=()=>{ try{navigator.clipboard.writeText(address);}catch(e){} setCopied(true); setTimeout(()=>setCopied(false),1200); };
  if(!address) return <span className="addr"><Icon name="mail" />{name||'Usuario tradicional'}</span>;
  return (
    <span className="addr link" onClick={copy} title={address}>
      <Icon name={copied?'check':'account_balance_wallet'} />{shortAddr(address)}
    </span>
  );
}

function Empty({ icon='inbox', title, children }){
  return <div className="empty"><Icon name={icon} /><b style={{color:'var(--text-dim)'}}>{title}</b>{children && <span style={{fontSize:13}}>{children}</span>}</div>;
}
function Skeleton({ h=16, w='100%', r=8, style }){ return <div className="skeleton" style={{height:h,width:w,borderRadius:r,...style}} />; }

function Modal({ open, onClose, title, icon, children, footer, maxWidth }){
  useEffect(()=>{
    if(!open) return;
    const h=e=>{ if(e.key==='Escape') onClose&&onClose(); };
    window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h);
  },[open]);
  if(!open) return null;
  return (
    <div className="scrim" onMouseDown={e=>{ if(e.target===e.currentTarget) onClose&&onClose(); }}>
      <div className="modal" style={maxWidth?{maxWidth}:null}>
        {title && (
          <div className="modal-head">
            <div className="between">
              <div className="row gap-10">{icon && <span className="k-ic" style={{background:'var(--accent-soft)',color:'var(--accent-2)'}}><Icon name={icon} /></span>}<h3 style={{fontSize:17}}>{title}</h3></div>
              <Button variant="ghost" size="sm" icon="close" onClick={onClose} />
            </div>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

let _toastId=0;
function toast(opts){
  const detail = typeof opts==='string' ? { title:opts } : opts;
  window.dispatchEvent(new CustomEvent('app-toast',{ detail:{ id:++_toastId, kind:'info', ...detail } }));
}
function ToastHost(){
  const [items,setItems]=useState([]);
  useEffect(()=>{
    const on=e=>{
      const t=e.detail; setItems(s=>[...s,t]);
      setTimeout(()=>setItems(s=>s.filter(x=>x.id!==t.id)), t.duration||3600);
    };
    window.addEventListener('app-toast',on); return ()=>window.removeEventListener('app-toast',on);
  },[]);
  const ic={ ok:'check_circle', err:'error', info:'info' };
  return (
    <div className="toast-wrap">
      {items.map(t=>(
        <div key={t.id} className={'toast '+t.kind}>
          <Icon name={ic[t.kind]||'info'} fill={1} />
          <div className="t-body"><b>{t.title}</b>{t.sub && <small>{t.sub}</small>}</div>
        </div>
      ))}
    </div>
  );
}

function useAsync(fn, deps=[]){
  const [state,setState]=useState({ loading:true, data:null, error:null });
  const run=useCallback(()=>{
    let alive=true; setState(s=>({ ...s, loading:true, error:null }));
    Promise.resolve(fn()).then(d=>{ if(alive) setState({ loading:false, data:d, error:null }); })
      .catch(e=>{ if(alive) setState({ loading:false, data:null, error:e }); });
    return ()=>{ alive=false; };
  },deps);
  useEffect(()=>run(),[run]);
  return { ...state, reload:run };
}

function Login({ onAuth }){
  const { prices } = usePrices();
  const [mode,setMode]=useState('login');
  const [form,setForm]=useState({ name:'', email:'', password:'' });
  const [busy,setBusy]=useState('');
  const [addr,setAddr]=useState('');
  const [err,setErr]=useState('');
  const set=(k,v)=>setForm(f=>({ ...f, [k]:v }));

  const connect=async()=>{
    setErr(''); setBusy('wallet');
    const generated=mockAddress(); setAddr(generated);
    try{
      await new Promise(r=>setTimeout(r,520));
      const res=await API.connectWallet(generated);
      toast({ kind:'ok', title:'Billetera conectada', sub:shortAddr(generated) });
      onAuth(res.user, res.isNewUser);
    }catch(e){ setErr(e.message); setBusy(''); }
  };
  const submitEmail=async(e)=>{
    e.preventDefault(); setErr(''); setBusy('email');
    try{
      const res = mode==='login'
        ? await API.login({ email:form.email, password:form.password })
        : await API.register({ name:form.name, email:form.email, password:form.password });
      toast({ kind:'ok', title: mode==='login'?'Sesión iniciada':'Cuenta creada', sub:res.user.email });
      onAuth(res.user, res.isNewUser);
    }catch(e){ setErr(e.message); setBusy(''); }
  };

  return (
    <div className="auth">
      <aside className="auth-aside">
        <div className="row gap-10">
          <Logo size={36} /><b style={{fontSize:19,letterSpacing:'-.02em'}}>DeFi360</b>
          <Badge className="">Simulador</Badge>
        </div>
        <div className="auth-hero">
          <h1 className="display" style={{fontSize:42,lineHeight:1.05}}>
            Aprende préstamos<br/>cripto sin arriesgar<br/><span style={{color:'var(--accent-2)'}}>un solo dólar.</span>
          </h1>
          <p className="dim" style={{fontSize:15.5,maxWidth:440,marginTop:18,lineHeight:1.6}}>
            Presta, pide prestado y entiende el <b style={{color:'var(--text)'}}>LTV</b>, el <b style={{color:'var(--text)'}}>APY</b> y
            las liquidaciones en un entorno P2P totalmente simulado. Recibes <b style={{color:'var(--text)'}}>5 000 USD</b> de
            bienvenida al registrarte.
          </p>
        </div>
        <div className="auth-stats">
          {[['account_balance','Colateralizado','LTV en vivo'],['bolt','APY hasta 9.4%','Rendimiento P2P'],['shield_lock','0 riesgo real','Fondos simulados']].map(([i,a,b])=>(
            <div className="tile" key={a}>
              <Icon name={i} className="dim" />
              <div style={{marginTop:8,fontWeight:650,fontSize:14}}>{a}</div>
              <div className="faint" style={{fontSize:12}}>{b}</div>
            </div>
          ))}
        </div>
        <div className="auth-ticker">
          {COINS.map(c=>(
            <span key={c} className="row gap-6"><Coin sym={c} size={20} /><b style={{fontSize:12.5}}>{c}</b><span className="mono faint" style={{fontSize:12}}>{prices[c]!=null?usd0(prices[c]):'—'}</span></span>
          ))}
        </div>
      </aside>

      <main className="auth-main">
        <div className="auth-card fade-in">
          <div style={{textAlign:'center',marginBottom:6}}>
            <h2 style={{fontSize:23}}>Entra a DeFi360</h2>
            <p className="dim" style={{fontSize:14,marginTop:6}}>Dos formas de acceder. Elige la tuya.</p>
          </div>

          <button className="web3-btn" onClick={connect} disabled={!!busy}>
            <span className="w3-ic"><Icon name={busy==='wallet'?'progress_activity':'account_balance_wallet'} className={busy==='wallet'?'spin':''} size={22} /></span>
            <span className="col" style={{alignItems:'flex-start',gap:2}}>
              <b style={{fontSize:14.5}}>{busy==='wallet'?'Conectando MockWallet…':'Conectar billetera'}</b>
              <small className="mono faint" style={{fontSize:11.5}}>{addr?shortAddr(addr):'Autenticación Web3 · 0x…'}</small>
            </span>
            <Icon name="arrow_forward" className="faint" />
          </button>

          <div className="divider-text" style={{margin:'18px 0'}}>o continúa con correo</div>

          <div className="seg" style={{width:'100%'}}>
            {[['login','Iniciar sesión'],['register','Crear cuenta']].map(([v,l])=>(
              <button key={v} className={mode===v?'on':''} style={{flex:1,justifyContent:'center'}} onClick={()=>{setMode(v);setErr('');}}>{l}</button>
            ))}
          </div>

          <form onSubmit={submitEmail} className="col gap-14" style={{marginTop:16}}>
            {mode==='register' && (
              <Field label="Nombre">
                <Input icon="badge" placeholder="Tu nombre" value={form.name} onChange={e=>set('name',e.target.value)} required />
              </Field>
            )}
            <Field label="Correo">
              <Input icon="mail" type="email" placeholder="tu@correo.com" value={form.email} onChange={e=>set('email',e.target.value)} required />
            </Field>
            <Field label="Contraseña" hint={mode==='register'?'Mínimo 8 caracteres':null}>
              <Input icon="lock" type="password" placeholder="••••••••" value={form.password} onChange={e=>set('password',e.target.value)} required />
            </Field>
            {err && <div className="callout danger"><Icon name="error" />{err}</div>}
            <Button variant="primary" size="lg" type="submit" loading={busy==='email'} className="btn-block">
              {mode==='login'?'Entrar':'Crear cuenta y recibir 5 000 USD'}
            </Button>
          </form>

          <p className="faint" style={{fontSize:11.5,textAlign:'center',marginTop:16,lineHeight:1.5}}>
            Entorno educativo. No se manejan fondos reales ni datos sensibles.
          </p>
        </div>
      </main>
    </div>
  );
}

function LoanCard({ loan, role, onPay }){
  const { prices } = usePrices();
  const risk=evalRisk(loan.ltv);
  const paid=loan.amount-loan.remainingBalance;
  const paidPct=loan.amount>0 ? (paid/loan.amount)*100 : 0;
  const counter = role==='borrower' ? loan.Lender : loan.Borrower;
  const collPrice = prices[loan.collateralType];
  const collValue = loan.collateralAmount && collPrice ? loan.collateralAmount*collPrice : null;
  return (
    <Card className="lcard rise">
      <div className="between">
        <div className="row gap-10">
          <Coin sym={loan.collateralType} />
          <div className="col">
            <div className="row gap-8">
              <b style={{fontSize:14.5}}>Préstamo #{loan.id}</b>
              <StatusChip status={loan.status} />
            </div>
            <span className="faint" style={{fontSize:12}}>
              {role==='borrower'?'Prestamista':'Deudor'}: {counter?.name || shortAddr(counter?.walletAddress)}
            </span>
          </div>
        </div>
        <RiskBadge level={risk.riskLevel} ltv={loan.ltv} />
      </div>

      <div className="grid g-3" style={{gap:12}}>
        <div className="tile" style={{padding:'11px 13px'}}>
          <div className="up">Monto</div><div className="num" style={{fontSize:17,fontWeight:650,marginTop:3}}>{usd0(loan.amount)}</div>
        </div>
        <div className="tile" style={{padding:'11px 13px'}}>
          <div className="up">APY · {loan.rateType==='fixed'?'fija':'variable'}</div>
          <div className="num" style={{fontSize:17,fontWeight:650,marginTop:3,color:'var(--accent-2)'}}>{pct(loan.apy)}</div>
        </div>
        <div className="tile" style={{padding:'11px 13px'}}>
          <div className="up">Colateral</div>
          <div className="num" style={{fontSize:17,fontWeight:650,marginTop:3}}>{loan.collateralAmount} {loan.collateralType}</div>
        </div>
      </div>

      <div className="col gap-8">
        <div className="between" style={{fontSize:12}}>
          <span className="dim">LTV actual</span>
          <span className="num dim">{collValue?'Colateral '+usd0(collValue):''}</span>
        </div>
        <LTVMeter ltv={loan.ltv} />
      </div>

      {loan.status==='active' && (
        <div className="progress-pay">
          <div className="between" style={{fontSize:12}}>
            <span className="dim">Saldo restante</span>
            <span className="num"><b>{usd(loan.remainingBalance)}</b> <span className="faint">/ {usd0(loan.amount)}</span></span>
          </div>
          <div className="acc-bar"><i style={{width:paidPct+'%'}}></i></div>
        </div>
      )}

      {loan.rateType==='variable' && loan.nextRateAdjustmentDate && loan.status==='active' && (
        <div className="faint row gap-6" style={{fontSize:11.5}}>
          <Icon name="schedule" size={14} />Próximo reajuste de tasa: {fmtDate(loan.nextRateAdjustmentDate)}
        </div>
      )}

      {role==='borrower' && loan.status==='active' && (
        <div className="row gap-10">
          <Button variant="primary" size="sm" icon="payments" onClick={()=>onPay(loan)} className="grow">Pagar cuota</Button>
          {(risk.riskLevel==='high'||risk.riskLevel==='critical') &&
            <Button variant="soft" size="sm" icon="add" onClick={()=>onPay(loan)}>Subir colateral</Button>}
        </div>
      )}
    </Card>
  );
}

function PayModal({ loan, onClose, onDone }){
  const { prices } = usePrices();
  const [amount,setAmount]=useState(()=> Math.min(loan.remainingBalance, Math.round(loan.remainingBalance/2)) );
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState('');
  const projected = (loan.collateralAmount
    ? ltvOf(Math.max(0,loan.remainingBalance-amount), loan.collateralType, loan.collateralAmount, prices) : null) ?? loan.ltv;
  const pr=evalRisk(projected), cr=evalRisk(loan.ltv);
  const pay=async()=>{
    setBusy(true); setErr('');
    try{
      const res=await API.payLoan(loan.id,{ amount:+amount });
      toast({ kind:'ok', title: res.loanStatus==='paid'?'Préstamo liquidado 🎉':'Pago procesado', sub:`${res.transactionId} · LTV ${res.newLTV}%` });
      onDone();
    }catch(e){ setErr(e.message); setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={`Pagar préstamo #${loan.id}`} icon="payments"
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button variant="primary" icon="check" loading={busy} onClick={pay}>Confirmar pago</Button></>}>
      <div className="col gap-16">
        <div className="between tile">
          <span className="dim" style={{fontSize:13}}>Saldo restante</span>
          <b className="num" style={{fontSize:18}}>{usd(loan.remainingBalance)}</b>
        </div>
        <Field label="Monto a pagar (USD)">
          <Input type="number" icon="attach_money" value={amount} min={1} max={loan.remainingBalance}
            onChange={e=>setAmount(Math.min(loan.remainingBalance, Math.max(0,+e.target.value)))} />
        </Field>
        <div className="row gap-8">
          {[0.25,0.5,1].map(f=>(
            <Button key={f} variant="ghost" size="sm" className="grow"
              onClick={()=>setAmount(Math.round(loan.remainingBalance*f))}>{f===1?'Total':`${f*100}%`}</Button>
          ))}
        </div>
        <div className="tile col gap-10">
          <div className="between" style={{fontSize:12.5}}>
            <span className="dim">LTV tras el pago</span>
            <span className="row gap-8"><RiskBadge level={cr.riskLevel} ltv={loan.ltv} sm /><Icon name="arrow_forward" size={14} className="faint" /><RiskBadge level={pr.riskLevel} ltv={projected} sm /></span>
          </div>
          <LTVMeter ltv={projected} />
        </div>
        {err && <div className="callout danger"><Icon name="error" />{err}</div>}
      </div>
    </Modal>
  );
}

function Dashboard({ session, refreshSession }){
  const loans=useAsync(()=>API.getMyLoans(),[]);
  const [tab,setTab]=useState('borrower');
  const [payLoan,setPayLoan]=useState(null);
  const w=session.wallet||{};

  const asBorrower=loans.data?.asBorrower||[];
  const asLender=loans.data?.asLender||[];
  const atRisk=asBorrower.filter(l=>l.status==='active' && !evalRisk(l.ltv).isHealthy);
  const activeLent=asLender.filter(l=>l.status==='active').reduce((s,l)=>s+l.remainingBalance,0);
  const activeOwed=asBorrower.filter(l=>l.status==='active').reduce((s,l)=>s+l.remainingBalance,0);
  const projInterest=asLender.filter(l=>l.status==='active').reduce((s,l)=>s+l.amount*(l.apy/100)*(l.duration/365),0);

  const list = tab==='borrower'?asBorrower:asLender;
  const afterPay=()=>{ setPayLoan(null); loans.reload(); refreshSession(); };

  return (
    <div className="page">
      {atRisk.length>0 && (
        <div className="callout danger rise" style={{marginBottom:18}}>
          <Icon name="release_alert" fill={1} />
          <div>
            <b>{atRisk.length} préstamo{atRisk.length>1?'s':''} con riesgo de liquidación.</b>
            <div className="dim" style={{fontSize:13,marginTop:2}}>
              Tu LTV superó el 90%. Paga una cuota o añade colateral para evitar la liquidación.
            </div>
          </div>
          <Button variant="danger" size="sm" icon="bolt" style={{marginLeft:'auto'}}
            onClick={()=>{ setTab('borrower'); const t=atRisk[0]; setPayLoan(t); }}>Resolver ahora</Button>
        </div>
      )}

      <div className="grid g-4">
        <KPI accent icon="account_balance_wallet" label="Balance total" value={usd(w.totalBalance)}
          sub={<><Icon name="trending_up" size={14} className="delta-up" /><span className="delta-up">+{usd(w.totalEarned)}</span> ganado histórico</>} />
        <KPI icon="payments" label="Disponible" value={usd(w.availableBalance)} sub={<span className="faint">Listo para prestar o pagar</span>} />
        <KPI icon="lock" label="Bloqueado" value={usd(w.blockedBalance)} sub={<span className="faint">En ofertas y préstamos activos</span>} />
        <KPI icon="savings" label="Interés ganado" value={usd(w.totalEarned)} sub={<span className="faint">Comisión P2P acumulada</span>} />
      </div>

      <div className="grid" style={{gridTemplateColumns:'1.7fr 1fr',marginTop:18,alignItems:'start'}}>
        <Card>
          <div className="card-head">
            <h3>Mis préstamos</h3>
            <Seg value={tab} onChange={setTab} options={[
              { value:'borrower', label:`Como deudor (${asBorrower.length})`, icon:'request_quote' },
              { value:'lender', label:`Como prestamista (${asLender.length})`, icon:'trending_up' },
            ]} />
          </div>
          <div className="card-pad">
            {loans.loading ? <div className="col gap-14">{[0,1].map(i=><Skeleton key={i} h={150} r={16} />)}</div>
             : list.length===0 ? <Empty icon="account_balance_wallet" title="Aún no tienes préstamos aquí">
                  {tab==='borrower'?'Solicita un préstamo desde el Marketplace.':'Financia una solicitud para empezar a ganar APY.'}
                </Empty>
             : <div className="grid g-2">{list.map(l=><LoanCard key={l.id} loan={l} role={tab} onPay={setPayLoan} />)}</div>}
          </div>
        </Card>

        <div className="col gap-18">
          <Card pad className="col gap-14">
            <div className="between"><h3 style={{fontSize:14}}>Resumen de cartera</h3><Icon name="donut_small" className="faint" /></div>
            <div className="col gap-10">
              {[['Prestado activo',activeLent,'var(--risk-low)'],['Pedido activo',activeOwed,'var(--accent-2)'],['Interés proyectado',projInterest,'var(--text)']].map(([l,v,c])=>(
                <div className="between" key={l}>
                  <span className="dim row gap-8" style={{fontSize:13}}><span className="dot" style={{background:c}}></span>{l}</span>
                  <b className="num">{usd(v)}</b>
                </div>
              ))}
            </div>
            <hr className="hairline" />
            <div className="col gap-8">
              <div className="up">Distribución del balance</div>
              <div className="acc-bar" style={{height:10}}>
                <i style={{width:(w.blockedBalance/(w.totalBalance||1)*100)+'%',background:'linear-gradient(90deg,var(--accent),var(--accent-2))'}}></i>
              </div>
              <div className="between faint" style={{fontSize:11.5}}>
                <span>Bloqueado {Math.round(w.blockedBalance/(w.totalBalance||1)*100)}%</span>
                <span>Disponible {Math.round(w.availableBalance/(w.totalBalance||1)*100)}%</span>
              </div>
            </div>
          </Card>

          <Card pad className="col gap-12">
            <div className="between"><h3 style={{fontSize:14}}>Salud de mis posiciones</h3><Icon name="ecg_heart" className="faint" /></div>
            {asBorrower.filter(l=>l.status==='active').length===0
              ? <span className="faint" style={{fontSize:13}}>Sin préstamos activos como deudor.</span>
              : asBorrower.filter(l=>l.status==='active').map(l=>{
                  const r=evalRisk(l.ltv);
                  return <div className="col gap-6" key={l.id}>
                    <div className="between" style={{fontSize:12.5}}><span className="dim">#{l.id} · {l.collateralType}</span><RiskBadge level={r.riskLevel} ltv={l.ltv} sm /></div>
                    <LTVMeter ltv={l.ltv} ticks={false} height={7} />
                  </div>;
                })}
          </Card>
        </div>
      </div>

      {payLoan && <PayModal loan={payLoan} onClose={()=>setPayLoan(null)} onDone={afterPay} />}
    </div>
  );
}

function OfferCard({ offer, onMatch, onCancel, navigate }){
  const mine=offer.userId===currentUserId();
  const risk=offer.ltv!=null?evalRisk(offer.ltv):null;
  const isBorrow=offer.type==='borrow';
  return (
    <Card className="lcard rise">
      <div className="between">
        <div className="row gap-10">
          <Coin sym={offer.collateralType||'USDC'} />
          <div className="col">
            <div className="row gap-8"><b className="num" style={{fontSize:18}}>{usd0(offer.amount)}</b><TypeTag type={offer.type} /></div>
            <span className="faint" style={{fontSize:12}}>
              {isBorrow?'Solicita':'Ofrece'} · <AddressChip address={offer.User?.walletAddress} name={offer.User?.name} />
            </span>
          </div>
        </div>
        {mine && <Badge><Icon name="person" size={13} />Tuya</Badge>}
      </div>

      <div className="grid g-3" style={{gap:10}}>
        <div className="tile" style={{padding:'10px 12px'}}>
          <div className="up">APY</div><div className="num" style={{fontSize:16,fontWeight:650,marginTop:2,color:'var(--accent-2)'}}>{pct(offer.apy)}</div>
        </div>
        <div className="tile" style={{padding:'10px 12px'}}>
          <div className="up">Plazo</div><div className="num" style={{fontSize:16,fontWeight:650,marginTop:2}}>{offer.duration}d</div>
        </div>
        <div className="tile" style={{padding:'10px 12px'}}>
          <div className="up">Colateral</div><div className="num" style={{fontSize:15,fontWeight:650,marginTop:2}}>{offer.collateralAmount} {offer.collateralType}</div>
        </div>
      </div>

      {offer.ltv!=null && (
        <div className="col gap-8">
          <div className="between" style={{fontSize:12}}>
            <span className="dim row gap-6">LTV <RiskBadge level={risk.riskLevel} ltv={offer.ltv} showLtv={false} sm /></span>
            <span className="num faint">Valor colateral {usd0(offer.collateralValueUSD)}</span>
          </div>
          <LTVMeter ltv={offer.ltv} />
        </div>
      )}

      <div className="row gap-10">
        {mine ? (
          <Button variant="danger" size="sm" icon="delete" className="grow" onClick={()=>onCancel(offer)}>Cancelar oferta</Button>
        ) : isBorrow ? (
          <Button variant="primary" size="sm" icon="bolt" className="grow" onClick={()=>onMatch(offer)}>Financiar y ganar {pct(offer.apy)}</Button>
        ) : (
          <Button variant="soft" size="sm" icon="request_quote" className="grow"
            onClick={()=>navigate('borrow')}>Pedir prestado</Button>
        )}
      </div>
    </Card>
  );
}

function MatchModal({ offer, onClose, onDone }){
  const [rateType,setRateType]=useState('fixed');
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState('');
  const variableApy=+(offer.apy+0.6).toFixed(1);
  const shownApy=rateType==='fixed'?offer.apy:variableApy;
  const interest=offer.amount*(shownApy/100)*(offer.duration/365);
  const confirm=async()=>{
    setBusy(true); setErr('');
    try{
      const res=await API.matchLoan(offer.id,{ rateType });
      toast({ kind:'ok', title:'Préstamo financiado', sub:`#${res.loan.id} · tasa ${res.rateType}` });
      onDone();
    }catch(e){ setErr(e.message); setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title="Financiar solicitud" icon="bolt" maxWidth={480}
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button variant="primary" icon="check" loading={busy} onClick={confirm}>Prestar {usd0(offer.amount)}</Button></>}>
      <div className="col gap-16">
        <div className="between tile">
          <div className="row gap-10"><Coin sym={offer.collateralType} /><div className="col"><b>{offer.User?.name||shortAddr(offer.User?.walletAddress)}</b><span className="faint" style={{fontSize:12}}>solicita {usd0(offer.amount)} · {offer.duration} días</span></div></div>
          <RiskBadge level={evalRisk(offer.ltv).riskLevel} ltv={offer.ltv} />
        </div>

        <Field label="Tipo de tasa (rateType)">
          <Seg value={rateType} onChange={setRateType} options={[
            { value:'fixed', label:'Fija', icon:'lock' },
            { value:'variable', label:'Variable', icon:'show_chart' },
          ]} />
        </Field>

        <div className="grid g-3" style={{gap:10}}>
          <div className="tile"><div className="up">APY</div><div className="num" style={{fontSize:18,fontWeight:650,color:'var(--accent-2)'}}>{pct(shownApy)}</div></div>
          <div className="tile"><div className="up">Interés est.</div><div className="num" style={{fontSize:18,fontWeight:650,color:'var(--risk-low)'}}>+{usd0(interest)}</div></div>
          <div className="tile"><div className="up">A recibir</div><div className="num" style={{fontSize:18,fontWeight:650}}>{usd0(offer.amount+interest)}</div></div>
        </div>

        <div className="callout">
          <Icon name="info" />
          {rateType==='fixed'
            ? 'Tasa fija: el APY se mantiene constante durante todo el plazo del préstamo.'
            : `Tasa variable: parte de un APY base y se reajusta cada 30 días según el mercado.`}
        </div>
        {err && <div className="callout danger"><Icon name="error" />{err}</div>}
      </div>
    </Modal>
  );
}

function CacheStatsChip({ refreshKey }){
  const [data,setData]=useState(null);
  useEffect(()=>{
    let alive=true;
    API.getCacheStats().then(d=>{ if(alive) setData(d); }).catch(()=>{});
    return ()=>{ alive=false; };
  },[refreshKey]);
  if(!data) return null;
  const { hits, misses, hitRate }=data.stats;
  const pctHit=Math.round((hitRate||0)*100);
  return (
    <span className="badge" style={{gap:8}}
      title={`Táctica de performance: Caché con TTL (${data.ttlMs} ms).\nHIT = precio servido desde memoria · MISS = consulta real al oráculo.`}>
      <Icon name="bolt" size={14} fill={1} style={{color:'var(--accent-2)'}} />
      Caché de precios
      <b className="num" style={{color:'var(--risk-low)'}}>{pctHit}% aciertos</b>
      <span className="faint num">· {hits} HIT / {misses} MISS</span>
    </span>
  );
}

function Marketplace({ navigate, refreshSession }){
  const [type,setType]=useState('all');
  const [sort,setSort]=useState('recent');
  const [minApy,setMinApy]=useState(0);
  const offers=useAsync(()=>API.getOffers(type==='all'?{}:{type}),[type]);
  const [match,setMatch]=useState(null);
  const [cancel,setCancel]=useState(null);
  const [busyCancel,setBusyCancel]=useState(false);

  let list=(offers.data?.offers||[]).filter(o=>o.apy>=minApy);
  list=[...list].sort((a,b)=>{
    if(sort==='apy') return b.apy-a.apy;
    if(sort==='amount') return b.amount-a.amount;
    if(sort==='ltv') return (a.ltv||0)-(b.ltv||0);
    return new Date(b.createdAt)-new Date(a.createdAt);
  });

  const doCancel=async()=>{
    setBusyCancel(true);
    try{ await API.cancelOffer(cancel.id); toast({kind:'ok',title:'Oferta cancelada'}); setCancel(null); offers.reload(); refreshSession(); }
    catch(e){ toast({kind:'err',title:e.message}); }
    setBusyCancel(false);
  };
  const afterMatch=()=>{ setMatch(null); offers.reload(); refreshSession(); };

  const counts={ all:offers.data?.count||0,
    lend:(offers.data?.offers||[]).filter(o=>o.type==='lend').length,
    borrow:(offers.data?.offers||[]).filter(o=>o.type==='borrow').length };

  return (
    <div className="page">
      <div className="between wrap" style={{marginBottom:18,gap:14}}>
        <div className="col gap-10">
          <p className="dim" style={{fontSize:14,maxWidth:560}}>
            Solicitudes y ofertas P2P publicadas por la comunidad. <b style={{color:'var(--text)'}}>Financia</b> una solicitud para ganar APY,
            o <b style={{color:'var(--text)'}}>pide prestado</b> contra colateral.
          </p>
          <CacheStatsChip refreshKey={offers.data} />
        </div>
        <div className="row gap-10 wrap">
          <Button variant="soft" icon="request_quote" onClick={()=>navigate('borrow')}>Solicitar préstamo</Button>
          <Button variant="primary" icon="add" onClick={()=>navigate('lend')}>Publicar oferta</Button>
        </div>
      </div>

      <div className="between wrap" style={{marginBottom:18,gap:12}}>
        <Seg value={type} onChange={setType} options={[
          { value:'all', label:`Todos · ${counts.all}` },
          { value:'lend', label:`Lend · ${counts.lend}`, icon:'trending_up', tone:'lend' },
          { value:'borrow', label:`Borrow · ${counts.borrow}`, icon:'request_quote', tone:'borrow' },
        ]} />
        <div className="row gap-10 wrap">
          <div className="row gap-8 tile" style={{padding:'7px 12px'}}>
            <Icon name="percent" className="faint" size={16} />
            <span className="faint" style={{fontSize:12}}>APY ≥</span>
            <input className="range" style={{width:110}} type="range" min={0} max={10} step={0.5} value={minApy} onChange={e=>setMinApy(+e.target.value)} />
            <b className="num" style={{fontSize:13,width:34}}>{minApy}%</b>
          </div>
          <Select value={sort} onChange={e=>setSort(e.target.value)} style={{width:170,height:40}}>
            <option value="recent">Más recientes</option>
            <option value="apy">Mayor APY</option>
            <option value="amount">Mayor monto</option>
            <option value="ltv">Menor LTV (riesgo)</option>
          </Select>
        </div>
      </div>

      {offers.loading
        ? <div className="grid g-3">{[0,1,2,3,4,5].map(i=><Skeleton key={i} h={280} r={18} />)}</div>
        : list.length===0
          ? <Card pad><Empty icon="storefront" title="No hay ofertas con estos filtros">Ajusta el tipo o el APY mínimo.</Empty></Card>
          : <div className="grid g-3">{list.map(o=><OfferCard key={o.id} offer={o} navigate={navigate} onMatch={setMatch} onCancel={setCancel} />)}</div>}

      {match && <MatchModal offer={match} onClose={()=>setMatch(null)} onDone={afterMatch} />}
      {cancel && (
        <Modal open onClose={()=>setCancel(null)} title="Cancelar oferta" icon="delete"
          footer={<><Button variant="ghost" onClick={()=>setCancel(null)}>Volver</Button><Button variant="danger" loading={busyCancel} icon="delete" onClick={doCancel}>Sí, cancelar</Button></>}>
          <p className="dim" style={{fontSize:14,lineHeight:1.6}}>
            ¿Cancelar tu oferta de {usd0(cancel.amount)} ({cancel.type})? Si es de tipo <b>lend</b>, se desbloquearán los fondos a tu saldo disponible.
          </p>
        </Modal>
      )}
    </div>
  );
}

function CollateralPicker({ type, amount, onType, onAmount }){
  const { prices } = usePrices();
  return (
    <div className="grid g-2" style={{gap:12}}>
      <Field label="Tipo de colateral">
        <Select value={type} onChange={e=>onType(e.target.value)}>
          {COINS.map(c=><option key={c} value={c}>{c}{prices[c]!=null?` · ${usd0(prices[c])}`:''}</option>)}
        </Select>
      </Field>
      <Field label="Cantidad de colateral">
        <Input type="number" step="0.01" min="0" icon="diamond" value={amount} onChange={e=>onAmount(e.target.value)} suffix={type} />
      </Field>
    </div>
  );
}

function Borrow({ navigate, refreshSession }){
  const { prices } = usePrices();
  const [amount,setAmount]=useState(1500);
  const [collType,setCollType]=useState('ETH');
  const [collAmount,setCollAmount]=useState(1);
  const [duration,setDuration]=useState(60);
  const [ltv,setLtv]=useState(null);
  const [calcLoading,setCalcLoading]=useState(false);
  const [busy,setBusy]=useState(false);
  const [done,setDone]=useState(null);

  useEffect(()=>{
    if(!amount||!collAmount){ setLtv(null); return; }
    setCalcLoading(true);
    const t=setTimeout(async()=>{
      try{ const res=await API.calculateLTV({ loanAmount:+amount, collateralAmount:+collAmount, collateralType:collType }); setLtv(res); }
      catch(e){ setLtv(null); }
      setCalcLoading(false);
    },360);
    return ()=>clearTimeout(t);
  },[amount,collType,collAmount]);

  const collValue=(+collAmount||0)*(prices[collType]||0);
  const insufficient=collValue < +amount;
  const interest=(+amount)*0.05*(duration/365);

  const submit=async()=>{
    setBusy(true);
    try{
      const res=await API.requestLoan({ amount:+amount, duration:+duration, collateralType:collType, collateralAmount:+collAmount });
      toast({ kind:'ok', title:'Solicitud publicada', sub:`${usd0(amount)} en el Marketplace` });
      setDone(res.offer); refreshSession();
    }catch(e){
      toast({ kind:'err', title:'No se pudo publicar', sub:e.details?.ltv?`LTV ${e.details.ltv} · colateral insuficiente`:e.message });
      setBusy(false);
    }
  };

  if(done) return <FormDone title="Solicitud publicada en el Marketplace" sub={`Tu solicitud de ${usd0(done.amount)} ya está visible para los prestamistas. Te avisaremos cuando alguien la financie.`}
    navigate={navigate} primary={['marketplace','Ver en Marketplace','storefront']} secondary={['dashboard','Ir al Dashboard']} />;

  const r=ltv?evalRisk(ltv.ltv):null;
  return (
    <div className="page page-narrow">
      <div className="grid" style={{gridTemplateColumns:'1.1fr .9fr',alignItems:'start',gap:20}}>
        <Card pad className="col gap-18">
          <div className="col gap-6"><h3>Detalles del préstamo</h3><span className="faint" style={{fontSize:13}}>Tasa fija del 5.0% APY para solicitudes. Bloquearás tu colateral como garantía.</span></div>
          <Field label="¿Cuánto quieres pedir? (USD)">
            <Input type="number" min="0" icon="attach_money" value={amount} onChange={e=>setAmount(e.target.value)} />
          </Field>
          <div className="row gap-8">
            {[500,1500,3000,5000].map(v=><Button key={v} variant="ghost" size="sm" className="grow" onClick={()=>setAmount(v)}>{usd0(v)}</Button>)}
          </div>
          <CollateralPicker type={collType} amount={collAmount} onType={setCollType} onAmount={setCollAmount} />
          <Field label={`Plazo: ${duration} días`}>
            <input className="range" type="range" min={15} max={240} step={15} value={duration} onChange={e=>setDuration(+e.target.value)} />
            <div className="between faint" style={{fontSize:11}}><span>15d</span><span>240d</span></div>
          </Field>
        </Card>

        <Card pad className="col gap-16" style={{position:'sticky',top:90}}>
          <div className="between"><h3 style={{fontSize:15}}>Análisis de riesgo</h3>
            {calcLoading?<Icon name="progress_activity" className="spin faint" />:<Badge><Icon name="sensors" size={13} />en vivo</Badge>}</div>

          <div className="col" style={{alignItems:'center',gap:6,padding:'6px 0'}}>
            <div className="num display" style={{fontSize:46,color:r?`var(--risk-${r.riskLevel})`:'var(--text)'}}>{ltv?ltv.ltv.toFixed(1):'—'}<span style={{fontSize:22}}>%</span></div>
            <span className="up">Loan-to-Value</span>
          </div>
          <LTVMeter ltv={ltv?ltv.ltv:0} />
          {ltv && <div className="row" style={{justifyContent:'center'}}><RiskBadge level={r.riskLevel} ltv={ltv.ltv} showLtv={false} /></div>}

          <div className={'callout '+(!ltv?'':r.riskLevel==='critical'||r.riskLevel==='high'?'danger':r.riskLevel==='medium'?'warn':'')}>
            <Icon name={ltv?RISK_ICON[r.riskLevel]:'info'} />
            <span>{ltv?ltv.message:'Introduce monto y colateral para evaluar el riesgo.'}</span>
          </div>

          <div className="col gap-8">
            {[['Valor del colateral',usd(collValue)],['Interés estimado (5% APY)','+'+usd(interest)],['Total a devolver',usd((+amount||0)+interest)]].map(([l,v])=>(
              <div className="between" key={l} style={{fontSize:13}}><span className="dim">{l}</span><b className="num">{v}</b></div>
            ))}
          </div>

          {insufficient && <div className="callout danger"><Icon name="error" />El colateral ({usd0(collValue)}) no cubre el préstamo solicitado.</div>}
          <Button variant="primary" size="lg" icon="publish" className="btn-block" loading={busy} disabled={insufficient||!amount||!collAmount} onClick={submit}>
            Publicar solicitud
          </Button>
        </Card>
      </div>
    </div>
  );
}

function Lend({ navigate, session, refreshSession }){
  const [amount,setAmount]=useState(2000);
  const [apy,setApy]=useState(7.5);
  const [duration,setDuration]=useState(90);
  const [collType,setCollType]=useState('ETH');
  const [collAmount,setCollAmount]=useState(1);
  const [busy,setBusy]=useState(false);
  const [done,setDone]=useState(null);
  const avail=session.wallet?.availableBalance||0;
  const insufficient=+amount>avail;
  const interest=(+amount)*(apy/100)*(duration/365);
  const total=(+amount)+interest;
  const dailyData=Array.from({length:14},(_,i)=> (+amount)*(apy/100)*((duration*(i+1)/14)/365));

  const submit=async()=>{
    setBusy(true);
    try{
      const res=await API.createOffer({ type:'lend', amount:+amount, apy:+apy, duration:+duration, collateralType:collType, collateralAmount:+collAmount });
      toast({ kind:'ok', title:'Oferta publicada', sub:`${usd0(amount)} bloqueados · ${pct(apy)} APY` });
      setDone(res.offer); refreshSession();
    }catch(e){ toast({ kind:'err', title:'No se pudo publicar', sub:e.message }); setBusy(false); }
  };

  if(done) return <FormDone title="Oferta de lending publicada" sub={`Bloqueamos ${usd0(done.amount)} de tu saldo. Ganarás ${pct(done.apy)} APY cuando un deudor acepte tu oferta.`}
    navigate={navigate} primary={['marketplace','Ver en Marketplace','storefront']} secondary={['dashboard','Ir al Dashboard']} />;

  return (
    <div className="page page-narrow">
      <div className="grid" style={{gridTemplateColumns:'1.1fr .9fr',alignItems:'start',gap:20}}>
        <Card pad className="col gap-18">
          <div className="between">
            <div className="col gap-6"><h3>Ofrecer fondos</h3><span className="faint" style={{fontSize:13}}>Publica capital para que otros lo tomen prestado y gana interés.</span></div>
          </div>
          <div className="between tile">
            <span className="dim row gap-8" style={{fontSize:13}}><Icon name="account_balance_wallet" size={16} />Saldo disponible</span>
            <b className="num">{usd(avail)}</b>
          </div>
          <Field label="Monto a prestar (USD)" error={insufficient?'Supera tu saldo disponible':null}>
            <Input type="number" min="0" icon="attach_money" value={amount} onChange={e=>setAmount(e.target.value)} />
          </Field>
          <div className="row gap-8">
            {[1000,2000,4180].map(v=><Button key={v} variant="ghost" size="sm" className="grow" onClick={()=>setAmount(Math.min(v,avail))}>{v===4180?'Máx':usd0(v)}</Button>)}
          </div>
          <Field label={`APY ofrecido: ${pct(apy)}`}>
            <input className="range" type="range" min={1} max={12} step={0.1} value={apy} onChange={e=>setApy(+e.target.value)} />
            <div className="between faint" style={{fontSize:11}}><span>1%</span><span>Mercado ≈ 7%</span><span>12%</span></div>
          </Field>
          <Field label={`Plazo: ${duration} días`}>
            <input className="range" type="range" min={15} max={240} step={15} value={duration} onChange={e=>setDuration(+e.target.value)} />
          </Field>
          <CollateralPicker type={collType} amount={collAmount} onType={setCollType} onAmount={setCollAmount} />
        </Card>

        <Card pad className="col gap-16" style={{position:'sticky',top:90}}>
          <h3 style={{fontSize:15}}>Proyección de rendimiento</h3>
          <div className="col" style={{alignItems:'center',gap:4,padding:'4px 0'}}>
            <div className="num display" style={{fontSize:40,color:'var(--risk-low)'}}>+{usd0(interest)}</div>
            <span className="up">Interés estimado · {duration} días</span>
          </div>
          <Spark data={dailyData} pos />
          <div className="col gap-8">
            {[['Capital prestado',usd(amount)],['APY',pct(apy)],['Interés / día','+'+usd((+amount)*(apy/100)/365)],['Total al vencimiento',usd(total)]].map(([l,v])=>(
              <div className="between" key={l} style={{fontSize:13}}><span className="dim">{l}</span><b className="num" style={l==='Total al vencimiento'?{color:'var(--accent-2)'}:null}>{v}</b></div>
            ))}
          </div>
          <div className="callout"><Icon name="lock" />Al publicar, bloqueamos {usd0(amount)} de tu saldo disponible hasta que se financie o canceles la oferta.</div>
          <Button variant="primary" size="lg" icon="publish" className="btn-block" loading={busy} disabled={insufficient||!amount} onClick={submit}>Publicar oferta de lending</Button>
        </Card>
      </div>
    </div>
  );
}

function FormDone({ title, sub, navigate, primary, secondary }){
  return (
    <div className="page page-narrow">
      <Card pad className="col" style={{alignItems:'center',gap:16,textAlign:'center',padding:'48px 30px'}}>
        <span className="k-ic" style={{width:64,height:64,borderRadius:18,background:'color-mix(in oklab,var(--risk-low) 16%,transparent)',color:'var(--risk-low)'}}><Icon name="check_circle" fill={1} size={34} /></span>
        <h2 style={{fontSize:24}}>{title}</h2>
        <p className="dim" style={{fontSize:14.5,maxWidth:420,lineHeight:1.6}}>{sub}</p>
        <div className="row gap-10 mt-10">
          <Button variant="primary" icon={primary[2]} onClick={()=>navigate(primary[0])}>{primary[1]}</Button>
          <Button variant="ghost" onClick={()=>navigate(secondary[0])}>{secondary[1]}</Button>
        </div>
      </Card>
    </div>
  );
}

function Simulator(){
  const [mode,setMode]=useState('borrow');
  const [amount,setAmount]=useState(2000);
  const [apy,setApy]=useState(7.5);
  const [duration,setDuration]=useState(90);
  const [collType,setCollType]=useState('ETH');
  const [collAmount,setCollAmount]=useState(1);
  const [shock,setShock]=useState(0);
  const [sim,setSim]=useState(null);

  useEffect(()=>{
    if(mode!=='borrow' || !amount || !collAmount){ setSim(null); return; }
    const t=setTimeout(async()=>{
      try{ setSim(await API.simulate({ loanAmount:+amount, collateralType:collType, collateralAmount:+collAmount, priceShockPct:shock })); }
      catch(e){ setSim(null); }
    },300);
    return ()=>clearTimeout(t);
  },[mode,amount,collType,collAmount,shock]);

  const price=sim?.shockedPrice ?? 0;
  const collValue=sim?.collateralValue ?? 0;
  const ltv=sim?.ltv ?? 0;
  const r=sim ? { riskLevel:sim.riskLevel, isHealthy:sim.isHealthy, message:sim.message } : evalRisk(0);
  const liqPrice=amount/(collAmount*0.95);
  const borrowInterest=amount*0.05*(duration/365);
  const lendInterest=amount*(apy/100)*(duration/365);

  return (
    <div className="page page-narrow">
      <Card pad className="between" style={{marginBottom:18}}>
        <div className="col gap-4"><h3>Simulador de escenarios</h3><span className="faint" style={{fontSize:13}}>El LTV y el precio shockeado los calcula el backend. No afecta tu wallet.</span></div>
        <Seg value={mode} onChange={setMode} options={[
          { value:'borrow', label:'Pedir prestado', icon:'request_quote', tone:'borrow' },
          { value:'lend', label:'Prestar', icon:'trending_up', tone:'lend' },
        ]} />
      </Card>

      <div className="grid" style={{gridTemplateColumns:'1fr 1fr',alignItems:'start',gap:20}}>
        <Card pad className="col gap-16">
          <Field label="Monto (USD)"><Input type="number" icon="attach_money" value={amount} onChange={e=>setAmount(+e.target.value||0)} /></Field>
          {mode==='lend' && (
            <Field label={`APY: ${pct(apy)}`}><input className="range" type="range" min={1} max={12} step={0.1} value={apy} onChange={e=>setApy(+e.target.value)} /></Field>
          )}
          {mode==='borrow' && <CollateralPicker type={collType} amount={collAmount} onType={setCollType} onAmount={setCollAmount} />}
          <Field label={`Plazo: ${duration} días`}><input className="range" type="range" min={15} max={240} step={15} value={duration} onChange={e=>setDuration(+e.target.value)} /></Field>
          {mode==='borrow' && (
            <Field label={`Estrés de precio del colateral: ${shock>0?'+':''}${shock}%`} hint="Simula una caída o subida del precio del colateral en el oráculo.">
              <input className="range" type="range" min={-80} max={50} step={5} value={shock} onChange={e=>setShock(+e.target.value)} />
            </Field>
          )}
        </Card>

        <Card pad className="col gap-16" style={{position:'sticky',top:90}}>
          {mode==='borrow' ? (
            <>
              <div className="col" style={{alignItems:'center',gap:6}}>
                <div className="num display" style={{fontSize:46,color:`var(--risk-${r.riskLevel})`}}>{ltv.toFixed(1)}<span style={{fontSize:22}}>%</span></div>
                <RiskBadge level={r.riskLevel} ltv={ltv} showLtv={false} />
              </div>
              <LTVMeter ltv={ltv} />
              <div className="col gap-8">
                {[['Precio actual '+collType,usd(price)],['Valor del colateral',usd(collValue)],['Interés (5% APY)','+'+usd(borrowInterest)],['Total a devolver',usd(amount+borrowInterest)],['Precio de liquidación '+collType,usd(liqPrice)]].map(([l,v])=>(
                  <div className="between" key={l} style={{fontSize:13}}><span className="dim">{l}</span><b className="num">{v}</b></div>
                ))}
              </div>
              <div className={'callout '+(r.isHealthy?'':'danger')}><Icon name={RISK_ICON[r.riskLevel]} />
                {r.isHealthy?`Si ${collType} cae a ${usd(liqPrice)} tu préstamo entra en liquidación.`:'Posición en zona de liquidación. Reduce el préstamo o añade colateral.'}</div>
            </>
          ) : (
            <>
              <div className="col" style={{alignItems:'center',gap:4}}>
                <div className="num display" style={{fontSize:44,color:'var(--risk-low)'}}>+{usd0(lendInterest)}</div>
                <span className="up">Interés en {duration} días</span>
              </div>
              <Spark data={Array.from({length:14},(_,i)=>amount*(apy/100)*((duration*(i+1)/14)/365))} pos />
              <div className="col gap-8">
                {[['Capital',usd(amount)],['APY',pct(apy)],['Interés / día','+'+usd(amount*(apy/100)/365)],['Rendimiento del periodo',pct(apy*(duration/365),2)],['Total al vencimiento',usd(amount+lendInterest)]].map(([l,v])=>(
                  <div className="between" key={l} style={{fontSize:13}}><span className="dim">{l}</span><b className="num">{v}</b></div>
                ))}
              </div>
              <div className="callout"><Icon name="info" />El rendimiento real depende de que un deudor acepte tu oferta y pague en plazo.</div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

const CONCEPTS=[
  ['account_balance','¿Qué es el lending P2P?','Prestar y pedir prestado directamente entre personas, sin un banco intermediario. Un prestamista aporta capital y gana interés; un deudor recibe fondos a cambio de bloquear un colateral.'],
  ['diamond','Colateral','Activo cripto (ETH, BTC…) que el deudor bloquea como garantía. Si no paga, el colateral cubre la deuda. Su valor en USD lo fija el oráculo de precios.'],
  ['percent','APY','Rendimiento anualizado del préstamo. Un APY del 7.5% sobre 1 000 USD a 90 días ≈ 18.5 USD de interés. Puede ser de tasa fija o variable.'],
  ['swap_vert','Tasa fija vs variable','La tasa fija no cambia durante el préstamo. La variable parte de un APY base y se reajusta periódicamente (cada 30 días) según el mercado.'],
  ['release_alert','Liquidación','Si el LTV supera el 95%, la posición se liquida: se vende el colateral para cubrir la deuda. Mantén un LTV bajo para evitarlo.'],
  ['savings','Saldo de bienvenida','Al registrarte recibes 5 000 USD simulados para practicar préstamos y depósitos sin ningún riesgo real.'],
];
function Education(){
  return (
    <div className="page page-narrow">
      <Card pad className="col gap-10" style={{marginBottom:18,background:'radial-gradient(600px 300px at 90% -20%, var(--accent-soft), transparent 60%)'}}>
        <Badge><Icon name="school" size={13} />Zona educativa</Badge>
        <h2 style={{fontSize:26,maxWidth:560}}>Domina el LTV, el APY y las liquidaciones antes de arriesgar capital real.</h2>
        <p className="dim" style={{fontSize:14.5,maxWidth:580,lineHeight:1.6}}>Conceptos esenciales de las finanzas descentralizadas, explicados con el vocabulario exacto que usa DeFi360.</p>
      </Card>

      <Card style={{marginBottom:18}}>
        <div className="card-head"><h3>Niveles de riesgo por LTV</h3><span className="faint" style={{fontSize:12}}>Loan-to-Value = préstamo / valor del colateral × 100</span></div>
        <table className="table">
          <thead><tr><th>Nivel</th><th>Rango LTV</th><th>Significado</th><th>Estado</th></tr></thead>
          <tbody>
            {[['low','LTV < 75%','Posición saludable, amplio margen.'],['medium','LTV ≥ 75%','Vigila el precio del colateral.'],['high','LTV ≥ 90%','Genera alerta de riesgo.'],['critical','LTV ≥ 95%','Liquidación inminente.']].map(([lv,range,desc])=>(
              <tr key={lv}>
                <td><RiskBadge level={lv} showLtv={false} /></td>
                <td className="num"><b>{range}</b></td>
                <td className="dim">{desc}</td>
                <td>{['high','critical'].includes(lv)?<span style={{color:'var(--risk-critical)',fontSize:13}}>isHealthy: false</span>:<span style={{color:'var(--risk-low)',fontSize:13}}>isHealthy: true</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid g-2">
        {CONCEPTS.map(([ic,t,b])=>(
          <Card pad key={t} className="col gap-10 rise">
            <span className="k-ic" style={{background:'var(--accent-soft)',color:'var(--accent-2)'}}><Icon name={ic} /></span>
            <h3 style={{fontSize:16}}>{t}</h3>
            <p className="dim" style={{fontSize:13.5,lineHeight:1.6}}>{b}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

const FAQS=[
  ['¿DeFi360 maneja dinero real?','No. Es un entorno educativo totalmente simulado. Recibes 5 000 USD ficticios al registrarte.'],
  ['¿Cómo conecto mi billetera?','En la pantalla de acceso pulsa “Conectar billetera”. Generamos una dirección MockWallet (0x…) y creamos tu sesión Web3.'],
  ['¿Qué pasa si mi LTV llega a 95%?','Tu préstamo entra en liquidación: el colateral se usa para cubrir la deuda. Paga cuotas o añade colateral para mantener el LTV bajo.'],
  ['¿Puedo cancelar una oferta publicada?','Sí. Si era de tipo lend, los fondos bloqueados vuelven a tu saldo disponible al cancelar.'],
  ['¿Cuál es la diferencia entre tasa fija y variable?','La fija no cambia; la variable se reajusta cada 30 días desde un APY base.'],
];
function Support(){
  const tickets=useAsync(()=>API.getTickets(),[]);
  const [form,setForm]=useState({ subject:'', description:'', priority:'medium' });
  const [busy,setBusy]=useState(false);
  const [open,setOpen]=useState(0);
  const set=(k,v)=>setForm(f=>({ ...f, [k]:v }));
  const submit=async(e)=>{
    e.preventDefault(); setBusy(true);
    try{
      const res=await API.createTicket(form);
      toast({ kind:'ok', title:'Ticket creado', sub:res.ticketNumber });
      setForm({ subject:'', description:'', priority:'medium' }); tickets.reload();
    }catch(err){ toast({ kind:'err', title:err.message }); }
    setBusy(false);
  };
  const prMap={ low:['Baja','risk-low'], medium:['Media','status-active'], high:['Alta','risk-high'], critical:['Crítica','risk-critical'] };
  const stMap={ open:'Abierto', in_progress:'En proceso', resolved:'Resuelto', closed:'Cerrado' };

  return (
    <div className="page">
      <div className="grid" style={{gridTemplateColumns:'1fr 1.1fr',alignItems:'start',gap:20}}>
        <div className="col gap-18">
          <Card pad className="col gap-14">
            <h3>Crear ticket de soporte</h3>
            <form onSubmit={submit} className="col gap-14">
              <Field label="Asunto"><Input icon="subject" placeholder="Resume tu consulta" value={form.subject} onChange={e=>set('subject',e.target.value)} required /></Field>
              <Field label="Descripción"><Textarea placeholder="Cuéntanos con detalle qué ocurre…" value={form.description} onChange={e=>set('description',e.target.value)} required /></Field>
              <Field label="Prioridad">
                <Seg value={form.priority} onChange={v=>set('priority',v)} options={[
                  { value:'low', label:'Baja' },{ value:'medium', label:'Media' },{ value:'high', label:'Alta' },{ value:'critical', label:'Crítica' },
                ]} />
              </Field>
              <Button variant="primary" icon="send" type="submit" loading={busy} className="btn-block">Enviar ticket</Button>
            </form>
          </Card>

          <Card>
            <div className="card-head"><h3>Preguntas frecuentes</h3></div>
            <div>
              {FAQS.map(([q,a],i)=>(
                <div key={i} style={{borderBottom:'1px solid var(--border)'}}>
                  <button className="between" style={{width:'100%',background:'none',border:0,color:'inherit',padding:'15px 22px',cursor:'pointer',textAlign:'left'}} onClick={()=>setOpen(open===i?-1:i)}>
                    <b style={{fontSize:13.5}}>{q}</b><Icon name={open===i?'remove':'add'} className="faint" />
                  </button>
                  {open===i && <p className="dim fade-in" style={{fontSize:13.5,lineHeight:1.6,padding:'0 22px 16px'}}>{a}</p>}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <div className="card-head"><h3>Mis tickets</h3>{tickets.data && <Badge>{tickets.data.tickets.length}</Badge>}</div>
          <div className="card-pad col gap-12">
            {tickets.loading ? [0,1].map(i=><Skeleton key={i} h={90} r={12} />)
             : tickets.data.tickets.length===0 ? <Empty icon="support_agent" title="Sin tickets todavía">Crea uno cuando lo necesites.</Empty>
             : tickets.data.tickets.map(t=>(
                <div className="tile col gap-10 rise" key={t.id}>
                  <div className="between">
                    <div className="col gap-2"><b style={{fontSize:13.5}}>{t.subject}</b><span className="mono faint" style={{fontSize:11.5}}>{t.ticketNumber}</span></div>
                    <span className={'badge '+prMap[t.priority][1]} style={{height:21,fontSize:11}}>{prMap[t.priority][0]}</span>
                  </div>
                  <p className="dim" style={{fontSize:13,lineHeight:1.55}}>{t.description}</p>
                  {t.response && <div className="callout" style={{fontSize:12.5}}><Icon name="support_agent" />{t.response}</div>}
                  <div className="between"><StatusChip status={t.status==='in_progress'?'matched':t.status==='resolved'?'paid':'active'} /><span className="faint" style={{fontSize:11.5}}>{stMap[t.status]} · {fmtDate(t.createdAt)}</span></div>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

const NAV=[
  { id:'dashboard',   label:'Dashboard',  icon:'space_dashboard', title:'Dashboard', sub:'Resumen de tu wallet y préstamos' },
  { id:'marketplace', label:'Marketplace', icon:'storefront',     title:'Marketplace', sub:'Ofertas y solicitudes P2P' },
  { id:'borrow',      label:'Pedir préstamo', icon:'request_quote', title:'Solicitar préstamo', sub:'Análisis de LTV en vivo' },
  { id:'lend',        label:'Ofrecer fondos', icon:'trending_up',  title:'Ofrecer fondos', sub:'Publica capital y gana APY' },
  { id:'simulator',   label:'Simulador',   icon:'calculate',       title:'Simulador', sub:'Escenarios locales lend / borrow' },
  { id:'education',   label:'Aprende',     icon:'school',          title:'Zona educativa', sub:'DeFi, LTV, APY y riesgos' },
  { id:'support',     label:'Soporte',     icon:'support_agent',   title:'Soporte', sub:'Tickets y preguntas frecuentes' },
];

function Sidebar({ view, navigate, open, session, onLogout }){
  return (
    <aside className={'sidebar '+(open?'open':'')}>
      <div className="brand">
        <Logo /><b>DeFi360</b><Badge style={{height:18,padding:'0 7px',fontSize:10}}>sim</Badge>
      </div>
      <div className="nav-group col gap-2">
        {NAV.map(n=>(
          <div key={n.id} className={'nav-item '+(view===n.id?'on':'')} onClick={()=>navigate(n.id)}>
            <Icon name={n.icon} fill={view===n.id?1:0} />{n.label}
          </div>
        ))}
      </div>
      <div className="sidebar-foot col gap-10">
        <hr className="hairline" />
        <div className="tile row gap-10" style={{padding:'10px 12px'}}>
          <span className="avatar">{(session.name||'A').slice(0,1).toUpperCase()}</span>
          <div className="col" style={{minWidth:0}}>
            <b style={{fontSize:13,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{session.name||'Usuario'}</b>
            <span className="faint" style={{fontSize:11}}>
              {session.walletAddress?shortAddr(session.walletAddress):session.email}
            </span>
          </div>
          <Button variant="ghost" size="sm" icon="logout" onClick={onLogout} title="Cerrar sesión" style={{marginLeft:'auto'}} />
        </div>
      </div>
    </aside>
  );
}

function Topbar({ meta, session, onMenu, navigate }){
  const w=session.wallet||{};
  return (
    <header className="topbar">
      <Button variant="ghost" size="sm" icon="menu" onClick={onMenu} className="only-mobile" />
      <div className="col" style={{gap:1}}>
        <h2>{meta.title}</h2>
        <span className="crumb">{meta.sub}</span>
      </div>
      <div className="row gap-12" style={{marginLeft:'auto'}}>
        <div className="wallet-chip" onClick={()=>navigate('dashboard')} style={{cursor:'pointer'}}>
          <Icon name="account_balance_wallet" className="dim" />
          <div className="bal"><small>Disponible</small><b className="num">{usd(w.availableBalance)}</b></div>
          <span className="avatar">{(session.name||'A').slice(0,1).toUpperCase()}</span>
        </div>
      </div>
    </header>
  );
}

function App(){
  const [session,setSession]=useState(()=> hasSession()?getStoredUser():null );
  const [view,setView]=useState('dashboard');
  const [menu,setMenu]=useState(false);

  const navigate=(v)=>{ setView(v); setMenu(false); window.scrollTo(0,0); };
  const refreshSession=useCallback(async()=>{
    try{ const p=await API.getProfile();
      const next={ id:p.user.id, name:p.user.name, email:p.user.email, walletAddress:p.user.walletAddress, role:p.user.role, wallet:p.wallet };
      const { wallet, ...identity }=next;
      localStorage.setItem(USER_KEY, JSON.stringify(identity)); setSession(next);
    }catch(e){}
  },[]);
  const onAuth=(user)=>{ setSession(user); setView('dashboard'); };
  const onLogout=()=>{ clearSession(); setSession(null); setView('dashboard'); toast({ kind:'info', title:'Sesión cerrada' }); };

  useEffect(()=>{ if(hasSession()) refreshSession(); },[refreshSession]);

  if(!session){
    return <><Login onAuth={onAuth} /><ToastHost /></>;
  }

  const meta=NAV.find(n=>n.id===view)||NAV[0];
  const screens={
    dashboard:   <Dashboard session={session} refreshSession={refreshSession} />,
    marketplace: <Marketplace navigate={navigate} refreshSession={refreshSession} />,
    borrow:      <Borrow navigate={navigate} refreshSession={refreshSession} />,
    lend:        <Lend navigate={navigate} session={session} refreshSession={refreshSession} />,
    simulator:   <Simulator />,
    education:   <Education />,
    support:     <Support />,
  };

  return (
    <div className="app">
      <Sidebar view={view} navigate={navigate} open={menu} session={session} onLogout={onLogout} />
      {menu && <div className="scrim only-mobile" style={{zIndex:18}} onClick={()=>setMenu(false)} />}
      <div className="main">
        <Topbar meta={meta} session={session} onMenu={()=>setMenu(true)} navigate={navigate} />
        <div key={view} className="fade-in">{screens[view]}</div>
      </div>
      <ToastHost />
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <PricesProvider><App /></PricesProvider>
);
