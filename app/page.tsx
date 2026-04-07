"use client";

import React, { useState, ChangeEvent, useEffect, useRef, useCallback } from 'react';

// ─── Constantes fuera del componente para evitar recrearlas en cada render ───
const STATUS_COLORS: Record<string, string> = {
  "Publicado": "rgba(0, 255, 148, 0.15)",
  "Denegado": "rgba(255, 61, 0, 0.15)",
  "En Proceso": "rgba(0, 163, 255, 0.15)",
  "Planeando": "rgba(208, 0, 255, 0.15)",
  "Pendiente": "rgba(255, 184, 0, 0.15)",
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  "Publicado": "#00FF94",
  "Denegado": "#FF3D00",
  "En Proceso": "#00A3FF",
  "Planeando": "#D000FF",
  "Pendiente": "#FFB800",
};

const PRIORITY_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  "Bajo":  { bg: "rgba(34, 197, 94, 0.2)",  text: "#4ade80", label: "● Bajo" },
  "Medio": { bg: "rgba(245, 158, 11, 0.2)", text: "#fbbf24", label: "● Medio" },
  "Alto":  { bg: "rgba(239, 68, 68, 0.2)",  text: "#f87171", label: "● Alto" },
};

import {
  Calendar, Layout, List, Plus, Search, MoreHorizontal, User,
  FileText, Image as ImageIcon, MessageSquare,
  ChevronRight, CalendarDays, Maximize2, X,
  CheckCircle2, Clock,
  LogOut, AlertCircle, UploadCloud, Bot, Send, Trash2,
  Download
} from 'lucide-react';

// ─── Firebase Imports ───
import { db, storage } from '@/lib/firebase';
import {
  collection, doc, onSnapshot, setDoc, updateDoc,
  addDoc, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const priorityConfig = PRIORITY_CONFIG;

type RequestStatus = "Publicado" | "Denegado" | "En Proceso" | "Planeando" | "Pendiente";

// ─── Credenciales del sistema ───
const DESIGNER_USERS = ["Juan David", "Eliana", "Verónica", "Caleb"];
const PASS_TRAFFICKER = "angel2026";
const PASS_GENERAL = "ganaplay2026"; // CM y diseñadores

type RequestPriority = "Bajo" | "Medio" | "Alto";

type Creative = {
  url: string;
  type: string; 
  aiEvaluation?: {
    rating: number;
    color: "red" | "yellow" | "green";
    explanation: string;
    validation: string;
  };
};

type RequestType = {
  id: string;
  title: string;
  copy: string;
  format: string;
  dimensions: string[];
  countries: string[];
  requestDate: string;
  deliveryDate: string;
  postPublishDate?: string;
  status: RequestStatus;
  priority: RequestPriority;
  referenceImage?: string;
  assignedTo?: string;
  creatives: Creative[];
  comments?: number;
};

type DesignerChatMsg = {
  sender: string;
  text: string;
  time: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string | any[];
};

export default function GanaPlayMainApp() {
  const [role, setRole] = useState<"admin" | "cm" | "designer" | null>(() => {
    try { return (sessionStorage.getItem('gp_role') as any) || null; } catch { return null; }
  });
  const [userName, setUserName] = useState<string>(() => {
    try { return sessionStorage.getItem('gp_userName') || ''; } catch { return ''; }
  });
  const [toasts, setToasts] = useState<{id: number; msg: string; type: 'success'|'error'|'info'}[]>([]);
  const addToast = useCallback((msg: string, type: 'success'|'error'|'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, {id, msg, type}]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const [requests, setRequests] = useState<RequestType[]>([]);

  // Login state
  const [loginRole, setLoginRole] = useState<"admin"|"cm"|"designer"|null>(null);
  const [loginDesignerName, setLoginDesignerName] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  
  // Board State
  const [activeTab, setActiveTab] = useState('Tablero Kanban');
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<RequestType | null>(null);

  // Form State
  const [titleStr, setTitleStr] = useState("");
  const [copyStr, setCopyStr] = useState("");
  const [format, setFormat] = useState("static");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [postPublishDate, setPostPublishDate] = useState("");
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [referenceImg, setReferenceImg] = useState<string | undefined>(undefined);
  const [priority, setPriority] = useState<RequestPriority>("Medio");

  // Designer File & Chat State
  const [loading, setLoading] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [contextMenu, setContextMenu] = useState<{reqId: string; x: number; y: number} | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('andromeda_chat');
      if (saved) return JSON.parse(saved).slice(-20);
    } catch {}
    return [{ role: 'assistant' as const, content: 'Hola. Soy la IA Andromeda de Meta Ads. Puedo analizar tus piezas si las subes. ¿En qué recomendación creativa te puedo ayudar?' }];
  });
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatImage, setChatImage] = useState<string | null>(null);
  
  // Designer Team Chat State
  const [teamChatContent, setTeamChatContent] = useState<DesignerChatMsg[]>([]);
  const [teamInput, setTeamInput] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const teamChatRef = useRef<HTMLDivElement>(null);

  // History/filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "Todos">("Todos");

  // Drag & drop for calendar
  const [draggedReqId, setDraggedReqId] = useState<string | null>(null);

  // Weekly Calendar Generation
  const [weekDays, setWeekDays] = useState<{dateStr: string, dayName: string, dayNum: number, monthName: string, isToday: boolean, isMonday: boolean}[]>([]);

  // ─── Carga persistente desde Firebase + copia de seguridad en localStorage ───
  useEffect(() => {
    // Restaurar desde localStorage mientras carga Firebase (copia de seguridad local)
    try {
      const cached = localStorage.getItem('gp_requests_backup');
      if (cached) {
        const parsed = JSON.parse(cached) as RequestType[];
        if (parsed.length > 0) {
          setRequests(parsed);
          setLoadingData(false);
        }
      }
    } catch {}

    // Escuchar solicitudes en tiempo real desde Firebase
    const qReq = query(collection(db, "requests"), orderBy("deliveryDate", "asc"));
    const unsubReq = onSnapshot(qReq, (snap) => {
      const data = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as RequestType));
      setRequests(data);
      setLoadingData(false);
      // Guardar copia de seguridad en localStorage (accesible desde cualquier IP que use este navegador)
      try { localStorage.setItem('gp_requests_backup', JSON.stringify(data)); } catch {}
    }, (err) => {
      console.error("Firebase error:", err);
      setLoadingData(false);
    });

    // Escuchar chat de equipo en tiempo real
    const qChat = query(collection(db, "team_chat"), orderBy("createdAt", "asc"));
    const unsubChat = onSnapshot(qChat, (snap) => {
      const data = snap.docs.map(docSnap => docSnap.data() as DesignerChatMsg);
      setTeamChatContent(data);
    });

    return () => {
      unsubReq();
      unsubChat();
    };
  }, []);

  useEffect(() => {
    const curr = new Date();
    // Find the last Monday (or today if it's Monday)
    const todayDow = curr.getDay(); // 0=Sun, 1=Mon...
    const diffToMonday = todayDow === 0 ? -6 : 1 - todayDow;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + diffToMonday);
    // Generate 14 days starting from that Monday (Mon-Sun, Mon-Sun)
    const days = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        dateStr: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('es-ES', { weekday: 'long' }),
        dayNum: d.getDate(),
        monthName: d.toLocaleDateString('es-ES', { month: 'short' }),
        isToday: d.toISOString().split('T')[0] === curr.toISOString().split('T')[0],
        isMonday: d.getDay() === 1,
      });
    }
    setWeekDays(days);
    setDeliveryDate(curr.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (teamChatRef.current) {
      teamChatRef.current.scrollTop = teamChatRef.current.scrollHeight;
    }
  }, [teamChatContent]);

  // Persistir chat IA en localStorage (MEJORA 11)
  useEffect(() => {
    try { localStorage.setItem('andromeda_chat', JSON.stringify(chatMessages.slice(-20))); } catch {}
  }, [chatMessages]);

  // Cerrar menú contextual al hacer click fuera (MEJORA 5)
  useEffect(() => {
    const handler = () => setContextMenu(null);
    if (contextMenu) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [contextMenu]);

  const toggleSelection = (setter: React.Dispatch<React.SetStateAction<string[]>>, list: string[], val: string) => {
    if (list.includes(val)) setter(list.filter(item => item !== val));
    else setter([...list, val]);
  };

  const getNextId = () => {
    const gpNumbers = requests
      .map(r => parseInt(r.id.replace("GP", "")))
      .filter(n => !isNaN(n));
    const maxNum = gpNumbers.length > 0 ? Math.max(...gpNumbers) : 6611; 
    return `GP${maxNum + 1}`;
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copyStr || !deliveryDate || dimensions.length === 0 || countries.length === 0) {
      addToast("Completa todos los campos: País, Dimensiones, Copy y Fecha.", 'error');
      return;
    }

    const nextId = getNextId();
    const newReq: RequestType = {
      id: nextId,
      title: titleStr || "Nuevo Requerimiento",
      copy: copyStr,
      format: format,
      dimensions: dimensions,
      countries: countries,
      requestDate: new Date().toISOString().split("T")[0],
      deliveryDate: deliveryDate,
      status: "Pendiente",
      priority: priority,
      // Firestore no acepta undefined — usar null o excluir el campo
      ...(referenceImg ? { referenceImage: referenceImg } : {}),
      creatives: [],
      comments: 0
    };

    try {
      await setDoc(doc(db, "requests", nextId), newReq);
      setTitleStr(""); setCopyStr(""); setDimensions([]); setCountries([]); setReferenceImg(undefined); setPriority("Medio"); setPostPublishDate(""); setFormat("static");
      setCreateModalOpen(false);
      addToast(`Solicitud ${nextId} creada correctamente.`, 'success');
    } catch (err: any) {
      addToast("Error al guardar: " + err.message, 'error');
    }
  };

  const handleRefUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const storageRef = ref(storage, `references/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setReferenceImg(downloadURL);
      addToast("Imagen de referencia subida.", 'success');
    } catch (err: any) {
      addToast("Error subiendo referencia: " + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChatImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const storageRef = ref(storage, `chat_ai/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setChatImage(downloadURL);
    } catch (err: any) {
      addToast("Error subiendo imagen al chat: " + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (e: ChangeEvent<HTMLSelectElement>) => {
    if(!selectedReq || role !== 'designer') return;
    const newStatus = e.target.value as RequestStatus;
    
    try {
      await updateDoc(doc(db, "requests", selectedReq.id), {
        status: newStatus
      });
      setSelectedReq({ ...selectedReq, status: newStatus });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAssignToMe = async (req: RequestType) => {
    if (role !== 'designer') return;
    try {
      await updateDoc(doc(db, "requests", req.id), {
        assignedTo: userName
      });
      if (selectedReq?.id === req.id) setSelectedReq({ ...selectedReq, assignedTo: userName });
      addToast(`Te asignaste "${req.title}".`, 'success');
    } catch (err: any) {
      addToast("Error al asignar: " + err.message, 'error');
    }
  };

  const sendTeamMessage = async () => {
    if (!teamInput.trim()) return;
    const newMsg = {
      sender: userName,
      text: teamInput,
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      createdAt: serverTimestamp() // Importante para el orden
    };
    
    try {
      await addDoc(collection(db, "team_chat"), newMsg);
      setTeamInput("");
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDesignerUpload = async (e: ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file || !selectedReq) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Subir archivo a Firebase Storage (accesible desde cualquier IP)
      const storageRef = ref(storage, `creatives/${selectedReq.id}/${type.replace(/\s/g, '_')}_${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // 2. Intentar evaluación con IA (opcional - si falla, se guarda igual)
      let aiEvaluation: Creative['aiEvaluation'] = undefined;
      try {
        const reader = new FileReader();
        const base64data = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64data,
            copy: selectedReq.copy,
            format: selectedReq.format,
            country: selectedReq.countries.join(", "),
            dimensions: type
          })
        });

        const resData = await res.json();
        if (res.ok && resData.rating) {
          aiEvaluation = resData;
        }
      } catch {
        // IA falló — continuamos guardando el creativo sin evaluación
        addToast("Pieza guardada. Evaluación IA no disponible.", 'info');
      }

      const newCreative: Creative = {
        url: downloadURL,
        type: type,
        ...(aiEvaluation ? { aiEvaluation } : {})
      };

      const newCreativesList = [...selectedReq.creatives.filter(c => c.type !== type), newCreative];

      // 3. Guardar en Firestore (persistente, accesible desde cualquier IP)
      await updateDoc(doc(db, "requests", selectedReq.id), {
        status: "En Proceso",
        creatives: newCreativesList
      });

      setSelectedReq({ ...selectedReq, status: "En Proceso", creatives: newCreativesList });
      addToast(`Pieza "${type}" subida correctamente.`, 'success');

    } catch (err: any) {
      setErrorMsg(err.message);
      addToast("Error al subir la pieza: " + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() && !chatImage) return;
    
    let userContent: any = chatInput;
    if (chatImage) {
      userContent = [
        { type: "text", text: chatInput || "¿Qué opinas de este diseño para el algoritmo Andromeda?" },
        { type: "image_url", image_url: { url: chatImage } }
      ];
    }

    const userMsg = { role: "user" as const, content: userContent };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages); 
    setChatInput(""); 
    setChatImage(null);
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChatMessages([...newMessages, { role: "assistant", content: data.content }]);
    } catch (e: any) {
      setChatMessages([...newMessages, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChangePriority = async (e: ChangeEvent<HTMLSelectElement>) => {
    if (!selectedReq) return;
    const newPriority = e.target.value as RequestPriority;
    try {
      await updateDoc(doc(db, "requests", selectedReq.id), {
        priority: newPriority
      });
      setSelectedReq({ ...selectedReq, priority: newPriority });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDownload = async (creative: Creative, reqId: string, dim: string) => {
    try {
      // Fetch como blob para forzar descarga (los URLs de Firebase Storage son cross-origin)
      const response = await fetch(creative.url);
      if (!response.ok) throw new Error("No se pudo obtener el archivo.");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const urlPath = creative.url.split('?')[0];
      const lastSegment = urlPath.split('/').pop() ?? '';
      const extMatch = lastSegment.match(/\.([a-zA-Z0-9]+)$/);
      const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${reqId}_${dim.replace(/\s/g, '_')}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      addToast("Descarga iniciada.", 'success');
    } catch (err: any) {
      addToast("Error al descargar: " + err.message, 'error');
    }
  };

  const handleDeleteCreative = async (reqId: string, dimType: string) => {
    if (!selectedReq) return;
    const newCreatives = selectedReq.creatives.filter(c => c.type !== dimType);
    try {
      await updateDoc(doc(db, "requests", reqId), { creatives: newCreatives });
      const updatedReq = { ...selectedReq, creatives: newCreatives };
      setSelectedReq(updatedReq);
    } catch (err: any) {
      console.error("Error eliminando creativo:", err);
    }
  };

  const handleDropOnDay = async (dateStr: string) => {
    if (!draggedReqId) return;
    try {
      await updateDoc(doc(db, "requests", draggedReqId), { deliveryDate: dateStr });
    } catch (err: any) {
      console.error("Error moviendo solicitud:", err);
    }
    setDraggedReqId(null);
  };

  const navItemStyle = (isActive: boolean) => ({
    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', cursor: 'pointer',
    color: isActive ? 'var(--button-text)' : 'var(--text-secondary)', fontWeight: isActive ? 700 : 500,
    background: isActive ? 'linear-gradient(135deg, #22c55e, #10b981)' : 'transparent',
    textTransform: 'uppercase' as 'uppercase', letterSpacing: '1px', fontSize: '13px'
  });

  const handleAdminLogin = () => {
    setLoginError("");
    if (loginPass === PASS_TRAFFICKER) {
      setRole("admin"); setUserName("Trafficker");
      sessionStorage.setItem('gp_role', 'admin');
      sessionStorage.setItem('gp_userName', 'Trafficker');
    } else {
      setLoginError("❌ Contraseña incorrecta.");
    }
  };

  const handleCmLogin = () => {
    setLoginError("");
    if (loginPass === PASS_GENERAL) {
      setRole("cm"); setUserName("Community Manager");
      sessionStorage.setItem('gp_role', 'cm');
      sessionStorage.setItem('gp_userName', 'Community Manager');
    } else {
      setLoginError("❌ Contraseña incorrecta.");
    }
  };

  const handleDesignerLogin = () => {
    setLoginError("");
    if (!loginDesignerName) { setLoginError("Selecciona tu nombre."); return; }
    if (loginPass === PASS_GENERAL) {
      setRole("designer"); setUserName(loginDesignerName);
      sessionStorage.setItem('gp_role', 'designer');
      sessionStorage.setItem('gp_userName', loginDesignerName);
    } else {
      setLoginError("❌ Contraseña incorrecta.");
    }
  };

  const handleLogout = () => {
    setRole(null); setUserName(""); setLoginPass(""); setLoginDesignerName("");
    setLoginError(""); setLoginRole(null); setActiveTab('Tablero Kanban');
    sessionStorage.removeItem('gp_role');
    sessionStorage.removeItem('gp_userName');
  };

  if (!role) {
    const ROLE_CARDS = [
      { key: 'admin',    icon: '⚡', label: 'Trafficker',         sub: 'Gestión total', color: '#22c55e', glow: 'rgba(34,197,94,0.4)',   gradient: 'linear-gradient(135deg,#22c55e,#10b981)' },
      { key: 'cm',       icon: '🌐', label: 'Community Manager',  sub: 'Redes y contenido', color: '#a855f7', glow: 'rgba(168,85,247,0.4)', gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)' },
      { key: 'designer', icon: '✦',  label: 'Diseñador',          sub: 'Equipo creativo', color: '#f472b6', glow: 'rgba(244,114,182,0.4)', gradient: 'linear-gradient(135deg,#f472b6,#ec4899)' },
    ];
    const selectedCard = ROLE_CARDS.find(c => c.key === loginRole);
    return (
      <div style={{ position:'relative', display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', overflow:'hidden' }}>
        {/* Animated background blobs */}
        <div style={{ position:'absolute', inset:0, background:'#050a06' }} />
        <div style={{ position:'absolute', top:'-15%', left:'-10%', width:'600px', height:'600px', borderRadius:'50%', background:'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)', animation:'pulse-slow 8s ease-in-out infinite', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-20%', right:'-10%', width:'700px', height:'700px', borderRadius:'50%', background:'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', animation:'pulse-slow 10s ease-in-out infinite reverse', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'900px', height:'900px', borderRadius:'50%', border:'1px solid rgba(34,197,94,0.04)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'600px', height:'600px', borderRadius:'50%', border:'1px solid rgba(34,197,94,0.06)', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:10, width:'100%', maxWidth:'560px', padding:'24px' }}>
          {/* Header brand */}
          <div style={{ textAlign:'center', marginBottom:'44px' }}>
            <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'80px', height:'80px', borderRadius:'24px', background:'linear-gradient(135deg,rgba(34,197,94,0.2),rgba(16,185,129,0.1))', border:'1px solid rgba(34,197,94,0.3)', boxShadow:'0 0 40px rgba(34,197,94,0.15)', marginBottom:'20px', animation:'float 4s ease-in-out infinite' }}>
              <img src="/logo.png" alt="GanaPlay" style={{ height:'52px', objectFit:'contain' }} />
            </div>
            <h1 style={{ fontSize:'30px', fontWeight:800, margin:'0 0 8px', background:'linear-gradient(135deg,#f0fdf4,#86efac)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'-0.5px' }}>GanaPlay Diseño</h1>
            <p style={{ color:'rgba(134,239,172,0.6)', fontSize:'14px', margin:0, letterSpacing:'0.5px' }}>Plataforma de gestión creativa</p>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginTop:'12px' }}>
              <div style={{ width:'40px', height:'1px', background:'linear-gradient(90deg,transparent,rgba(34,197,94,0.4))' }} />
              <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 8px rgba(34,197,94,0.8)' }} />
              <div style={{ width:'40px', height:'1px', background:'linear-gradient(90deg,rgba(34,197,94,0.4),transparent)' }} />
            </div>
          </div>

          {/* Role selector */}
          <div style={{ marginBottom:'24px' }}>
            <p style={{ fontSize:'11px', fontWeight:700, color:'rgba(134,239,172,0.5)', textTransform:'uppercase', letterSpacing:'2px', textAlign:'center', marginBottom:'14px' }}>Selecciona tu rol</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
              {ROLE_CARDS.map(card => (
                <div key={card.key}
                  onClick={() => { setLoginRole(card.key as any); setLoginPass(''); setLoginDesignerName(''); setLoginError(''); }}
                  style={{
                    background: loginRole === card.key ? `${card.color}10` : 'rgba(255,255,255,0.02)',
                    border: `1.5px solid ${loginRole === card.key ? card.color : 'rgba(255,255,255,0.06)'}`,
                    borderRadius:'16px', padding:'18px 10px 16px', cursor:'pointer', textAlign:'center',
                    transition:'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: loginRole === card.key ? `0 0 24px ${card.glow}, inset 0 0 0 1px ${card.color}20` : 'none',
                    transform: loginRole === card.key ? 'translateY(-4px)' : 'none',
                    backdropFilter:'blur(10px)',
                  }}
                >
                  <div style={{ fontSize:'22px', marginBottom:'8px', filter: loginRole === card.key ? `drop-shadow(0 0 8px ${card.color})` : 'none', transition:'filter 0.25s' }}>{card.icon}</div>
                  <div style={{ fontWeight:700, fontSize:'12px', color: loginRole === card.key ? card.color : 'rgba(255,255,255,0.7)', lineHeight:1.3, marginBottom:'4px' }}>{card.label}</div>
                  <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', letterSpacing:'0.3px' }}>{card.sub}</div>
                  {loginRole === card.key && (
                    <div style={{ marginTop:'8px', width:'20px', height:'2px', borderRadius:'1px', background:card.gradient, margin:'8px auto 0' }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Login form */}
          {loginRole && selectedCard && (
            <div style={{ background:'rgba(0,0,0,0.4)', backdropFilter:'blur(20px)', borderRadius:'20px', border:`1px solid ${selectedCard.color}30`, padding:'28px', boxShadow:`0 20px 60px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.02)` }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'22px' }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:selectedCard.gradient, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', boxShadow:`0 4px 12px ${selectedCard.glow}` }}>{selectedCard.icon}</div>
                <div>
                  <div style={{ fontSize:'13px', fontWeight:700, color:selectedCard.color, lineHeight:1.2 }}>Ingresar como {selectedCard.label}</div>
                  <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', letterSpacing:'0.3px' }}>Acceso seguro con contraseña</div>
                </div>
              </div>

              {loginRole === 'designer' && (
                <div style={{ marginBottom:'14px' }}>
                  <label style={{ display:'block', fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:'8px' }}>Tu nombre</label>
                  <select value={loginDesignerName} onChange={e => setLoginDesignerName(e.target.value)}
                    style={{ background:'rgba(0,0,0,0.6)', border:`1px solid ${selectedCard.color}40`, borderRadius:'12px', color: loginDesignerName ? 'var(--text-primary)' : 'rgba(255,255,255,0.3)' }}>
                    <option value="">— Selecciona tu nombre —</option>
                    {DESIGNER_USERS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              )}

              <div style={{ marginBottom:'16px' }}>
                <label style={{ display:'block', fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:'8px' }}>Contraseña</label>
                <div style={{ position:'relative' }}>
                  <input type="password" placeholder="••••••••••••"
                    value={loginPass} onChange={e => setLoginPass(e.target.value)}
                    style={{ background:'rgba(0,0,0,0.6)', border:`1px solid ${loginPass ? selectedCard.color+'60' : 'rgba(255,255,255,0.08)'}`, borderRadius:'12px', paddingRight:'16px', transition:'all 0.2s' }}
                    onKeyDown={e => {
                      if (e.key !== 'Enter') return;
                      if (loginRole === 'admin') handleAdminLogin();
                      else if (loginRole === 'cm') handleCmLogin();
                      else handleDesignerLogin();
                    }}
                  />
                </div>
              </div>

              {loginError && (
                <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'10px', marginBottom:'14px' }}>
                  <span style={{ color:'#f87171', fontSize:'12px', fontWeight:600 }}>{loginError}</span>
                </div>
              )}

              <button
                style={{ width:'100%', padding:'15px', border:'none', borderRadius:'14px', background:selectedCard.gradient, color:'#fff', fontFamily:'inherit', fontSize:'14px', fontWeight:800, cursor:'pointer', letterSpacing:'1px', textTransform:'uppercase', boxShadow:`0 8px 24px ${selectedCard.glow}`, transition:'all 0.25s ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow=`0 12px 30px ${selectedCard.glow}`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow=`0 8px 24px ${selectedCard.glow}`; }}
                onClick={() => {
                  if (loginRole === 'admin') handleAdminLogin();
                  else if (loginRole === 'cm') handleCmLogin();
                  else handleDesignerLogin();
                }}
              >
                Acceder al sistema →
              </button>

              <p style={{ textAlign:'center', fontSize:'10px', color:'rgba(255,255,255,0.2)', marginTop:'16px', marginBottom:0 }}>
                🔒 Sesión encriptada · GanaPlay 2026
              </p>
            </div>
          )}

          {!loginRole && (
            <p style={{ textAlign:'center', fontSize:'12px', color:'rgba(255,255,255,0.2)', marginTop:'20px' }}>© 2026 GanaPlay · Todos los derechos reservados</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth:'1500px', margin:'0 auto', padding:'20px 16px' }}>
      
      {/* STICKY HEADER */}
      <div style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        marginBottom:'24px', paddingBottom:'16px', borderBottom:'1px solid rgba(255,255,255,0.06)',
        position:'sticky', top:0, zIndex:50, background:'var(--bg-color)', backdropFilter:'blur(20px)', paddingTop:'8px'
      }}>
        {/* Brand */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', minWidth:0 }}>
          <img src="/logo.png" alt="GanaPlay" style={{ height:'44px', flexShrink:0 }} />
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:'18px', color:'var(--text-primary)', whiteSpace:'nowrap' }}>GanaPlay Diseño</div>
            <div style={{ fontSize:'11px', color:'var(--text-secondary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {role === 'admin' ? '🔵 Trafficker' : role === 'cm' ? '🟣 Community Manager' : `🎨 ${userName}`}
            </div>
          </div>
        </div>
        {/* Header Actions */}
        <div style={{ display:'flex', gap:'8px', alignItems:'center', flexShrink:0 }}>
          <button title="Nuevo Requerimiento" className="btn" style={{ padding:'9px 14px', fontSize:'13px' }}
            onClick={() => setCreateModalOpen(true)}
            hidden={role === 'designer'}
          >
            <Plus size={16} /> <span style={{ display:'none' }} className="btn-label">Nuevo</span>
          </button>
          <button title="Cerrar sesión" className="btn btn-secondary"
            style={{ padding:'9px 14px', fontSize:'13px', borderColor:'#ef4444', color:'#ef4444' }}
            onClick={handleLogout}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
      <div style={{ background:'rgba(10,20,15,0.7)', backdropFilter:'blur(20px)', border:'1px solid var(--border-color)', borderRadius:'20px', padding:'28px' }}>
        {/* Section header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
          <h2 style={{ fontSize:'24px', margin:0, display:'flex', alignItems:'center', gap:'10px' }}>
            <CalendarDays color="var(--accent-color)" size={26} /> Solicitudes de artes
          </h2>
        </div>

        {/* NAV TABS */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'24px', borderBottom:'1px solid var(--border-color)', paddingBottom:'16px', flexWrap:'wrap' }}>
          <div style={navItemStyle(activeTab === 'Tablero Kanban')} onClick={() => setActiveTab('Tablero Kanban')}><Calendar size={15} /> Planeación</div>
          <div style={navItemStyle(activeTab === 'Calendario Entrega')} onClick={() => setActiveTab('Calendario Entrega')}><Layout size={15} /> Por Estado</div>
          {(role === 'admin' || role === 'cm') && (
            <div style={{ ...navItemStyle(activeTab === 'Pendientes'), position:'relative' }} onClick={() => setActiveTab('Pendientes')}>
              <AlertCircle size={15} /> Pendientes
              {requests.filter(r => r.status === 'Pendiente').length > 0 && (
                <span style={{ position:'absolute', top:'-5px', right:'-5px', background:'#f87171', color:'#fff', borderRadius:'50%', width:'16px', height:'16px', fontSize:'9px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
                  {requests.filter(r => r.status === 'Pendiente').length}
                </span>
              )}
            </div>
          )}
          {role === 'designer' && (
            <div style={navItemStyle(activeTab === 'Equipo Diseño')} onClick={() => setActiveTab('Equipo Diseño')}><MessageSquare size={15} /> Workspace</div>
          )}
          <div style={navItemStyle(activeTab === 'Historial')} onClick={() => setActiveTab('Historial')}><Clock size={15} /> Historial</div>
          <div style={navItemStyle(activeTab === 'Tabla Principal')} onClick={() => setActiveTab('Tabla Principal')}><List size={15} /> Tabla Principal</div>
        </div>

        {/* CALENDARIO ENTREGA VIEW (Columnas por estado como en captura) */}
        {activeTab === 'Calendario Entrega' && (
          <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', minHeight: '70vh', alignItems: 'flex-start' }}>
            {[
              { id: 'Denegado', title: 'Declined', color: '#FF3D00', bg: 'rgba(255, 61, 0, 0.05)' },
              { id: 'Pendiente', title: 'Backlog / Draft', color: '#FFB800', bg: 'rgba(255, 184, 0, 0.05)' },
              { id: 'Planeando', title: 'Planning', color: '#D000FF', bg: 'rgba(208, 0, 255, 0.05)' },
              { id: 'En Proceso', title: 'In Progress', color: '#00A3FF', bg: 'rgba(0, 163, 255, 0.05)' },
              { id: 'Publicado', title: 'Posted', color: '#00FF94', bg: 'rgba(0, 255, 148, 0.05)' }
            ].map(col => {
              const colCards = requests.filter(req => req.status === col.id);
              return (
                <div key={col.id} style={{ minWidth: '320px', width: '320px', background: col.bg, borderRadius: '16px', padding: '16px', border: `1px solid ${col.color}33`, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Column Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: `${col.color}20`, borderRadius: '20px', width: 'fit-content' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }}></div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{col.title} <span style={{ color: col.color, marginLeft: '6px' }}>{colCards.length}</span></span>
                  </div>

                  {/* Add new button specifically for Draft/Backlog column as shown in mockup, functionality opens standard modal */}
                  {(role === 'admin' || role === 'cm') && col.id === 'Pendiente' && (
                    <div 
                      style={{ cursor: 'pointer', padding: '12px 16px', borderRadius: '12px', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)', fontSize: '14px', background: 'rgba(0,0,0,0.3)' }}
                      onClick={() => setCreateModalOpen(true)}
                    >
                      <Plus size={16} /> Nueva solicitud
                    </div>
                  )}

                  {/* Column Cards */}
                  {colCards.map(c => (
                    <div key={c.id} className="request-card" 
                      style={{ 
                        padding: '16px', 
                        margin: 0, 
                        borderRadius: '12px', 
                        background: 'rgba(0,0,0,0.6)', 
                        border: '1px solid rgba(255,255,255,0.05)', 
                        borderLeft: `4px solid ${priorityConfig[c.priority ?? 'Medio'].text}`,
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                        transition: 'all 0.2s ease',
                      }} 
                      onClick={() => { setSelectedReq(c); setModalOpen(true); }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <FileText size={18} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                            {c.id} {c.title}
                          </span>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              {c.deliveryDate}
                            </div>
                            {c.comments ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                <MessageSquare size={12} /> {c.comments}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* PENDIENTES VIEW */}
        {activeTab === 'Pendientes' && (() => {
          const pendingRequests = requests.filter(r => r.status === 'Pendiente');
          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <AlertCircle size={20} color="#FFB800" />
                <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Solicitudes Pendientes
                </span>
                <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, background: 'rgba(255,184,0,0.15)', color: '#FFB800', border: '1px solid rgba(255,184,0,0.3)' }}>
                  {pendingRequests.length}
                </span>
              </div>
              {pendingRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p>No hay solicitudes pendientes.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pendingRequests.map(req => (
                    <div key={req.id}
                      style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,184,0,0.2)', borderLeft: `4px solid ${priorityConfig[req.priority ?? 'Medio'].text}`, borderRadius: '12px', padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}
                      onClick={() => { setSelectedReq(req); setModalOpen(true); }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                        <span style={{ fontSize: '12px', color: 'var(--accent-color)', fontWeight: 800 }}>{req.id}</span>
                        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.title}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Entrega: {req.deliveryDate} · {req.countries.join(' / ')}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: priorityConfig[req.priority ?? 'Medio'].bg, color: priorityConfig[req.priority ?? 'Medio'].text, border: `1px solid ${priorityConfig[req.priority ?? 'Medio'].text}` }}>{req.priority ?? 'Medio'}</span>
                        <ChevronRight size={16} color="var(--accent-color)" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* KANBAN VERTICAL - Planeación (lunes a lunes scroll vertical) */}
        {activeTab === 'Tablero Kanban' && (() => {
          // Group 14 days into 2 weeks
          const week1 = weekDays.slice(0, 7);
          const week2 = weekDays.slice(7, 14);
          const renderWeek = (days: typeof weekDays) => (
            <div style={{ border:'1px solid var(--border-color)', borderRadius:'14px', overflow:'hidden', marginBottom:'20px' }}>
              {/* Week header */}
              <div style={{ display:'grid', gridTemplateColumns:'130px repeat(7, 1fr)', background:'rgba(34,197,94,0.06)', borderBottom:'1px solid var(--border-color)' }}>
                <div style={{ padding:'12px 16px', fontSize:'11px', fontWeight:800, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'1px', display:'flex', alignItems:'center' }}>
                  {days[0]?.monthName?.toUpperCase()} {new Date(days[0]?.dateStr).getFullYear()}
                </div>
                {days.map((d) => (
                  <div key={d.dateStr} style={{
                    padding:'12px 8px', textAlign:'center', borderLeft:'1px solid rgba(255,255,255,0.04)',
                    background: d.isToday ? 'rgba(34,197,94,0.15)' : 'transparent'
                  }}>
                    <div style={{ fontSize:'10px', fontWeight:700, color: d.isToday ? 'var(--accent-color)' : 'var(--text-secondary)', textTransform:'uppercase' }}>{d.dayName.slice(0,3)}</div>
                    <div style={{ fontSize:'18px', fontWeight:800, color: d.isToday ? 'var(--accent-color)' : 'var(--text-primary)', lineHeight:1.2 }}>{d.dayNum}</div>
                    {d.isToday && <div style={{ fontSize:'8px', color:'var(--accent-color)', fontWeight:900, letterSpacing:'1px' }}>HOY</div>}
                  </div>
                ))}
              </div>
              {/* Request rows by status group */}
              {(['Pendiente','Planeando','En Proceso','Publicado','Denegado'] as RequestStatus[]).map(status => {
                const rowCards = days.map((d) => ({ day: d, cards: requests.filter(r => r.deliveryDate === d.dateStr && r.status === status) }));
                const hasAny = rowCards.some(x => x.cards.length > 0);
                if (!hasAny) return null;
                return (
                  <div key={status} style={{ display:'grid', gridTemplateColumns:'130px repeat(7, 1fr)', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ padding:'12px 14px', display:'flex', alignItems:'flex-start', borderRight:'1px solid rgba(255,255,255,0.04)', paddingTop:'14px' }}>
                      <span style={{ padding:'3px 8px', fontSize:'9px', fontWeight:800, textTransform:'uppercase', background:STATUS_COLORS[status], color:STATUS_TEXT_COLORS[status], borderRadius:'6px', border:`1px solid ${STATUS_TEXT_COLORS[status]}`, whiteSpace:'nowrap' }}>{status}</span>
                    </div>
                    {rowCards.map(({day, cards}) => (
                      <div key={day.dateStr}
                        style={{ borderLeft:'1px solid rgba(255,255,255,0.03)', padding:'8px', minHeight:'60px', background: day.isToday ? 'rgba(34,197,94,0.04)' : 'transparent', display:'flex', flexDirection:'column', gap:'6px', transition:'background 0.15s' }}
                        onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.background = 'rgba(34,197,94,0.1)'; }}
                        onDragLeave={e => { (e.currentTarget as HTMLElement).style.background = day.isToday ? 'rgba(34,197,94,0.04)' : 'transparent'; }}
                        onDrop={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.background = day.isToday ? 'rgba(34,197,94,0.04)' : 'transparent'; handleDropOnDay(day.dateStr); }}
                      >
                        {cards.map((c) => (
                          <div key={c.id}
                            draggable
                            style={{ padding:'8px 10px', borderRadius:'8px', background:'rgba(0,0,0,0.6)', cursor:'grab', borderLeft:`3px solid ${STATUS_TEXT_COLORS[c.status]}`, fontSize:'11px', fontWeight:600, color:'var(--text-primary)', lineHeight:1.3, transition:'all 0.2s' }}
                            onClick={() => { setSelectedReq(c); setModalOpen(true); }}
                            onDragStart={e => { e.stopPropagation(); setDraggedReqId(c.id); (e.currentTarget as HTMLElement).style.opacity = '0.5'; }}
                            onDragEnd={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 6px 15px ${STATUS_TEXT_COLORS[c.status]}33`; }}
                            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
                          >
                            <div style={{ color:'var(--accent-color)', fontSize:'9px', fontWeight:800, marginBottom:'2px' }}>{c.id}</div>
                            <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%' }}>{c.title}</div>
                            {c.priority === 'Alto' && <div style={{ fontSize:'8px', color:'#FF3D00', fontWeight:700, marginTop:'2px' }}>⚡ ALTA</div>}
                            {(role === 'admin' || role === 'cm') && <div style={{ fontSize:'9px', color:'var(--accent-color)', marginTop:'2px', cursor:'pointer', opacity:0.8 }} onClick={e => { e.stopPropagation(); setDeliveryDate(day.dateStr); setCreateModalOpen(true); }}></div>}
                          </div>
                        ))}
                        {(role === 'admin' || role === 'cm') && cards.length === 0 && (
                          <div title="Agregar solicitud en este día" style={{ opacity:0.3, cursor:'pointer', textAlign:'center', fontSize:'16px' }}
                            onClick={() => { setDeliveryDate(day.dateStr); setCreateModalOpen(true); }}>+</div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
              {/* Empty state */}
              {days.every((d) => requests.filter(r => r.deliveryDate === d.dateStr).length === 0) && (
                <div style={{ padding:'24px', textAlign:'center', color:'var(--text-secondary)', fontSize:'13px', borderTop:'1px solid rgba(255,255,255,0.04)' }}>Sin solicitudes esta semana</div>
              )}
            </div>
          );
          return (
            <div>
              <div style={{ fontSize:'12px', color:'var(--text-secondary)', marginBottom:'12px', textTransform:'uppercase', fontWeight:700, letterSpacing:'1px' }}>📅 Semana 1</div>
              {renderWeek(week1)}
              <div style={{ fontSize:'12px', color:'var(--text-secondary)', marginBottom:'12px', textTransform:'uppercase', fontWeight:700, letterSpacing:'1px' }}>📅 Semana 2</div>
              {renderWeek(week2)}
            </div>
          );
        })()}

        {/* EQUIPO DISEÑO VIEW */}
        {activeTab === 'Equipo Diseño' && role === 'designer' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
            <div className="glass-panel" style={{ padding: '30px', background: 'rgba(0,0,0,0.4)' }}>
              <h3 style={{ marginBottom: '20px', color: 'var(--accent-color)' }}>Solicitudes Activas</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {requests.filter(r => r.status !== 'Publicado').map(req => (
                  <div key={req.id} style={{ background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '15px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '5px' }}>{req.id} • {req.deliveryDate}</div>
                      <div style={{ fontSize: '16px', fontWeight: 700 }}>{req.title}</div>
                      <div style={{ marginTop: '10px' }}>
                        <span style={{ padding: '3px 8px', fontSize: '10px', background: STATUS_COLORS[req.status], color: STATUS_TEXT_COLORS[req.status], borderRadius: '6px', fontWeight: 'bold', textTransform: 'uppercase', border: `1px solid ${STATUS_TEXT_COLORS[req.status]}` }}>{req.status}</span>
                        {req.assignedTo && <span style={{ marginLeft: '10px', fontSize: '11px', color: 'var(--accent-color)' }}><User size={10} style={{ display:'inline', marginRight:'4px' }} />Asignado a: {req.assignedTo}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {!req.assignedTo && (
                        <button className="btn btn-secondary" style={{ padding: '8px 15px', fontSize: '12px' }} onClick={() => handleAssignToMe(req)}>
                          Asignarme
                        </button>
                      )}
                      <button className="btn" style={{ padding: '8px 15px', fontSize: '12px' }} onClick={() => { setSelectedReq(req); setModalOpen(true); }}>
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '600px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--accent-color)' }}>
              <div style={{ padding: '15px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageSquare size={18} color="var(--accent-color)" /> Chat de Equipo
              </div>
              <div ref={teamChatRef} style={{ flexGrow: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {teamChatContent.length === 0 && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '20px' }}>No hay mensajes aún. ¡Saluda a tu equipo!</p>}
                {teamChatContent.map((m, i) => (
                  <div key={i} style={{ alignSelf: m.sender === userName ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', textAlign: m.sender === userName ? 'right' : 'left' }}>{m.sender} • {m.time}</div>
                    <div style={{ background: m.sender === userName ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '12px', border: m.sender === userName ? '1px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.1)', fontSize: '13px' }}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '15px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  value={teamInput} 
                  onChange={(e) => setTeamInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && sendTeamMessage()}
                  placeholder="Mensaje al equipo..." 
                  style={{ fontSize: '13px', padding: '10px' }}
                />
                <button className="btn" style={{ padding: '10px' }} onClick={sendTeamMessage}><Send size={16} /></button>
              </div>
            </div>
          </div>
        )}

        {/* HISTORIAL VIEW */}
        {activeTab === 'Historial' && (() => {
          const filtered = requests.filter(r => {
            const matchSearch = searchQuery === '' || r.id.toLowerCase().includes(searchQuery.toLowerCase()) || r.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchStatus = statusFilter === 'Todos' || r.status === statusFilter;
            return matchSearch && matchStatus;
          });
          return (
            <div>
              {/* Filters */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '200px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px' }}>
                  <Search size={16} color="var(--text-secondary)" />
                  <input type="text" placeholder="Buscar por ID o título..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '14px', color: 'var(--text-primary)', padding: 0 }} />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '14px' }}>
                  <option value="Todos">Todos los estados</option>
                  {(["Publicado","En Proceso","Planeando","Pendiente","Denegado"] as RequestStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
              </div>

              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                  <Search size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p>No se encontraron solicitudes.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filtered.sort((a, b) => b.id.localeCompare(a.id)).map(req => (
                    <div key={req.id} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', borderLeft: `4px solid ${priorityConfig[req.priority ?? 'Medio'].text}` }}>
                      {/* Header */}
                      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                        onClick={() => { setSelectedReq(req); setModalOpen(true); }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-color)' }}>{req.id}</span>
                          <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{req.title}</span>
                          <span style={{ padding: '3px 8px', fontSize: '10px', background: STATUS_COLORS[req.status], color: STATUS_TEXT_COLORS[req.status], borderRadius: '6px', fontWeight: 'bold', textTransform: 'uppercase', border: `1px solid ${STATUS_TEXT_COLORS[req.status]}` }}>{req.status}</span>
                          <span style={{ padding: '3px 8px', fontSize: '10px', background: priorityConfig[req.priority ?? 'Medio'].bg, color: priorityConfig[req.priority ?? 'Medio'].text, borderRadius: '6px', fontWeight: 'bold', textTransform: 'uppercase', border: `1px solid ${priorityConfig[req.priority ?? 'Medio'].text}` }}>{req.priority ?? 'Medio'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <span>{req.countries.join(' / ')}</span>
                          <span>Entrega: <strong style={{ color: 'var(--text-primary)' }}>{req.deliveryDate}</strong></span>
                          <ChevronRight size={18} color="var(--accent-color)" />
                        </div>
                      </div>

                      {/* Creatives row */}
                      {req.creatives.length > 0 && (
                        <div style={{ padding: '16px 20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                          {req.creatives.map((creative, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                              <img src={creative.url} alt={`Creativo ${creative.type}`} style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px' }} />
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>{creative.type}</span>
                              {creative.aiEvaluation && (
                                <span className={`badge badge-${creative.aiEvaluation.color}`} style={{ fontSize: '10px' }}>{creative.aiEvaluation.rating}/10</span>
                              )}
                              {role === 'admin' && (
                                <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '11px', width: '100%' }}
                                  onClick={() => handleDownload(creative, req.id, creative.type)}>
                                  <Download size={12} /> Descargar
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {req.creatives.length === 0 && (
                        <div style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)' }}>
                          Sin piezas subidas aún.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}
        {/* TABLA PRINCIPAL VIEW */}
        {activeTab === 'Tabla Principal' && (() => {
          const tableGroups = [
            { name: 'Pendientes', color: '#a855f7', borderColor: 'rgba(168,85,247,0.4)', statuses: ['Pendiente', 'En Proceso', 'Planeando'] as RequestStatus[] },
            { name: 'Completado', color: '#22c55e', borderColor: 'rgba(34,197,94,0.4)', statuses: ['Publicado', 'Denegado'] as RequestStatus[] },
          ];
          const getStatusDisplay = (s: RequestStatus) => {
            const map: Record<string,{label:string,bg:string,color:string}> = {
              'Publicado': { label:'Listo', bg:'rgba(34,197,94,0.2)', color:'#22c55e' },
              'Denegado':  { label:'Denegado', bg:'rgba(239,68,68,0.2)', color:'#ef4444' },
              'En Proceso':{ label:'En curso', bg:'rgba(245,158,11,0.2)', color:'#f59e0b' },
              'Planeando': { label:'Planeando', bg:'rgba(168,85,247,0.2)', color:'#a855f7' },
              'Pendiente': { label:'No iniciado', bg:'rgba(100,116,139,0.2)', color:'#94a3b8' },
            };
            return map[s] || map['Pendiente'];
          };
          const getPrioDisplay = (p: RequestPriority) => {
            const map: Record<string,{label:string,bg:string,color:string}> = {
              'Alto':  { label:'Alta', bg:'rgba(168,85,247,0.2)', color:'#a855f7' },
              'Medio': { label:'Media', bg:'rgba(59,130,246,0.2)', color:'#60a5fa' },
              'Bajo':  { label:'Baja', bg:'rgba(34,197,94,0.2)', color:'#4ade80' },
            };
            return map[p] || map['Medio'];
          };
          const fmtDate = (ds: string) => {
            if (!ds) return '';
            try { const d = new Date(ds+'T12:00:00'); return d.toLocaleDateString('es-ES',{month:'short',day:'numeric'}); } catch { return ds; }
          };
          const fmtRelative = (ds: string) => {
            if (!ds) return '';
            try {
              const diff = Date.now() - new Date(ds).getTime();
              const d = Math.floor(diff/86400000);
              if (d === 0) return 'Hoy'; if (d < 7) return `Hace ${d}d`; if (d < 30) return `Hace ${Math.floor(d/7)}sem`; return `Hace ${Math.floor(d/30)}mes`;
            } catch { return ds; }
          };
          const isOverdue = (ds: string) => !!ds && ds < new Date().toISOString().split('T')[0];
          const AVATAR_COLORS = ['#22c55e','#a855f7','#f59e0b','#60a5fa','#ef4444'];
          const avatarColor = (name: string) => AVATAR_COLORS[(name.charCodeAt(0)||0) % AVATAR_COLORS.length];
          const getInitials = (name: string) => name ? name.slice(0,2).toUpperCase() : '?';
          const COLS = [
            { w:'260px', label:'Tarea' }, { w:'80px', label:'Responsable' },
            { w:'110px', label:'Estado ⓘ' }, { w:'120px', label:'Vencimiento ⓘ' },
            { w:'90px', label:'Prioridad' }, { w:'130px', label:'Notas' },
            { w:'80px', label:'Archivos' }, { w:'160px', label:'Cronograma ⓘ' },
            { w:'130px', label:'Última actualiza...' },
          ];
          const gridCols = `28px 28px ${COLS.map(c=>c.w).join(' ')} 32px`;
          const cell = (extra?: React.CSSProperties): React.CSSProperties => ({
            padding:'10px 12px', borderRight:'1px solid rgba(255,255,255,0.04)',
            display:'flex', alignItems:'center', overflow:'hidden', fontSize:'13px', ...extra
          });
          return (
            <div>
              {tableGroups.map(group => {
                const groupRows = requests.filter(r => group.statuses.includes(r.status));
                return (
                  <div key={group.name} style={{ marginBottom:'28px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'6px 0 10px' }}>
                      <ChevronRight size={14} color={group.color} />
                      <span style={{ fontSize:'14px', fontWeight:800, color:group.color, textTransform:'uppercase', letterSpacing:'0.5px' }}>{group.name}</span>
                      <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.3)', fontWeight:600 }}>{groupRows.length}</span>
                    </div>
                    <div style={{ border:`1px solid ${group.borderColor}`, borderRadius:'10px', overflowX:'auto' }}>
                      {/* Header */}
                      <div style={{ display:'grid', gridTemplateColumns:gridCols, background:'rgba(0,0,0,0.5)', borderBottom:'1px solid rgba(255,255,255,0.06)', minWidth:'1100px' }}>
                        <div style={cell({ padding:'10px 4px', justifyContent:'center' })}></div>
                        <div style={cell({ padding:'10px 4px', justifyContent:'center' })}><input type="checkbox" style={{width:'13px',padding:0,margin:0}} /></div>
                        {COLS.map(col => (
                          <div key={col.label} style={{ ...cell(), fontSize:'11px', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase' as const, letterSpacing:'0.5px', whiteSpace:'nowrap' as const }}>
                            {col.label}
                          </div>
                        ))}
                        <div style={cell({ padding:'10px 4px' })}></div>
                      </div>
                      {/* Rows */}
                      {groupRows.map((req, idx) => {
                        const st = getStatusDisplay(req.status);
                        const pr = getPrioDisplay(req.priority ?? 'Medio');
                        const isDone = req.status === 'Publicado';
                        const over = isOverdue(req.deliveryDate) && !isDone;
                        const assignee = req.assignedTo || '';
                        const cronColor = isDone ? '#22c55e' : over ? '#ef4444' : '#60a5fa';
                        return (
                          <div key={req.id}
                            style={{ display:'grid', gridTemplateColumns:gridCols, minWidth:'1100px', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', borderLeft:`3px solid ${group.color}`, transition:'background 0.15s' }}
                            onClick={() => { setSelectedReq(req); setModalOpen(true); }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.025)'}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}
                          >
                            <div style={cell({ padding:'10px 4px', justifyContent:'center', fontSize:'11px', color:'rgba(255,255,255,0.2)' })}>{idx+1}</div>
                            <div style={cell({ padding:'10px 4px', justifyContent:'center' })} onClick={e=>e.stopPropagation()}>
                              <input type="checkbox" style={{width:'13px',padding:0,margin:0}} />
                            </div>
                            {/* Tarea */}
                            <div style={cell()}>
                              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:600, color:'var(--text-primary)', textDecoration:isDone?'line-through':'none', opacity:isDone?0.65:1 }}>
                                <span style={{color:'var(--accent-color)',marginRight:'6px',fontSize:'11px'}}>{req.id}</span>{req.title}
                              </span>
                            </div>
                            {/* Responsable */}
                            <div style={cell({ justifyContent:'center' })}>
                              {assignee ? (
                                <div title={assignee} style={{ width:'28px', height:'28px', borderRadius:'50%', background:avatarColor(assignee), display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:800, color:'#000', flexShrink:0 }}>
                                  {getInitials(assignee)}
                                </div>
                              ) : (
                                <div style={{ width:'28px', height:'28px', borderRadius:'50%', border:'1px dashed rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                  <User size={12} color="rgba(255,255,255,0.3)" />
                                </div>
                              )}
                            </div>
                            {/* Estado */}
                            <div style={cell()}>
                              <span style={{ padding:'4px 10px', borderRadius:'6px', fontSize:'11px', fontWeight:700, background:st.bg, color:st.color, whiteSpace:'nowrap' as const }}>{st.label}</span>
                            </div>
                            {/* Vencimiento */}
                            <div style={cell({ gap:'6px' })}>
                              {req.deliveryDate ? (
                                <>
                                  {isDone && <CheckCircle2 size={13} color="#22c55e" />}
                                  {over && <AlertCircle size={13} color="#ef4444" />}
                                  <span style={{ fontSize:'12px', color:isDone?'#22c55e':over?'#ef4444':'var(--text-secondary)', textDecoration:isDone?'line-through':'none' }}>{fmtDate(req.deliveryDate)}</span>
                                </>
                              ) : <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'12px' }}>—</span>}
                            </div>
                            {/* Prioridad */}
                            <div style={cell()}>
                              <span style={{ padding:'4px 10px', borderRadius:'6px', fontSize:'11px', fontWeight:700, background:pr.bg, color:pr.color }}>{pr.label}</span>
                            </div>
                            {/* Notas (copy truncado) */}
                            <div style={cell()}>
                              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'12px', color:'var(--text-secondary)' }}>{req.copy || '—'}</span>
                            </div>
                            {/* Archivos */}
                            <div style={cell({ justifyContent:'center', gap:'4px' })}>
                              {req.creatives.length > 0 ? (
                                <div style={{ display:'flex', alignItems:'center', gap:'4px', color:'var(--accent-color)' }}>
                                  <ImageIcon size={14} />
                                  <span style={{ fontSize:'11px', fontWeight:700 }}>{req.creatives.length}</span>
                                </div>
                              ) : <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.2)' }}>—</span>}
                            </div>
                            {/* Cronograma */}
                            <div style={cell()}>
                              {req.requestDate && req.deliveryDate ? (
                                <div style={{ padding:'3px 8px', borderRadius:'20px', fontSize:'11px', fontWeight:700, background:`${cronColor}22`, color:cronColor, border:`1px solid ${cronColor}44`, whiteSpace:'nowrap' as const, display:'flex', alignItems:'center', gap:'4px' }}>
                                  {isDone ? '✓' : over ? '!' : ''} {fmtDate(req.requestDate)} → {fmtDate(req.deliveryDate)}
                                </div>
                              ) : <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.2)' }}>—</span>}
                            </div>
                            {/* Última actualización */}
                            <div style={cell({ gap:'8px' })}>
                              {assignee && (
                                <div style={{ width:'20px', height:'20px', borderRadius:'50%', background:avatarColor(assignee), display:'flex', alignItems:'center', justifyContent:'center', fontSize:'9px', fontWeight:800, color:'#000', flexShrink:0 }}>
                                  {getInitials(assignee)}
                                </div>
                              )}
                              <span style={{ fontSize:'11px', color:'var(--text-secondary)' }}>{fmtRelative(req.requestDate)}</span>
                            </div>
                            {/* More */}
                            <div style={cell({ padding:'10px 4px', justifyContent:'center' })} onClick={e=>e.stopPropagation()}>
                              <MoreHorizontal size={14} color="rgba(255,255,255,0.3)" style={{ cursor:'pointer' }} />
                            </div>
                          </div>
                        );
                      })}
                      {/* Agregar tarea */}
                      {(role === 'admin' || role === 'cm') && (
                        <div style={{ display:'grid', gridTemplateColumns:gridCols, minWidth:'1100px', borderBottom:'1px solid rgba(255,255,255,0.04)', borderLeft:`3px solid ${group.color}`, cursor:'pointer' }}
                          onClick={() => setCreateModalOpen(true)}>
                          <div style={cell({ padding:'10px 4px' })}></div>
                          <div style={cell({ padding:'10px 4px' })}></div>
                          <div style={{ ...cell({ color:'var(--accent-color)', gap:'6px' }), gridColumn:'span 9' }}>
                            <Plus size={14} /> <span style={{ fontSize:'13px' }}>Agregar tarea</span>
                          </div>
                        </div>
                      )}
                      {/* Summary row */}
                      <div style={{ display:'grid', gridTemplateColumns:gridCols, minWidth:'1100px', background:'rgba(0,0,0,0.3)', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                        <div style={cell({ padding:'8px 4px' })}></div>
                        <div style={cell({ padding:'8px 4px' })}></div>
                        <div style={cell({ padding:'8px 12px' })}></div>
                        <div style={cell({ justifyContent:'center' })}></div>
                        <div style={cell({ justifyContent:'center', gap:'3px' })}>
                          {(['Pendiente','En Proceso','Planeando','Publicado','Denegado'] as RequestStatus[]).filter(s => groupRows.some(r => r.status === s)).map(s => (
                            <div key={s} style={{ width:'12px', height:'12px', borderRadius:'3px', background:STATUS_COLORS[s], border:`1px solid ${STATUS_TEXT_COLORS[s]}` }}></div>
                          ))}
                        </div>
                        <div style={cell({ padding:'8px 12px' })}>
                          {groupRows.length > 0 && groupRows[0].deliveryDate && (
                            <span style={{ padding:'3px 8px', borderRadius:'12px', fontSize:'10px', fontWeight:700, background:'rgba(96,165,250,0.2)', color:'#60a5fa', whiteSpace:'nowrap' as const }}>
                              {fmtDate(groupRows[0].deliveryDate)}
                            </span>
                          )}
                        </div>
                        <div style={cell({ justifyContent:'center', gap:'3px' })}>
                          {(['Bajo','Medio','Alto'] as RequestPriority[]).filter(p => groupRows.some(r => (r.priority??'Medio') === p)).map(p => (
                            <div key={p} style={{ width:'12px', height:'12px', borderRadius:'3px', background:PRIORITY_CONFIG[p].bg, border:`1px solid ${PRIORITY_CONFIG[p].text}` }}></div>
                          ))}
                        </div>
                        <div style={cell()}></div>
                        <div style={cell({ justifyContent:'center', fontSize:'11px', color:'var(--text-secondary)' })}>
                          {groupRows.reduce((a,r) => a + r.creatives.length, 0)} archivos
                        </div>
                        <div style={cell()}>
                          {(() => {
                            const withDates = groupRows.filter(r => r.requestDate && r.deliveryDate);
                            if (!withDates.length) return null;
                            const earliest = withDates.reduce((a,b) => a.requestDate < b.requestDate ? a : b).requestDate;
                            const latest = withDates.reduce((a,b) => a.deliveryDate > b.deliveryDate ? a : b).deliveryDate;
                            return (
                              <div style={{ padding:'3px 8px', borderRadius:'12px', fontSize:'10px', fontWeight:700, background:`${group.color}22`, color:group.color, border:`1px solid ${group.color}44`, whiteSpace:'nowrap' as const }}>
                                {fmtDate(earliest)} → {fmtDate(latest)}
                              </div>
                            );
                          })()}
                        </div>
                        <div style={cell()}></div>
                        <div style={cell()}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <button className="btn btn-secondary" style={{ marginTop:'8px', fontSize:'12px', padding:'10px 16px', opacity: 0.5, cursor: 'not-allowed' }} title="Próximamente" onClick={() => addToast("Función disponible próximamente.", 'info')}>
                <Plus size={14} /> Agregar grupo nuevo
              </button>
            </div>
          );
        })()}
      </div>

      {/* AI ASSISTANT CHAT */}
      {role === 'designer' && (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 90 }}>
          {!chatOpen ? (
            <button aria-label="Abrir chat IA Andromeda" onClick={() => setChatOpen(true)} className="btn" style={{ borderRadius: '50%', width: '65px', height: '65px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Bot size={35} />
            </button>
          ) : (
            <div className="glass-panel" style={{ width: '400px', height: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--accent-color)', boxShadow: '0 0 40px rgba(0,0,0,0.8)' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Bot color="var(--accent-color)" size={24} /> <strong>IA Andromeda</strong></div>
                <button aria-label="Cerrar chat" onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center', padding: 0 }}><X size={20} /></button>
              </div>
              <div ref={scrollRef} style={{ flexGrow: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '12px 16px', borderRadius: '16px', background: msg.role === 'user' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0,0,0,0.5)', border: `1px solid ${msg.role === 'user' ? 'var(--accent-color)' : 'var(--border-color)'}` }}>
                    {Array.isArray(msg.content) ? (
                      <div>
                        {msg.content.map((c:any, idx:number) => c.type === 'text' ? <p key={idx}>{c.text}</p> : <img key={idx} src={c.image_url.url} alt="Imagen adjunta al chat" style={{ width: '100%', borderRadius: '8px', marginTop: '10px' }} /> )}
                      </div>
                    ) : msg.content}
                  </div>
                ))}
              </div>
              {chatImage && <div style={{ padding: '10px', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={chatImage} alt="Vista previa de imagen adjunta" style={{ height: '40px', borderRadius: '4px' }} /> <span style={{ fontSize: '12px' }}>Imagen cargada...</span> <X size={16} onClick={()=>setChatImage(null)} style={{cursor:'pointer'}} />
              </div>}
              <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px' }}>
                <label aria-label="Adjuntar imagen al chat" style={{ cursor: 'pointer', color: 'var(--accent-color)' }}><ImageIcon size={24} /><input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleChatImageUpload} /></label>
                <input type="text" value={chatInput} onChange={(e)=>setChatInput(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&sendChatMessage()} placeholder="Pregunta o sube diseño..." style={{ flexGrow: 1 }} />
                <button onClick={sendChatMessage} className="btn" style={{ padding: '10px' }}><Send size={18} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE MODAL */}
      {createModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
           <div className="glass-panel" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '40px', border: '1px solid var(--accent-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '28px', margin: 0 }}>Generar Solicitud</h2>
                <X size={24} style={{ cursor: 'pointer', color: 'var(--danger)' }} onClick={() => setCreateModalOpen(false)} />
              </div>
              <form onSubmit={handleCreateRequest}>
                <div className="form-group">
                  <label className="label">Título del Creativo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '18px' }}>{getNextId()}</span>
                    <input type="text" placeholder="Escribe un nombre para este proyecto..." value={titleStr} onChange={(e) => setTitleStr(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group"><label className="label">Copy / Instrucción Principal</label><textarea rows={3} value={copyStr} onChange={(e) => setCopyStr(e.target.value)} required /></div>
                <div className="form-group"><label className="label">Países Destino</label><div style={{ display: 'flex', gap: '15px' }}>{["El Salvador", "Guatemala"].map(country => (<label key={country} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'rgba(0,0,0,0.4)', padding: '10px 16px', borderRadius: '10px', border: countries.includes(country) ? '1px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.1)' }}><input type="checkbox" checked={countries.includes(country)} onChange={() => toggleSelection(setCountries, countries, country)} style={{ width: 'auto', padding: 0 }} />{country}</label>))}</div></div>
                <div className="form-group">
                  <label className="label">Dimensiones (Se activarán en la subida)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {[
                      { key: "1080x1080",  label: "1080×1080",     sub: "Feed cuadrado" },
                      { key: "Historia",   label: "Historia",       sub: "9:16 vertical" },
                      { key: "General",    label: "General",        sub: "Formato libre" },
                      { key: "Banner Web", label: "Banner Web",     sub: "728×90" },
                      { key: "Display",    label: "Display",        sub: "300×250" },
                      { key: "Hero Web",   label: "Hero Web",       sub: "1920×1080" },
                      { key: "Half Page",  label: "Half Page",      sub: "300×600" },
                    ].map(({ key, label, sub }) => (
                      <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: '2px', cursor: 'pointer', background: 'rgba(0,0,0,0.4)', padding: '10px 14px', borderRadius: '10px', border: dimensions.includes(key) ? '1px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.1)', minWidth: '110px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="checkbox" checked={dimensions.includes(key)} onChange={() => toggleSelection(setDimensions, dimensions, key)} style={{ width: 'auto', padding: 0 }} />
                          <span style={{ fontWeight: 700, fontSize: '13px' }}>{label}</span>
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', paddingLeft: '20px' }}>{sub}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Prioridad</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {(["Bajo", "Medio", "Alto"] as RequestPriority[]).map(p => (
                      <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: priority === p ? priorityConfig[p].bg : 'rgba(0,0,0,0.4)', padding: '10px 20px', borderRadius: '10px', border: `1px solid ${priority === p ? priorityConfig[p].text : 'rgba(255,255,255,0.1)'}`, color: priority === p ? priorityConfig[p].text : 'var(--text-secondary)', fontWeight: priority === p ? 700 : 500, transition: 'all 0.2s' }}>
                        <input type="radio" name="priority" value={p} checked={priority === p} onChange={() => setPriority(p)} style={{ display: 'none' }} />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Imagen de Referencia (Opcional)</label>
                  <label style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '12px', 
                    padding: '30px', 
                    background: 'rgba(0,0,0,0.4)', 
                    borderRadius: '16px', 
                    border: '2px dashed var(--accent-color)', 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {referenceImg ? (
                      <>
                        <img src={referenceImg} style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px' }} alt="Referencia" />
                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.8)', padding: '5px', borderRadius: '50%', cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); setReferenceImg(undefined); }}>
                          <X size={16} color="white" />
                        </div>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={40} color="var(--accent-color)" style={{ opacity: 0.7 }} />
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Sube una imagen de referencia</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>JPG, PNG o GIF (Máx 5MB)</div>
                        </div>
                      </>
                    )}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleRefUpload} />
                  </label>
                </div>

                {/* Formato + Fecha de entrega */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                  <div className="form-group">
                    <label className="label">Tipo / Formato</label>
                    <select value={format} onChange={(e) => setFormat(e.target.value)}>
                      <option value="static">🖼️ Estático</option>
                      <option value="video">🎬 Video</option>
                      <option value="gif">✨ Animado (GIF)</option>
                      <option value="carousel">🔄 Carrusel</option>
                      <option value="banner">📐 Banner Web</option>
                      <option value="display">🖥️ Display / Rich Media</option>
                      <option value="email">📧 Email Marketing</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">Fecha de Entrega al diseñador</label>
                    <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} required />
                  </div>
                </div>

                <button type="submit" className="btn" style={{ width: "100%", marginTop: "20px", padding: "18px" }}>✦ Crear y Asignar Solicitud</button>
              </form>
           </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {modalOpen && selectedReq && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '1100px', maxHeight: '95vh', overflowY: 'auto', position: 'relative', border: '1px solid var(--accent-color)' }}>
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--panel-bg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 30px', backdropFilter:'blur(20px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth:0 }}>
                <Maximize2 size={16} color="var(--text-secondary)" style={{flexShrink:0}} />
                <span style={{ fontWeight:700, fontSize:'15px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  <span style={{ color:'var(--accent-color)', marginRight:'8px', fontSize:'12px', fontWeight:800 }}>{selectedReq.id}</span>
                  {selectedReq.title}
                </span>
                {/* Format pill */}
                <span className={`fmt-pill fmt-${selectedReq.format ?? 'static'}`} style={{flexShrink:0}}>
                  {selectedReq.format === 'video' ? '🎬 Video' : selectedReq.format === 'gif' ? '✨ GIF' : selectedReq.format === 'carousel' ? '🔄 Carrusel' : selectedReq.format === 'banner' ? '📐 Banner Web' : selectedReq.format === 'display' ? '🖥️ Display' : selectedReq.format === 'email' ? '📧 Email' : '🖼️ Estático'}
                </span>
              </div>
              <X size={22} onClick={() => setModalOpen(false)} style={{ cursor: 'pointer', color:'var(--text-secondary)', flexShrink:0 }} />
            </div>

            <div style={{ padding: '40px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap' }}>
                {role === 'designer' ? (
                  <select value={selectedReq.status} onChange={handleChangeStatus} style={{ background: STATUS_COLORS[selectedReq.status], color: STATUS_TEXT_COLORS[selectedReq.status], fontWeight: 'bold', padding: '10px', borderRadius: '8px', border: `1px solid ${STATUS_TEXT_COLORS[selectedReq.status]}`, cursor: 'pointer' }}>
                    {["Publicado", "Denegado", "En Proceso", "Planeando", "Pendiente"].map(st => <option key={st} value={st} style={{ background: '#000', color: '#fff' }}>{st}</option>)}
                  </select>
                ) : (
                  <span style={{ padding: '10px 20px', borderRadius: '8px', background: STATUS_COLORS[selectedReq.status], color: STATUS_TEXT_COLORS[selectedReq.status], fontWeight: 700, border: `1px solid ${STATUS_TEXT_COLORS[selectedReq.status]}`, fontSize: '14px' }}>
                    Estado: {selectedReq.status}
                  </span>
                )}

                {(role === 'admin' || role === 'cm') ? (
                  <select value={selectedReq.priority ?? 'Medio'} onChange={handleChangePriority} style={{ background: priorityConfig[selectedReq.priority ?? 'Medio'].bg, color: priorityConfig[selectedReq.priority ?? 'Medio'].text, fontWeight: 'bold', padding: '10px', borderRadius: '8px', border: `1px solid ${priorityConfig[selectedReq.priority ?? 'Medio'].text}` }}>
                    {(["Bajo", "Medio", "Alto"] as RequestPriority[]).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                ) : (
                  <span style={{ padding: '8px 14px', borderRadius: '8px', background: priorityConfig[selectedReq.priority ?? 'Medio'].bg, color: priorityConfig[selectedReq.priority ?? 'Medio'].text, fontWeight: 700, border: `1px solid ${priorityConfig[selectedReq.priority ?? 'Medio'].text}`, fontSize: '14px' }}>
                    Prioridad: {selectedReq.priority ?? 'Medio'}
                  </span>
                )}

                {role === 'designer' && !selectedReq.assignedTo && (
                  <button className="btn" onClick={() => handleAssignToMe(selectedReq)} style={{ padding: '10px 20px' }}>
                    Asignarme esta solicitud
                  </button>
                )}
                {selectedReq.assignedTo && (
                  <span style={{ fontSize: '14px', color: 'var(--accent-color)', fontWeight: 600 }}>
                    <User size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Encargado: {selectedReq.assignedTo}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '16px' }}>
                  <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px', display:'flex', alignItems:'center', gap:'8px' }}>
                    <FileText size={16} color="var(--accent-color)" /> Instrucciones del Trafficker
                  </h3>
                  {/* Meta chips row */}
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px' }}>
                    <span style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700, background:'rgba(34,197,94,0.1)', color:'var(--accent-color)', border:'1px solid rgba(34,197,94,0.2)' }}>
                      📅 Entrega: {selectedReq.deliveryDate || '—'}
                    </span>
                    {(selectedReq as any).postPublishDate && (
                      <span style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700, background:'rgba(244,114,182,0.12)', color:'#f472b6', border:'1px solid rgba(244,114,182,0.3)' }}>
                        📲 Publicación: {(selectedReq as any).postPublishDate}
                      </span>
                    )}
                    <span style={{ padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700, background:'rgba(255,255,255,0.05)', color:'var(--text-secondary)', border:'1px solid rgba(255,255,255,0.08)' }}>
                      🌎 {selectedReq.countries.join(' · ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background:'rgba(255,255,255,0.03)', padding:'12px 14px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize:'10px', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'6px' }}>Copy / Instrucción</div>
                      <p style={{ margin: 0, fontSize:'14px', lineHeight:1.6 }}>{selectedReq.copy}</p>
                    </div>
                    <div style={{ background:'rgba(255,255,255,0.03)', padding:'12px 14px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize:'10px', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'6px' }}>Dimensiones</div>
                      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                        {selectedReq.dimensions.map(d => (
                          <span key={d} style={{ padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700, background:'rgba(34,197,94,0.1)', color:'var(--accent-color)', border:'1px solid rgba(34,197,94,0.2)' }}>{d}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {selectedReq.referenceImage && (
                    <div style={{ marginTop: '16px' }}>
                      <p style={{ marginBottom: '10px', fontSize:'12px', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'1px' }}>Imagen de Referencia</p>
                      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.5)', padding: '10px' }}>
                        <img 
                          src={selectedReq.referenceImage} 
                          style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', cursor: 'pointer', borderRadius: '8px' }} 
                          alt="Referencia Visual"
                          onClick={() => window.open(selectedReq.referenceImage, '_blank')}
                        />
                        <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.6)', padding: '6px', borderRadius: '8px', backdropFilter: 'blur(4px)', color: 'var(--accent-color)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ImageIcon size={14} /> CLICK PARA AMPLIAR
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                   <h3 style={{ marginBottom: '20px' }}>Piezas Finales (Máx 3)</h3>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                     {["1080x1080", "Historia", "General", "Banner Web", "Display", "Hero Web", "Half Page"].filter(d => selectedReq.dimensions.includes(d)).map(dim => {
                       const creative = selectedReq.creatives.find(c => c.type === dim);
                       return (
                         <div key={dim} style={{ border: '1px dashed var(--border-color)', padding: '20px', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <strong>Formato: {dim}</strong>
                              {creative && creative.aiEvaluation && <span className={`badge badge-${creative.aiEvaluation.color}`}>PUNTAJE: {creative.aiEvaluation.rating}/10</span>}
                            </div>
                            {creative ? (
                              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                                <img src={creative.url} alt={`Arte final ${dim}`} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                                <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-secondary)' }}>{creative.aiEvaluation?.explanation}</div>
                                <div style={{ display:'flex', flexDirection:'column', gap:'8px', flexShrink:0 }}>
                                  {role === 'admin' && (
                                    <button
                                      className="btn btn-secondary"
                                      style={{ padding: '8px 14px', fontSize: '12px' }}
                                      onClick={() => handleDownload(creative, selectedReq.id, dim)}
                                    >
                                      <Download size={14} /> Descargar
                                    </button>
                                  )}
                                  {role === 'designer' && (
                                    <button
                                      className="btn btn-secondary"
                                      style={{ padding: '8px 14px', fontSize: '12px', borderColor: '#ef4444', color: '#ef4444' }}
                                      onClick={() => handleDeleteCreative(selectedReq.id, dim)}
                                    >
                                      <Trash2 size={14} /> Eliminar
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              role === 'designer' && (
                                <label className="btn btn-secondary" style={{ width: '100%', cursor: 'pointer', textAlign: 'center' }}>
                                  Subir {dim}
                                  <input type="file" accept="image/*" onChange={(e)=>handleDesignerUpload(e, dim)} style={{ display: 'none' }} />
                                </label>
                              )
                            )}
                         </div>
                       );
                     })}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {loading && <div className="loading-overlay"><div className="loader"></div><p>Procesando...</p></div>}

      {/* TOAST NOTIFICATIONS */}
      {toasts.length > 0 && (
        <div style={{ position:'fixed', bottom:'28px', left:'50%', transform:'translateX(-50%)', zIndex:300, display:'flex', flexDirection:'column', gap:'8px', alignItems:'center', pointerEvents:'none' }}>
          {toasts.map(t => (
            <div key={t.id} style={{
              padding:'12px 22px', borderRadius:'14px', fontSize:'13px', fontWeight:700,
              background: t.type === 'success' ? 'rgba(34,197,94,0.95)' : t.type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(20,20,20,0.95)',
              color:'#fff', backdropFilter:'blur(12px)',
              border: `1px solid ${t.type === 'success' ? 'rgba(34,197,94,0.5)' : t.type === 'error' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
              boxShadow:'0 8px 30px rgba(0,0,0,0.5)',
              whiteSpace:'nowrap'
            }}>
              {t.type === 'success' ? '✓ ' : t.type === 'error' ? '✕ ' : 'ℹ '}{t.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
