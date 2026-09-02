"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Sparkles, Send, X, Bot, User, ShoppingCart, 
  ArrowRight, Check, Copy, Box, ExternalLink, Loader2,
  RefreshCw, MessageSquare, ChevronDown, ChevronRight,
  Maximize2, Minimize2, Trash2, PlusCircle, Paperclip,
  Mic, MicOff, Volume2, Download, ThumbsUp, ThumbsDown,
  FileText, CornerDownRight, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TableRow {
  id: string;
  name: string;
  model: string;
  brand: string;
  spec: string;
  price: string;
  stock: string;
  image?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  reasoning?: string;
  catalogoBadges?: string[];
  tableData?: TableRow[];
  bullets?: string[];
  suggestedActions?: string[];
  products?: Product[];
  timestamp: Date;
}

const QUICK_EXAMPLES = [
  "¿Cuál es el correo de mi ejecutivo?",
  "Necesito buscar discos duros de 500GB o SSD",
  "Cámara domo para exterior con visión nocturna resistente a lluvia",
  "Kit de paneles solares para casa de campo con inversor",
  "Switch PoE administrable de 24 puertos para videovigilancia",
  "Terminal de control de acceso con reconocimiento facial"
];

interface BorarlyAIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BorarlyAIChatModal({ isOpen, onClose }: BorarlyAIChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [openReasoningIds, setOpenReasoningIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const { addToCart } = useCart();
  const { toast } = useToast();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, loading]);

  // Voice speech setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.lang = 'es-MX';
        rec.onstart = () => setIsListening(true);
        rec.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript;
          if (transcript) {
            setInput(transcript);
            handleSendMessage(transcript);
          }
        };
        rec.onerror = () => setIsListening(false);
        rec.onend = () => setIsListening(false);
        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      toast({ title: "Reconocimiento de voz", description: "No disponible en tu navegador." });
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      if (res.ok) {
        const data = await res.json();
        const msgId = String(Date.now() + 1);
        const botMsg: ChatMessage = {
          id: msgId,
          sender: 'bot',
          text: data.reply || '',
          reasoning: data.reasoning,
          catalogoBadges: data.catalogoBadges || [],
          tableData: data.tableData || [],
          bullets: data.bullets || [],
          suggestedActions: data.suggestedActions || [],
          products: data.products || [],
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: String(Date.now() + 1),
            sender: 'bot',
            text: 'Disculpa, no pude consultar el catálogo de Syscom en este momento. Por favor reintenta tu consulta.',
            timestamp: new Date()
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleReasoning = (id: string) => {
    setOpenReasoningIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: "Copiado al portapapeles" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-MX';
      window.speechSynthesis.speak(utterance);
    }
  };

  // El texto viene del catalogo, asi que se escapa antes de convertir **negritas** a HTML.
  const renderBoldMarkup = (text: string) => {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  const handleAddToCartDirect = (product: Product) => {
    addToCart(product, 1);
    toast({
      title: "Agregado al carrito",
      description: `${product.name} fue añadido a tu pedido.`
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-start bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in">
      
      {/* Backdrop Click para cerrar */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* PANEL LATERAL DRAWER (SYSCOM AGENTE AI STYLE) */}
      <div className={cn(
        "relative z-10 h-full bg-white dark:bg-[#0b0f19] text-zinc-900 dark:text-zinc-100 flex flex-col shadow-2xl transition-all duration-300 border-r border-zinc-200 dark:border-zinc-800",
        isExpanded ? "w-full max-w-4xl" : "w-full max-w-[540px]"
      )}>
        
        {/* 1. ENCABEZADO SUPERIOR */}
        <div className="h-14 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/80 dark:bg-[#080c14]/80 backdrop-blur-md">
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                BORARLY Agente AI
              </span>

              {/* Selector de Agente */}
              <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-200/70 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-700 select-none">
                <MessageSquare className="w-3 h-3 text-blue-500" />
                <span>Agente Experto</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </div>
            </div>
          </div>

          {/* Acciones de Cabecera */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMessages([])}
              title="Limpiar conversación"
              className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Reducir" : "Expandir pantalla"}
              className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => {
                setMessages([]);
                setInput('');
                inputRef.current?.focus();
              }}
              title="Nueva consulta"
              className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. ÁREA DE MENSAJES Y CONVERSACIÓN */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-sm">
          
          {/* ESTADO INICIAL / BIENVENIDA (SCREENSHOT 1) */}
          {messages.length === 0 && (
            <div className="py-8 space-y-6 animate-in fade-in">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
                  ¿En qué puedo ayudarte?
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Prueba con un ejemplo o describe tu proyecto en lenguaje natural:
                </p>
              </div>

              {/* Lista de Ejemplos Rápidos */}
              <div className="space-y-2">
                {QUICK_EXAMPLES.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(example)}
                    className="w-full text-left p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 hover:bg-blue-50/50 dark:bg-zinc-900/50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700/50 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-all flex items-center justify-between group"
                  >
                    <span>{example}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* HISTORIAL DE MENSAJES (SCREENSHOT 2) */}
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-3">
              
              {/* Mensaje de Usuario */}
              {msg.sender === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-[85%] bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl rounded-tr-xs px-4 py-2.5 text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {msg.text}
                  </div>
                </div>
              ) : (
                
                /* Mensaje del Bot Agente AI */
                <div className="space-y-3">
                  
                  {/* Badge de Categoría */}
                  <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-500">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    <span>General</span>
                  </div>

                  {/* Acordeón de Razonamiento */}
                  {msg.reasoning && (
                    <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 overflow-hidden text-xs">
                      <button
                        onClick={() => toggleReasoning(msg.id)}
                        className="w-full px-3 py-2 flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Razonamiento</span>
                          <span className="text-[10px] opacity-70 font-normal">
                            {openReasoningIds[msg.id] ? 'ocultar' : 'ver'}
                          </span>
                        </div>
                        {openReasoningIds[msg.id] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>

                      {openReasoningIds[msg.id] && (
                        <div className="p-3 pt-1 text-[11px] text-zinc-600 dark:text-zinc-400 whitespace-pre-line border-t border-blue-100 dark:border-blue-900/40 font-mono">
                          {msg.reasoning}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Badges de Catálogo Consultado */}
                  {msg.catalogoBadges && msg.catalogoBadges.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {msg.catalogoBadges.map((badge, bIdx) => (
                        <div key={bIdx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{badge}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Texto de Respuesta Conversacional */}
                  <div className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                    {msg.text}
                  </div>

                  {/* TABLA COMPARATIVA ENRIQUECIDA (EXACTO A SYSCOM AGENTE AI) */}
                  {msg.tableData && msg.tableData.length > 0 && (
                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d1322] overflow-hidden shadow-xs space-y-0">
                      
                      {/* Cabecera de Tabla con Acciones */}
                      <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-bold text-zinc-500">
                        <span>Comparativa Técnica</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyText(JSON.stringify(msg.tableData, null, 2), `table-${msg.id}`)}
                            title="Copiar datos de tabla"
                            className="p-1 hover:text-zinc-900 dark:hover:text-white"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Contenedor Scroll de Tabla */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50 text-[11px] font-black uppercase text-zinc-500 tracking-wider">
                              <th className="py-2.5 px-3">Producto</th>
                              <th className="py-2.5 px-3">Capacidad / Specs</th>
                              <th className="py-2.5 px-3">Marca / Modelo</th>
                              <th className="py-2.5 px-3 text-right">Precio IVA inc.</th>
                              <th className="py-2.5 px-3 text-center">Stock</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {msg.tableData.map((row) => (
                              <tr key={row.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors">
                                <td className="py-2.5 px-3 font-bold text-blue-600 dark:text-cyan-400">
                                  <Link href={`/products/${row.id}`} className="hover:underline flex items-center gap-1.5">
                                    <Box className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    <span>{row.name.substring(0, 32)}...</span>
                                  </Link>
                                </td>
                                <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">
                                  {row.spec}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-zinc-800 dark:text-zinc-200 font-mono text-[11px]">
                                  {row.model} ({row.brand})
                                </td>
                                <td className="py-2.5 px-3 text-right font-black text-zinc-900 dark:text-white">
                                  {row.price}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                    {row.stock}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Bullet Points con Explicación de Escenarios */}
                  {msg.bullets && msg.bullets.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {msg.bullets.map((b, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                          <CornerDownRight className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <div dangerouslySetInnerHTML={{ __html: renderBoldMarkup(b) }} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* PREGUNTAS Y ACCIONES SUGERIDAS (PILL BUTTONS) */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {msg.suggestedActions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => {
                            if (action.includes('carrito') && msg.products && msg.products.length > 0) {
                              handleAddToCartDirect(msg.products[0]);
                            } else {
                              handleSendMessage(action.replace('↗', '').replace('🛒', '').trim());
                            }
                          }}
                          className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/30 dark:hover:border-blue-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-all flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>{action}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* BARRA DE ACCIONES Y FEEDBACK */}
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-zinc-400 text-xs">
                    <button
                      onClick={() => handleCopyText(msg.text, msg.id)}
                      className="p-1.5 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedId === msg.id ? 'Copiado' : 'Copiar'}</span>
                    </button>

                    <button
                      onClick={() => handleSpeakText(msg.text)}
                      className="p-1.5 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Escuchar</span>
                    </button>

                    <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

                    <button className="p-1.5 hover:text-emerald-500" title="Útil">
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button className="p-1.5 hover:text-red-500" title="No relevante">
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>

                </div>
              )}
            </div>
          ))}

          {/* Estado de Carga con Animación */}
          {loading && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-blue-600 dark:text-cyan-400 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Consultando base de datos semántica Syscom y analizando catálogo...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 3. BARRA INFERIOR DE ENTRADA (SCREENSHOT 1 & 2) */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-[#080c14]/80 backdrop-blur-md shrink-0 space-y-2">
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex items-center w-full rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xs focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Pregúntame sobre productos, tecnología o BORARLY..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full py-3.5 pl-4 pr-24 text-xs sm:text-sm bg-transparent outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400"
            />

            {/* Botones laterales de entrada: Adjuntar, Voz, Enviar */}
            <div className="absolute right-2 flex items-center gap-1 text-zinc-400">
              <button
                type="button"
                onClick={toggleVoice}
                title="Dictar por voz"
                className={cn(
                  "p-1.5 rounded-full hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors",
                  isListening && "text-red-500 bg-red-50 animate-pulse"
                )}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Disclaimer al pie */}
          <p className="text-[10px] text-center text-zinc-400 select-none">
            Puede cometer errores. Verifica información técnica importante con un asesor.
          </p>

        </div>

      </div>

    </div>
  );
}
