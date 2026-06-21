import { useState, useEffect, useRef } from "react";

const initialMenu = [
  { id: 1, categoria: "Cafés", nombre: "Espresso", precio: 1500, descripcion: "Café concentrado", disponible: true, emoji: "☕" },
  { id: 2, categoria: "Cafés", nombre: "Latte", precio: 2000, descripcion: "Espresso con leche vaporizada", disponible: true, emoji: "🥛" },
  { id: 3, categoria: "Cafés", nombre: "Cappuccino", precio: 2000, descripcion: "Espresso con espuma de leche", disponible: true, emoji: "☕" },
  { id: 4, categoria: "Bebidas", nombre: "Jugo de naranja", precio: 1800, descripcion: "Exprimido natural", disponible: true, emoji: "🍊" },
  { id: 5, categoria: "Bebidas", nombre: "Agua mineral", precio: 800, descripcion: "500ml con o sin gas", disponible: true, emoji: "💧" },
  { id: 6, categoria: "Comidas", nombre: "Tostado mixto", precio: 2500, descripcion: "Jamón y queso", disponible: true, emoji: "🥪" },
  { id: 7, categoria: "Comidas", nombre: "Medialunas x3", precio: 1500, descripcion: "Recién horneadas", disponible: true, emoji: "🥐" },
  { id: 8, categoria: "Dulces", nombre: "Brownie", precio: 1800, descripcion: "Con chips de chocolate", disponible: true, emoji: "🍫" },
];

const MESAS = ["Mesa 1", "Mesa 2", "Mesa 3", "Mesa 4", "Mesa 5", "Bar"];
const DEFAULT_PASSWORD = "cafe1234";

const colors = {
  bg: "#FDF6EE", card: "#FFFFFF", primary: "#6B3A2A", accent: "#C8813A",
  light: "#F5E6D3", muted: "#9A7B6B", border: "#E8D5C0",
  success: "#3B6D11", successBg: "#EAF3DE",
  warning: "#854F0B", warningBg: "#FAEEDA",
  danger: "#A32D2D", dangerBg: "#FCEBEB",
  info: "#185FA5", infoBg: "#E6F1FB",
};

function QRCode({ mesa, id }) {
  const canvasRef = useRef(null);
  const url = `https://cafeteria-app-plum.vercel.app/?mesa=${encodeURIComponent(mesa)}`;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gen = () => {
      canvas.innerHTML = "";
      new window.QRCode(canvas, { text: url, width: 160, height: 160, colorDark: "#1a1a1a", colorLight: "#ffffff", correctLevel: window.QRCode.CorrectLevel.H });
    };
    if (!window.QRCode) {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
      s.onload = gen;
      document.head.appendChild(s);
    } else gen();
  }, [mesa]);
  return <div id={id} ref={canvasRef} style={{ width: 160, height: 160 }} />;
}

export default function CafeteriaApp() {
  const [vista, setVista] = useState("menu");
  const [menu, setMenu] = useState(initialMenu);
  const [pedidos, setPedidos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState("Mesa 1");
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [pedidoEnviado, setPedidoEnviado] = useState(false);
  const [miPedidoId, setMiPedidoId] = useState(null);
  const [panelTab, setPanelTab] = useState("pedidos");
  const [editando, setEditando] = useState(null);
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: "", precio: "", categoria: "Cafés", descripcion: "", emoji: "☕" });
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [mostrandoQR, setMostrandoQR] = useState(false);
  const [mesaQR, setMesaQR] = useState("Mesa 1");
  const [adminPass, setAdminPass] = useState(DEFAULT_PASSWORD);
  const [adminLogueado, setAdminLogueado] = useState(false);
  const [inputPass, setInputPass] = useState("");
  const [errorPass, setErrorPass] = useState(false);
  const [cambiandoPass, setCambiandoPass] = useState(false);
  const [nuevaPass, setNuevaPass] = useState({ actual: "", nueva: "", confirmar: "" });
  const [mesaFiltro, setMesaFiltro] = useState("Todas");

  const categorias = ["Todos", ...new Set(menu.map(p => p.categoria))];
  const menuFiltrado = categoriaActiva === "Todos" ? menu.filter(p => p.disponible) : menu.filter(p => p.categoria === categoriaActiva && p.disponible);
  const totalCarrito = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);

  const agregarAlCarrito = (producto) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.id === producto.id);
      if (existe) return prev.map(i => i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  const quitarDelCarrito = (id) => {
    setCarrito(prev => {
      const item = prev.find(i => i.id === id);
      if (item.cantidad === 1) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, cantidad: i.cantidad - 1 } : i);
    });
  };

  const enviarPedido = () => {
    if (carrito.length === 0) return;
    const id = Date.now();
    const nuevo = { id, mesa: mesaSeleccionada, items: [...carrito], total: totalCarrito, estado: "pendiente", hora: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) };
    setPedidos(prev => [nuevo, ...prev]);
    setCarrito([]);
    setMiPedidoId(id);
    setPedidoEnviado(true);
  };

  const cambiarEstado = (id, estado) => setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado } : p));
  const toggleDisponible = (id) => setMenu(prev => prev.map(p => p.id === id ? { ...p, disponible: !p.disponible } : p));
  const eliminarProducto = (id) => setMenu(prev => prev.filter(p => p.id !== id));

  const guardarProducto = () => {
    if (!nuevoProducto.nombre || !nuevoProducto.precio) return;
    if (editando) {
      setMenu(prev => prev.map(p => p.id === editando ? { ...p, ...nuevoProducto, precio: parseInt(nuevoProducto.precio) } : p));
      setEditando(null);
    } else {
      setMenu(prev => [...prev, { ...nuevoProducto, id: Date.now(), precio: parseInt(nuevoProducto.precio), disponible: true }]);
    }
    setNuevoProducto({ nombre: "", precio: "", categoria: "Cafés", descripcion: "", emoji: "☕" });
    setMostrandoFormulario(false);
  };

  const iniciarEdicion = (p) => {
    setEditando(p.id);
    setNuevoProducto({ nombre: p.nombre, precio: p.precio, categoria: p.categoria, descripcion: p.descripcion, emoji: p.emoji });
    setMostrandoFormulario(true);
  };

  const loginAdmin = () => {
    if (inputPass === adminPass) { setAdminLogueado(true); setErrorPass(false); setInputPass(""); }
    else { setErrorPass(true); }
  };

  const cambiarContrasena = () => {
    if (nuevaPass.actual !== adminPass) { alert("Contraseña actual incorrecta"); return; }
    if (nuevaPass.nueva !== nuevaPass.confirmar) { alert("Las contraseñas nuevas no coinciden"); return; }
    if (nuevaPass.nueva.length < 4) { alert("La contraseña debe tener al menos 4 caracteres"); return; }
    setAdminPass(nuevaPass.nueva);
    setNuevaPass({ actual: "", nueva: "", confirmar: "" });
    setCambiandoPass(false);
    alert("✅ Contraseña cambiada con éxito");
  };

  const miPedido = pedidos.find(p => p.id === miPedidoId);

  const pedidosFiltrados = mesaFiltro === "Todas" ? pedidos : pedidos.filter(p => p.mesa === mesaFiltro);
  const pedidosActivosPorMesa = MESAS.reduce((acc, m) => {
    acc[m] = pedidos.filter(p => p.mesa === m && p.estado !== "listo").length;
    return acc;
  }, {});

  const estadoBadge = (estado) => {
    const e = { pendiente: { bg: colors.warningBg, color: colors.warning, texto: "⏳ Pendiente" }, preparando: { bg: colors.infoBg, color: colors.info, texto: "🔄 Preparando" }, listo: { bg: colors.successBg, color: colors.success, texto: "✅ Listo" } }[estado];
    return <span style={{ background: e.bg, color: e.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{e.texto}</span>;
  };

  const s = {
    app: { minHeight: "100vh", background: colors.bg, fontFamily: "sans-serif", color: colors.primary },
    header: { background: colors.primary, color: "#fff", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    card: { background: colors.card, borderRadius: 12, border: `1px solid ${colors.border}`, padding: "14px 16px", marginBottom: 12 },
    btn: (v = "primary") => ({ padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 500, fontSize: 14, background: v === "primary" ? colors.accent : v === "danger" ? colors.dangerBg : v === "success" ? colors.successBg : colors.light, color: v === "primary" ? "#fff" : v === "danger" ? colors.danger : v === "success" ? colors.success : colors.primary }),
    input: { width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 14, boxSizing: "border-box", background: "#fff" },
    section: { maxWidth: 680, margin: "0 auto", padding: "16px 16px 80px" },
    tabBtn: (active) => ({ padding: "7px 18px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 500, fontSize: 13, background: active ? "#fff" : "transparent", color: active ? colors.primary : "#fff" }),
  };

  return (
    <div style={s.app}>
      <div style={s.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>☕</span>
          <span style={{ fontWeight: 600, fontSize: 16 }}>Café Del Centro</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={s.tabBtn(vista === "menu")} onClick={() => { setVista("menu"); setPedidoEnviado(false); }}>Menú</button>
          {miPedido && <button style={s.tabBtn(vista === "seguimiento")} onClick={() => setVista("seguimiento")}>Mi pedido</button>}
          <button style={s.tabBtn(vista === "admin")} onClick={() => setVista("admin")}>
            Admin {pedidos.filter(p => p.estado === "pendiente").length > 0 && <span style={{ background: "#E24B4A", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, marginLeft: 5 }}>{pedidos.filter(p => p.estado === "pendiente").length}</span>}
          </button>
        </div>
      </div>

      {/* VISTA MENÚ */}
      {vista === "menu" && (
        <div style={s.section}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: colors.muted, display: "block", marginBottom: 6 }}>Mesa</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {MESAS.map(m => <button key={m} onClick={() => setMesaSeleccionada(m)} style={{ ...s.btn(m === mesaSeleccionada ? "primary" : "sec"), padding: "6px 14px", fontSize: 13 }}>{m}</button>)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {categorias.map(c => <button key={c} onClick={() => setCategoriaActiva(c)} style={{ ...s.btn(c === categoriaActiva ? "primary" : "sec"), padding: "6px 14px", fontSize: 13 }}>{c}</button>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {menuFiltrado.map(p => {
              const enCarrito = carrito.find(i => i.id === p.id);
              return (
                <div key={p.id} style={{ ...s.card, marginBottom: 0 }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{p.emoji}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{p.nombre}</div>
                  <div style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>{p.descripcion}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, color: colors.accent }}>${p.precio.toLocaleString()}</span>
                    {enCarrito ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button onClick={() => quitarDelCarrito(p.id)} style={{ width: 26, height: 26, borderRadius: "50%", border: `1px solid ${colors.border}`, background: colors.light, cursor: "pointer", fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary }}>−</button>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{enCarrito.cantidad}</span>
                        <button onClick={() => agregarAlCarrito(p)} style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: colors.accent, cursor: "pointer", fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>+</button>
                      </div>
                    ) : (
                      <button onClick={() => agregarAlCarrito(p)} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: colors.accent, cursor: "pointer", fontSize: 18, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {carrito.length > 0 && (
            <div style={{ position: "sticky", bottom: 16, background: colors.card, borderRadius: 14, border: `1px solid ${colors.border}`, padding: "14px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 15 }}>🛒 Tu pedido — {mesaSeleccionada}</div>
              {carrito.map(i => <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4, color: colors.muted }}><span>{i.emoji} {i.nombre} x{i.cantidad}</span><span>${(i.precio * i.cantidad).toLocaleString()}</span></div>)}
              <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Total: ${totalCarrito.toLocaleString()}</span>
                <button style={s.btn("primary")} onClick={enviarPedido}>Enviar pedido</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VISTA SEGUIMIENTO */}
      {vista === "seguimiento" && miPedido && (
        <div style={s.section}>
          <div style={s.card}>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>📋 Tu pedido — {miPedido.mesa}</div>
            <div style={{ fontSize: 13, color: colors.muted, marginBottom: 16 }}>Pedido a las {miPedido.hora}</div>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              {["pendiente", "preparando", "listo"].map((e, i) => {
                const estados = ["pendiente", "preparando", "listo"];
                const actual = estados.indexOf(miPedido.estado);
                const activo = i <= actual;
                const labels = { pendiente: "Recibido", preparando: "Preparando", listo: "¡Listo!" };
                const emojis = { pendiente: "📥", preparando: "👨‍🍳", listo: "✅" };
                return (
                  <div key={e} style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: activo ? colors.accent : colors.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, margin: "0 auto 6px" }}>{emojis[e]}</div>
                      <div style={{ fontSize: 11, fontWeight: activo ? 600 : 400, color: activo ? colors.primary : colors.muted }}>{labels[e]}</div>
                    </div>
                    {i < 2 && <div style={{ width: 40, height: 3, background: actual > i ? colors.accent : colors.light, margin: "0 4px 20px" }} />}
                  </div>
                );
              })}
            </div>

            <div style={{ background: colors.light, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
              {miPedido.items.map((item, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span>{item.emoji} {item.nombre} x{item.cantidad}</span><span>${(item.precio * item.cantidad).toLocaleString()}</span></div>)}
              <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: 8, paddingTop: 8, fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
                <span>Total</span><span>${miPedido.total.toLocaleString()}</span>
              </div>
            </div>

            {miPedido.estado === "listo" && (
              <div style={{ background: colors.successBg, color: colors.success, borderRadius: 10, padding: "12px 16px", textAlign: "center", fontWeight: 600, fontSize: 15 }}>
                🎉 ¡Tu pedido está listo! Ya podés retirarlo.
              </div>
            )}

            <button style={{ ...s.btn("sec"), width: "100%", marginTop: 12 }} onClick={() => { setVista("menu"); setPedidoEnviado(false); setMiPedidoId(null); }}>
              Hacer otro pedido
            </button>
          </div>
        </div>
      )}

      {/* VISTA ADMIN - LOGIN */}
      {vista === "admin" && !adminLogueado && (
        <div style={s.section}>
          <div style={{ ...s.card, maxWidth: 340, margin: "40px auto" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 40 }}>🔒</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginTop: 8 }}>Panel Administrador</div>
              <div style={{ fontSize: 13, color: colors.muted }}>Ingresá tu contraseña</div>
            </div>
            <input style={{ ...s.input, marginBottom: 8, textAlign: "center", letterSpacing: 4 }} type="password" placeholder="Contraseña" value={inputPass} onChange={e => setInputPass(e.target.value)} onKeyDown={e => e.key === "Enter" && loginAdmin()} />
            {errorPass && <div style={{ color: colors.danger, fontSize: 13, textAlign: "center", marginBottom: 8 }}>Contraseña incorrecta</div>}
            <button style={{ ...s.btn("primary"), width: "100%" }} onClick={loginAdmin}>Ingresar</button>
          </div>
        </div>
      )}

      {/* VISTA ADMIN - PANEL */}
      {vista === "admin" && adminLogueado && (
        <div style={s.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {["pedidos", "menu", "qr"].map(t => (
                <button key={t} onClick={() => setPanelTab(t)} style={{ padding: "8px 16px", borderRadius: 8, background: panelTab === t ? colors.primary : colors.light, color: panelTab === t ? "#fff" : colors.primary, fontWeight: 500, fontSize: 13, border: "none", cursor: "pointer" }}>
                  {t === "pedidos" ? "Pedidos" : t === "menu" ? "Menú" : "QR"}
                </button>
              ))}
            </div>
            <button style={{ ...s.btn("sec"), padding: "6px 12px", fontSize: 12 }} onClick={() => { setAdminLogueado(false); }}>Salir</button>
          </div>

          {/* PEDIDOS POR MESA */}
          {panelTab === "pedidos" && (
            <div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                <button onClick={() => setMesaFiltro("Todas")} style={{ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", background: mesaFiltro === "Todas" ? colors.accent : colors.light, color: mesaFiltro === "Todas" ? "#fff" : colors.primary, fontWeight: 500, fontSize: 13 }}>Todas</button>
                {MESAS.map(m => (
                  <button key={m} onClick={() => setMesaFiltro(m)} style={{ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", background: mesaFiltro === m ? colors.accent : colors.light, color: mesaFiltro === m ? "#fff" : colors.primary, fontWeight: 500, fontSize: 13, position: "relative" }}>
                    {m} {pedidosActivosPorMesa[m] > 0 && <span style={{ background: "#E24B4A", color: "#fff", borderRadius: "50%", width: 16, height: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, marginLeft: 4 }}>{pedidosActivosPorMesa[m]}</span>}
                  </button>
                ))}
              </div>

              {pedidosFiltrados.length === 0 && (
                <div style={{ textAlign: "center", color: colors.muted, padding: "40px 0", fontSize: 15 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  No hay pedidos {mesaFiltro !== "Todas" ? `para ${mesaFiltro}` : ""}.
                </div>
              )}

              {MESAS.filter(m => mesaFiltro === "Todas" || m === mesaFiltro).map(mesa => {
                const pedidosMesa = pedidosFiltrados.filter(p => p.mesa === mesa);
                if (pedidosMesa.length === 0) return null;
                return (
                  <div key={mesa}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: colors.accent, marginBottom: 8, marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                      🪑 {mesa}
                      <span style={{ fontSize: 12, fontWeight: 400, color: colors.muted }}>{pedidosMesa.length} pedido{pedidosMesa.length > 1 ? "s" : ""}</span>
                    </div>
                    {pedidosMesa.map(p => (
                      <div key={p.id} style={s.card}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <span style={{ fontSize: 13, color: colors.muted }}>🕐 {p.hora}</span>
                          {estadoBadge(p.estado)}
                        </div>
                        {p.items.map((item, i) => <div key={i} style={{ fontSize: 13, color: colors.muted, marginBottom: 3 }}>{item.emoji} {item.nombre} x{item.cantidad} — ${(item.precio * item.cantidad).toLocaleString()}</div>)}
                        <div style={{ fontWeight: 700, marginTop: 8, marginBottom: 12, fontSize: 15 }}>Total: ${p.total.toLocaleString()}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          {p.estado === "pendiente" && <button style={s.btn("primary")} onClick={() => cambiarEstado(p.id, "preparando")}>Iniciar preparación</button>}
                          {p.estado === "preparando" && <button style={s.btn("success")} onClick={() => cambiarEstado(p.id, "listo")}>Marcar como listo</button>}
                          {p.estado === "listo" && <button style={s.btn("danger")} onClick={() => setPedidos(prev => prev.filter(x => x.id !== p.id))}>Cerrar pedido</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}

              <div style={{ ...s.card, marginTop: 20, background: colors.light }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>🔑 {cambiandoPass ? "Cambiar contraseña" : "Seguridad"}</div>
                {!cambiandoPass ? (
                  <button style={s.btn("sec")} onClick={() => setCambiandoPass(true)}>Cambiar contraseña</button>
                ) : (
                  <div>
                    <input style={{ ...s.input, marginBottom: 8 }} type="password" placeholder="Contraseña actual" value={nuevaPass.actual} onChange={e => setNuevaPass(p => ({ ...p, actual: e.target.value }))} />
                    <input style={{ ...s.input, marginBottom: 8 }} type="password" placeholder="Nueva contraseña" value={nuevaPass.nueva} onChange={e => setNuevaPass(p => ({ ...p, nueva: e.target.value }))} />
                    <input style={{ ...s.input, marginBottom: 12 }} type="password" placeholder="Confirmar nueva contraseña" value={nuevaPass.confirmar} onChange={e => setNuevaPass(p => ({ ...p, confirmar: e.target.value }))} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={s.btn("primary")} onClick={cambiarContrasena}>Guardar</button>
                      <button style={s.btn("sec")} onClick={() => { setCambiandoPass(false); setNuevaPass({ actual: "", nueva: "", confirmar: "" }); }}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GESTIÓN MENÚ */}
          {panelTab === "menu" && (
            <div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                <button style={s.btn("primary")} onClick={() => { setMostrandoFormulario(!mostrandoFormulario); setEditando(null); setNuevoProducto({ nombre: "", precio: "", categoria: "Cafés", descripcion: "", emoji: "☕" }); }}>
                  {mostrandoFormulario ? "Cancelar" : "+ Nuevo producto"}
                </button>
              </div>
              {mostrandoFormulario && (
                <div style={{ ...s.card, background: colors.light, marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 12 }}>{editando ? "Editar producto" : "Nuevo producto"}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div><label style={{ fontSize: 12, color: colors.muted, display: "block", marginBottom: 4 }}>Nombre</label><input style={s.input} value={nuevoProducto.nombre} onChange={e => setNuevoProducto(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Café con leche" /></div>
                    <div><label style={{ fontSize: 12, color: colors.muted, display: "block", marginBottom: 4 }}>Precio ($)</label><input style={s.input} type="number" value={nuevoProducto.precio} onChange={e => setNuevoProducto(p => ({ ...p, precio: e.target.value }))} placeholder="Ej: 2000" /></div>
                    <div><label style={{ fontSize: 12, color: colors.muted, display: "block", marginBottom: 4 }}>Categoría</label><select style={s.input} value={nuevoProducto.categoria} onChange={e => setNuevoProducto(p => ({ ...p, categoria: e.target.value }))}>{["Cafés", "Bebidas", "Comidas", "Dulces"].map(c => <option key={c}>{c}</option>)}</select></div>
                    <div><label style={{ fontSize: 12, color: colors.muted, display: "block", marginBottom: 4 }}>Emoji</label><input style={s.input} value={nuevoProducto.emoji} onChange={e => setNuevoProducto(p => ({ ...p, emoji: e.target.value }))} placeholder="☕" /></div>
                    <div style={{ gridColumn: "1 / -1" }}><label style={{ fontSize: 12, color: colors.muted, display: "block", marginBottom: 4 }}>Descripción</label><input style={s.input} value={nuevoProducto.descripcion} onChange={e => setNuevoProducto(p => ({ ...p, descripcion: e.target.value }))} placeholder="Breve descripción" /></div>
                  </div>
                  <button style={s.btn("primary")} onClick={guardarProducto}>{editando ? "Guardar cambios" : "Agregar al menú"}</button>
                </div>
              )}
              {["Cafés", "Bebidas", "Comidas", "Dulces"].map(cat => (
                <div key={cat}>
                  <div style={{ fontWeight: 600, color: colors.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginTop: 4 }}>{cat}</div>
                  {menu.filter(p => p.categoria === cat).map(p => (
                    <div key={p.id} style={{ ...s.card, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: p.disponible ? 1 : 0.5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 24 }}>{p.emoji}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{p.nombre}</div>
                          <div style={{ fontSize: 12, color: colors.muted }}>${p.precio.toLocaleString()} — {p.descripcion}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => toggleDisponible(p.id)} style={{ ...s.btn(p.disponible ? "sec" : "danger"), padding: "5px 10px", fontSize: 12 }}>{p.disponible ? "Ocultar" : "Mostrar"}</button>
                        <button onClick={() => iniciarEdicion(p)} style={{ ...s.btn("sec"), padding: "5px 10px", fontSize: 12 }}>Editar</button>
                        <button onClick={() => eliminarProducto(p.id)} style={{ ...s.btn("danger"), padding: "5px 10px", fontSize: 12 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* QR */}
          {panelTab === "qr" && (
            <div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {MESAS.map(m => <button key={m} onClick={() => setMesaQR(m)} style={{ ...s.btn(m === mesaQR ? "primary" : "sec"), padding: "6px 14px", fontSize: 13 }}>{m}</button>)}
              </div>
              <div style={{ ...s.card, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "24px" }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>☕ Café Del Centro</div>
                <div style={{ border: `4px solid ${colors.primary}`, borderRadius: 12, padding: 12, background: "#fff" }}>
                  <QRCode mesa={mesaQR} id="qr-canvas" />
                </div>
                <div style={{ fontWeight: 600, fontSize: 16, color: colors.accent }}>{mesaQR}</div>
                <div style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>Escaneá para ver el menú y hacer tu pedido</div>
                <button style={s.btn("primary")} onClick={() => {
                  const el = document.getElementById("qr-canvas");
                  const img = el?.querySelector("img");
                  if (img) { const a = document.createElement("a"); a.download = `QR-${mesaQR.replace(" ", "-")}.png`; a.href = img.src; a.click(); }
                }}>⬇ Descargar QR</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}