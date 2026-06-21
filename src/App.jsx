import { useState, useEffect } from "react";

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

function QRCode({ mesa, id }) {
  const size = 160;
  const data = `Mesa: ${mesa} - Café Del Centro`;
  // QR simplificado visual usando módulos SVG
  const seed = mesa.charCodeAt(mesa.length - 1) + mesa.length;
  const modules = 21;
  const mod = size / modules;
  
  const fixed = [];
  // Esquinas fijas (finder patterns)
  for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
    const border = r===0||r===6||c===0||c===6;
    const inner = r>=2&&r<=4&&c>=2&&c<=4;
    if (border || inner) {
      fixed.push([r,c]);
      fixed.push([r, modules-1-c]);
      fixed.push([modules-1-r, c]);
    }
  }
  const fixedSet = new Set(fixed.map(([r,c])=>`${r},${c}`));
  
  const cells = [];
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      const key = `${r},${c}`;
      let on = false;
      if (fixedSet.has(key)) {
        on = true;
      } else {
        const h = ((r * 31 + c * 17 + seed * 7) ^ (r * c + seed)) % 100;
        on = h < 45;
      }
      if (on) cells.push({ r, c });
    }
  }
  
  return (
    <svg id={id} width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <rect width={size} height={size} fill="white" />
      {cells.map(({ r, c }) => (
        <rect key={`${r},${c}`} x={c * mod} y={r * mod} width={mod} height={mod} fill="#1a1a1a" />
      ))}
    </svg>
  );
}

const colors = {
  bg: "#FDF6EE",
  card: "#FFFFFF",
  primary: "#6B3A2A",
  accent: "#C8813A",
  light: "#F5E6D3",
  muted: "#9A7B6B",
  border: "#E8D5C0",
  success: "#3B6D11",
  successBg: "#EAF3DE",
  warning: "#854F0B",
  warningBg: "#FAEEDA",
  danger: "#A32D2D",
  dangerBg: "#FCEBEB",
};

export default function CafeteriaApp() {
  const [vista, setVista] = useState("menu"); // menu | panel
  const [menu, setMenu] = useState(initialMenu);
  const [pedidos, setPedidos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState("Mesa 1");
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [pedidoEnviado, setPedidoEnviado] = useState(false);
  const [panelTab, setPanelTab] = useState("pedidos"); // pedidos | menu
  const [editando, setEditando] = useState(null);
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: "", precio: "", categoria: "Cafés", descripcion: "", emoji: "☕" });
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [mostrandoQR, setMostrandoQR] = useState(false);
  const [mesaQR, setMesaQR] = useState("Mesa 1");

  const categorias = ["Todos", ...new Set(menu.map(p => p.categoria))];

  const menuFiltrado = categoriaActiva === "Todos"
    ? menu.filter(p => p.disponible)
    : menu.filter(p => p.categoria === categoriaActiva && p.disponible);

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

  const totalCarrito = carrito.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const cantidadCarrito = carrito.reduce((s, i) => s + i.cantidad, 0);

  const enviarPedido = () => {
    if (carrito.length === 0) return;
    const nuevoPedido = {
      id: Date.now(),
      mesa: mesaSeleccionada,
      items: [...carrito],
      total: totalCarrito,
      estado: "pendiente",
      hora: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
    };
    setPedidos(prev => [nuevoPedido, ...prev]);
    setCarrito([]);
    setPedidoEnviado(true);
    setTimeout(() => setPedidoEnviado(false), 3000);
  };

  const cambiarEstado = (id, estado) => {
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado } : p));
  };

  const toggleDisponible = (id) => {
    setMenu(prev => prev.map(p => p.id === id ? { ...p, disponible: !p.disponible } : p));
  };

  const eliminarProducto = (id) => {
    setMenu(prev => prev.filter(p => p.id !== id));
  };

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

  const estadoBadge = (estado) => {
    const estilos = {
      pendiente: { bg: colors.warningBg, color: colors.warning, texto: "⏳ Pendiente" },
      preparando: { bg: "#E6F1FB", color: "#185FA5", texto: "🔄 Preparando" },
      listo: { bg: colors.successBg, color: colors.success, texto: "✅ Listo" },
    };
    const e = estilos[estado];
    return <span style={{ background: e.bg, color: e.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{e.texto}</span>;
  };

  const s = {
    app: { minHeight: "100vh", background: colors.bg, fontFamily: "sans-serif", color: colors.primary },
    header: { background: colors.primary, color: "#fff", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    tabBtn: (active) => ({ padding: "7px 18px", borderRadius: 20, border: "none", cursor: "pointer", fontWeight: 500, fontSize: 13, background: active ? "#fff" : "transparent", color: active ? colors.primary : "#fff" }),
    card: { background: colors.card, borderRadius: 12, border: `1px solid ${colors.border}`, padding: "14px 16px", marginBottom: 12 },
    btn: (variant = "primary") => ({
      padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 500, fontSize: 14,
      background: variant === "primary" ? colors.accent : variant === "danger" ? colors.dangerBg : colors.light,
      color: variant === "primary" ? "#fff" : variant === "danger" ? colors.danger : colors.primary,
    }),
    input: { width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 14, boxSizing: "border-box", background: "#fff" },
    section: { maxWidth: 680, margin: "0 auto", padding: "16px 16px 80px" },
  };

  return (
    <div style={s.app}>
      <div style={s.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>☕</span>
          <span style={{ fontWeight: 600, fontSize: 16 }}>Café Del Centro</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={s.tabBtn(vista === "menu")} onClick={() => setVista("menu")}>Menú QR</button>
          <button style={s.tabBtn(vista === "panel")} onClick={() => setVista("panel")}>
            Panel {pedidos.filter(p => p.estado === "pendiente").length > 0 && <span style={{ background: "#E24B4A", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, marginLeft: 5 }}>{pedidos.filter(p => p.estado === "pendiente").length}</span>}
          </button>
        </div>
      </div>

      {vista === "menu" && (
        <div style={s.section}>
          {pedidoEnviado && (
            <div style={{ background: colors.successBg, color: colors.success, border: `1px solid #C0DD97`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, textAlign: "center", fontWeight: 500 }}>
              ✅ ¡Pedido enviado a la barra!
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: colors.muted, display: "block", marginBottom: 6 }}>Mesa</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {MESAS.map(m => (
                <button key={m} onClick={() => setMesaSeleccionada(m)}
                  style={{ ...s.btn(m === mesaSeleccionada ? "primary" : "sec"), padding: "6px 14px", fontSize: 13 }}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {categorias.map(c => (
              <button key={c} onClick={() => setCategoriaActiva(c)}
                style={{ ...s.btn(c === categoriaActiva ? "primary" : "sec"), padding: "6px 14px", fontSize: 13 }}>
                {c}
              </button>
            ))}
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
              {carrito.map(i => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4, color: colors.muted }}>
                  <span>{i.emoji} {i.nombre} x{i.cantidad}</span>
                  <span>${(i.precio * i.cantidad).toLocaleString()}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${colors.border}`, marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Total: ${totalCarrito.toLocaleString()}</span>
                <button style={s.btn("primary")} onClick={enviarPedido}>Enviar pedido</button>
              </div>
            </div>
          )}
        </div>
      )}

      {vista === "panel" && (
        <div style={s.section}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button style={s.tabBtn(panelTab === "pedidos")} onClick={() => setPanelTab("pedidos")}
              className="panel-tab" data-active={panelTab === "pedidos"}>
              <span style={{ padding: "8px 16px", borderRadius: 8, background: panelTab === "pedidos" ? colors.primary : colors.light, color: panelTab === "pedidos" ? "#fff" : colors.primary, fontWeight: 500, fontSize: 13, cursor: "pointer", display: "inline-block" }}>
                Pedidos {pedidos.filter(p => p.estado !== "listo").length > 0 && `(${pedidos.filter(p => p.estado !== "listo").length})`}
              </span>
            </button>
            <button style={{ background: "none", border: "none", cursor: "pointer" }} onClick={() => setPanelTab("menu")}>
              <span style={{ padding: "8px 16px", borderRadius: 8, background: panelTab === "menu" ? colors.primary : colors.light, color: panelTab === "menu" ? "#fff" : colors.primary, fontWeight: 500, fontSize: 13, display: "inline-block" }}>
                Gestión del menú
              </span>
            </button>
          </div>

          {panelTab === "pedidos" && !mostrandoQR && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ ...s.card, background: colors.light, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Códigos QR por mesa</div>
                  <div style={{ fontSize: 12, color: colors.muted }}>Mostrá o imprimí el QR para cada mesa</div>
                </div>
                <button style={s.btn("primary")} onClick={() => setMostrandoQR(true)}>Ver QRs</button>
              </div>
            </div>
          )}

          {mostrandoQR && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>Códigos QR por mesa</span>
                <button style={s.btn("sec")} onClick={() => setMostrandoQR(false)}>Cerrar</button>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {MESAS.map(m => (
                  <button key={m} onClick={() => setMesaQR(m)}
                    style={{ ...s.btn(m === mesaQR ? "primary" : "sec"), padding: "6px 14px", fontSize: 13 }}>
                    {m}
                  </button>
                ))}
              </div>
              <div style={{ ...s.card, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "24px" }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>☕ Café Del Centro</div>
                <div style={{ border: `4px solid ${colors.primary}`, borderRadius: 12, padding: 12, background: "#fff" }}>
                  <QRCode mesa={mesaQR} id="qr-svg-export" />
                </div>
                <div style={{ fontWeight: 600, fontSize: 16, color: colors.accent }}>{mesaQR}</div>
                <div style={{ fontSize: 13, color: colors.muted, textAlign: "center" }}>Escaneá para ver el menú y hacer tu pedido</div>
                <button style={s.btn("primary")} onClick={() => {
                  const svg = document.getElementById("qr-svg-export");
                  const svgData = new XMLSerializer().serializeToString(svg);
                  const canvas = document.createElement("canvas");
                  canvas.width = 400; canvas.height = 520;
                  const ctx = canvas.getContext("2d");
                  ctx.fillStyle = "#FDF6EE";
                  ctx.fillRect(0, 0, 400, 520);
                  ctx.fillStyle = "#6B3A2A";
                  ctx.font = "bold 22px sans-serif";
                  ctx.textAlign = "center";
                  ctx.fillText("☕ Café Del Centro", 200, 44);
                  const img = new Image();
                  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  img.onload = () => {
                    ctx.drawImage(img, 100, 60, 200, 200);
                    ctx.fillStyle = "#C8813A";
                    ctx.font = "bold 20px sans-serif";
                    ctx.fillText(mesaQR, 200, 290);
                    ctx.fillStyle = "#9A7B6B";
                    ctx.font = "14px sans-serif";
                    ctx.fillText("Escaneá para ver el menú y pedir", 200, 316);
                    URL.revokeObjectURL(url);
                    const a = document.createElement("a");
                    a.download = `QR-${mesaQR.replace(" ", "-")}.png`;
                    a.href = canvas.toDataURL("image/png");
                    a.click();
                  };
                  img.src = url;
                }}>
                  ⬇ Descargar QR
                </button>
              </div>
            </div>
          )}

          {panelTab === "pedidos" && (
            <div>
              {pedidos.length === 0 && (
                <div style={{ textAlign: "center", color: colors.muted, padding: "40px 0", fontSize: 15 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  Aún no hay pedidos. Cuando los clientes escaneen el QR, aparecerán acá.
                </div>
              )}
              {pedidos.map(p => (
                <div key={p.id} style={s.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{p.mesa}</span>
                      <span style={{ color: colors.muted, fontSize: 12, marginLeft: 8 }}>{p.hora}</span>
                    </div>
                    {estadoBadge(p.estado)}
                  </div>
                  {p.items.map((item, i) => (
                    <div key={i} style={{ fontSize: 13, color: colors.muted, marginBottom: 3 }}>
                      {item.emoji} {item.nombre} x{item.cantidad} — ${(item.precio * item.cantidad).toLocaleString()}
                    </div>
                  ))}
                  <div style={{ fontWeight: 700, marginTop: 8, marginBottom: 12, fontSize: 15 }}>Total: ${p.total.toLocaleString()}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {p.estado === "pendiente" && (
                      <button style={s.btn("primary")} onClick={() => cambiarEstado(p.id, "preparando")}>Iniciar preparación</button>
                    )}
                    {p.estado === "preparando" && (
                      <button style={{ ...s.btn(), background: colors.successBg, color: colors.success }} onClick={() => cambiarEstado(p.id, "listo")}>Marcar como listo</button>
                    )}
                    {p.estado === "listo" && (
                      <button style={s.btn("danger")} onClick={() => setPedidos(prev => prev.filter(x => x.id !== p.id))}>Cerrar pedido</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

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
                    <div>
                      <label style={{ fontSize: 12, color: colors.muted, display: "block", marginBottom: 4 }}>Nombre</label>
                      <input style={s.input} value={nuevoProducto.nombre} onChange={e => setNuevoProducto(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Café con leche" />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: colors.muted, display: "block", marginBottom: 4 }}>Precio ($)</label>
                      <input style={s.input} type="number" value={nuevoProducto.precio} onChange={e => setNuevoProducto(p => ({ ...p, precio: e.target.value }))} placeholder="Ej: 2000" />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: colors.muted, display: "block", marginBottom: 4 }}>Categoría</label>
                      <select style={s.input} value={nuevoProducto.categoria} onChange={e => setNuevoProducto(p => ({ ...p, categoria: e.target.value }))}>
                        {["Cafés", "Bebidas", "Comidas", "Dulces"].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: colors.muted, display: "block", marginBottom: 4 }}>Emoji</label>
                      <input style={s.input} value={nuevoProducto.emoji} onChange={e => setNuevoProducto(p => ({ ...p, emoji: e.target.value }))} placeholder="☕" />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ fontSize: 12, color: colors.muted, display: "block", marginBottom: 4 }}>Descripción</label>
                      <input style={s.input} value={nuevoProducto.descripcion} onChange={e => setNuevoProducto(p => ({ ...p, descripcion: e.target.value }))} placeholder="Breve descripción del producto" />
                    </div>
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
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <button title={p.disponible ? "Deshabilitar" : "Habilitar"} onClick={() => toggleDisponible(p.id)}
                          style={{ ...s.btn(p.disponible ? "sec" : "danger"), padding: "5px 10px", fontSize: 12 }}>
                          {p.disponible ? "Ocultar" : "Mostrar"}
                        </button>
                        <button onClick={() => iniciarEdicion(p)} style={{ ...s.btn("sec"), padding: "5px 10px", fontSize: 12 }}>Editar</button>
                        <button onClick={() => eliminarProducto(p.id)} style={{ ...s.btn("danger"), padding: "5px 10px", fontSize: 12 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}