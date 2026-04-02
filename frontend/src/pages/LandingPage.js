import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Search } from "lucide-react";

/* ─── Scattered confetti dots ─────────────────────────── */
const dots = [
  { top:"12%", left:"8%",  size:10, color:"#4CAF50", shape:"square", rot:22  },
  { top:"22%", left:"18%", size:7,  color:"#FF6B35", shape:"circle", rot:0   },
  { top:"8%",  left:"35%", size:8,  color:"#4CAF50", shape:"square", rot:45  },
  { top:"18%", left:"55%", size:6,  color:"white",   shape:"circle", rot:0   },
  { top:"10%", right:"35%",size:9,  color:"#4CAF50", shape:"square", rot:30  },
  { top:"25%", right:"18%",size:7,  color:"#FFD700", shape:"circle", rot:0   },
  { top:"42%", right:"8%", size:8,  color:"#4CAF50", shape:"leaf",   rot:15  },
  { top:"65%", right:"14%",size:10, color:"#FF6B35", shape:"square", rot:60  },
  { top:"72%", left:"22%", size:8,  color:"#4CAF50", shape:"circle", rot:0   },
  { top:"60%", left:"10%", size:7,  color:"white",   shape:"square", rot:40  },
  { top:"50%", left:"32%", size:6,  color:"#FFD700", shape:"circle", rot:0   },
  { top:"55%", right:"33%",size:7,  color:"#4CAF50", shape:"leaf",   rot:-20 },
  { top:"80%", left:"42%", size:8,  color:"#FF6B35", shape:"circle", rot:0   },
  { top:"78%", right:"40%",size:6,  color:"white",   shape:"square", rot:55  },
];

const Dot = ({ top, left, right, size, color, shape, rot }) => {
  const base = {
    position:"absolute", top, left, right,
    width:size, height:size,
    background:color, opacity:0.55,
    transform:`rotate(${rot}deg)`,
    pointerEvents:"none",
  };
  if (shape === "circle") return <div style={{ ...base, borderRadius:"50%" }} />;
  if (shape === "leaf")   return <div style={{ ...base, borderRadius:"0 50% 50% 50%", transform:`rotate(${rot}deg)` }} />;
  return <div style={{ ...base, borderRadius:2 }} />;
};

/* ─── Corner food plate ───────────────────────────────── */
const CornerFood = ({ emoji, style, size = 200, rotate = 0, animate: anim }) => (
  <motion.div
    animate={anim || { y:[0,-10,0] }}
    transition={{ duration:3.5, repeat:Infinity, ease:"easeInOut", delay: Math.random()*1.5 }}
    style={{
      position:"absolute",
      ...style,
      fontSize: size,
      lineHeight:1,
      transform:`rotate(${rotate}deg)`,
      filter:"drop-shadow(0 24px 40px rgba(0,0,0,0.18))",
      pointerEvents:"none",
      userSelect:"none",
      zIndex:2,
    }}
  >
    {emoji}
  </motion.div>
);

/* ─── Main ─────────────────────────────────────────────── */
const LandingPage = () => {
  const [address, setAddress] = useState("");
  const navigate = useNavigate();

  const handleFind = (e) => {
    e.preventDefault();
    navigate("/restaurants");
  };

  return (
    <div style={{ minHeight:"100vh", background:"#F9A825", position:"relative", overflow:"hidden", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>

      {/* ── Scattered dots ── */}
      {dots.map((d, i) => <Dot key={i} {...d} />)}

      {/* ── White top navbar ── */}
      <nav style={{
        position:"relative", zIndex:20,
        background:"white",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 32px", height:60,
        boxShadow:"0 1px 0 rgba(0,0,0,0.08)",
      }}>
        {/* Left: logo + toggle */}
        <div style={{ display:"flex", alignItems:"center", gap:24 }}>
          <Link to="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
            <span style={{ fontSize:22 }}>🍔</span>
            <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:18, color:"#1a1a1a", letterSpacing:-0.5 }}>
              FoodExpress
            </span>
          </Link>
          <div style={{ display:"flex", background:"#F3F3F3", borderRadius:999, padding:3, gap:2 }}>
            {["Delivery","Pickup"].map((t, i) => (
              <button key={t} style={{
                padding:"6px 18px", borderRadius:999, border:"none", cursor:"pointer",
                fontWeight:700, fontSize:13,
                background: i===0 ? "white" : "transparent",
                color: i===0 ? "#1a1a1a" : "#6B7280",
                boxShadow: i===0 ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                transition:"all 0.2s",
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Right: auth links */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Link to="/login" style={{
            padding:"9px 20px", borderRadius:999, border:"none",
            background:"transparent", color:"#1a1a1a",
            fontWeight:700, fontSize:14, textDecoration:"none",
            transition:"background 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.background="#F3F3F3"}
            onMouseLeave={e => e.currentTarget.style.background="transparent"}
          >Log in</Link>
          <Link to="/register" style={{
            padding:"9px 22px", borderRadius:999,
            background:"#1a1a1a", color:"white",
            fontWeight:700, fontSize:14, textDecoration:"none",
            transition:"background 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.background="#333"}
            onMouseLeave={e => e.currentTarget.style.background="#1a1a1a"}
          >Sign up</Link>
        </div>
      </nav>

      {/* ── Corner food illustrations ── */}
      {/* Top-left: bowl */}
      <CornerFood emoji="🥗" size={220} style={{ top:-30, left:-30 }} rotate={-8}
        animate={{ y:[0,-8,0] }} />
      <CornerFood emoji="🫙" size={80}  style={{ top:90,  left:180 }} rotate={12}
        animate={{ y:[0,-5,0] }} />

      {/* Top-right: wrap/burrito board */}
      <CornerFood emoji="🌯" size={200} style={{ top:-20, right:-20 }} rotate={10}
        animate={{ y:[0,-10,0] }} />
      <CornerFood emoji="🥑" size={80}  style={{ top:130, right:200 }} rotate={-15}
        animate={{ y:[0,-6,0] }} />

      {/* Bottom-left: salad plate */}
      <CornerFood emoji="🍱" size={230} style={{ bottom:-40, left:-20 }} rotate={8}
        animate={{ y:[0,-9,0] }} />
      <CornerFood emoji="🥢" size={70}  style={{ bottom:160, left:195 }} rotate={-20}
        animate={{ y:[0,-4,0] }} />

      {/* Bottom-right: steak platter */}
      <CornerFood emoji="🍖" size={160} style={{ bottom:20,  right:50  }} rotate={-5}
        animate={{ y:[0,-8,0] }} />
      <CornerFood emoji="🫑" size={90}  style={{ bottom:155, right:220 }} rotate={20}
        animate={{ y:[0,-6,0] }} />
      <CornerFood emoji="🍜" size={130} style={{ bottom:-10, right:220 }} rotate={5}
        animate={{ y:[0,-7,0] }} />

      {/* ── Center content ── */}
      <div style={{
        position:"relative", zIndex:10,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        minHeight:"calc(100vh - 60px)",
        padding:"0 24px",
        textAlign:"center",
      }}>
        <motion.div
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.6, ease:[0.16,1,0.3,1] }}
        >
          <h1 style={{
            fontFamily:"'Sora',sans-serif",
            fontWeight:900,
            fontSize:"clamp(1.8rem,4vw,2.8rem)",
            color:"#1a1a1a",
            marginBottom:32,
            letterSpacing:-0.5,
            lineHeight:1.2,
          }}>
            Food Delivery in Colombo
          </h1>

          {/* Search bar */}
          <form onSubmit={handleFind} style={{ display:"flex", gap:10, maxWidth:560, width:"100%", margin:"0 auto" }}>
            <div style={{
              flex:1, display:"flex", alignItems:"center", gap:10,
              background:"white", borderRadius:12, padding:"0 18px",
              boxShadow:"0 4px 24px rgba(0,0,0,0.12)",
              border:"2px solid transparent",
              transition:"border-color 0.2s",
            }}>
              <MapPin size={18} color="#6B7280" style={{ flexShrink:0 }} />
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Enter delivery address"
                style={{
                  flex:1, border:"none", outline:"none",
                  fontSize:"0.95rem", color:"#1a1a1a",
                  padding:"16px 0",
                  background:"transparent",
                  fontFamily:"'Plus Jakarta Sans',sans-serif",
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding:"0 28px",
                background:"#1a1a1a", color:"white",
                border:"none", borderRadius:12, cursor:"pointer",
                fontWeight:700, fontSize:"0.95rem",
                fontFamily:"'Plus Jakarta Sans',sans-serif",
                display:"flex", alignItems:"center", gap:8,
                whiteSpace:"nowrap",
                boxShadow:"0 4px 16px rgba(0,0,0,0.2)",
                transition:"background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background="#333"}
              onMouseLeave={e => e.currentTarget.style.background="#1a1a1a"}
            >
              <Search size={16} />
              Find Food
            </button>
          </form>

          {/* Or browse */}
          <p style={{ marginTop:20, color:"rgba(0,0,0,0.45)", fontSize:"0.875rem" }}>
            or{" "}
            <Link to="/restaurants" style={{ color:"#1a1a1a", fontWeight:700, textDecoration:"underline" }}>
              browse all restaurants
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;
