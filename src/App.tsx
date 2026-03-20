import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Heart, 
  Calendar, 
  MessageCircle, 
  History, 
  Dog, 
  Cat, 
  Turtle,
  Bug,
  ChevronRight,
  Stethoscope,
  Trash2,
  X,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, differenceInYears, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenAI } from "@google/genai";
import { Pet, Treatment, ChatMessage, PetType } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_PETS: Pet[] = [];

export default function App() {
  const [pets, setPets] = useState<Pet[]>(() => {
    const saved = localStorage.getItem('medoc_pets');
    return saved ? JSON.parse(saved) : INITIAL_PETS;
  });
  const [selectedPetId, setSelectedPetId] = useState<string | null>(pets[0]?.id || null);
  const [isAddingPet, setIsAddingPet] = useState(false);
  const [isAddingTreatment, setIsAddingTreatment] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    localStorage.setItem('medoc_pets', JSON.stringify(pets));
  }, [pets]);

  const selectedPet = pets.find(p => p.id === selectedPetId);

  const addPet = (newPet: Omit<Pet, 'id' | 'treatments'>) => {
    const pet: Pet = {
      ...newPet,
      id: crypto.randomUUID(),
      treatments: []
    };
    setPets([...pets, pet]);
    setSelectedPetId(pet.id);
    setIsAddingPet(false);
  };

  const deletePet = (id: string) => {
    const updated = pets.filter(p => p.id !== id);
    setPets(updated);
    if (selectedPetId === id) {
      setSelectedPetId(updated[0]?.id || null);
    }
  };

  const addTreatment = (petId: string, treatment: Omit<Treatment, 'id'>) => {
    setPets(pets.map(p => {
      if (p.id === petId) {
        return {
          ...p,
          treatments: [
            { ...treatment, id: crypto.randomUUID() },
            ...p.treatments
          ]
        };
      }
      return p;
    }));
    setIsAddingTreatment(false);
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const model = "gemini-3-flash-preview";
      
      const petContext = selectedPet 
        ? `L'utilisateur a un ${selectedPet.type} nommé ${selectedPet.name}, de race ${selectedPet.breed}, né le ${selectedPet.birthDate}.`
        : "L'utilisateur n'a pas encore sélectionné d'animal.";

      const response = await ai.models.generateContent({
        model,
        contents: [
          { role: 'user', parts: [{ text: `Tu es Médoc, un assistant vétérinaire expert. ${petContext} Réponds de manière empathique et professionnelle en français. Si c'est urgent, conseille toujours de voir un vétérinaire physique. Question: ${currentInput}` }] }
        ],
      });

      const aiMsg: ChatMessage = { role: 'model', text: response.text || "Désolé, je n'ai pas pu répondre." };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, { role: 'model', text: "Une erreur est survenue lors de la connexion à Médoc AI." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Stethoscope size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Médoc</h1>
        </div>
        <button 
          onClick={() => setIsAddingPet(true)}
          className="bg-stone-900 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-stone-800 transition-colors"
        >
          <Plus size={18} />
          <span>Ajouter un animal</span>
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Pet List */}
        <aside className="lg:col-span-3 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-stone-400 px-2">Mes Compagnons</h2>
          <div className="space-y-2">
            {pets.map(pet => (
              <button
                key={pet.id}
                onClick={() => setSelectedPetId(pet.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 group",
                  selectedPetId === pet.id 
                    ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200" 
                    : "hover:bg-stone-100 text-stone-600"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  selectedPetId === pet.id ? "bg-emerald-200" : "bg-stone-200"
                )}>
                  {pet.type === 'dog' && <Dog size={24} />}
                  {pet.type === 'cat' && <Cat size={24} />}
                  {pet.type === 'turtle' && <Turtle size={24} />}
                  {pet.type === 'snake' && <Bug size={24} />}
                  {['rabbit', 'bird', 'other'].includes(pet.type) && <Heart size={20} />}
                </div>
                <div className="text-left overflow-hidden">
                  <p className="font-semibold truncate">{pet.name}</p>
                  <p className="text-xs opacity-70 truncate">{pet.breed}</p>
                </div>
                {selectedPetId === pet.id && (
                  <ChevronRight size={16} className="ml-auto text-emerald-600" />
                )}
              </button>
            ))}
            {pets.length === 0 && (
              <div className="text-center py-8 px-4 border-2 border-dashed border-stone-200 rounded-2xl">
                <p className="text-sm text-stone-400">Aucun animal enregistré</p>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content: Pet Details */}
        <section className="lg:col-span-9 space-y-8">
          {selectedPet ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={selectedPet.id}
              className="space-y-8"
            >
              {/* Pet Hero Card */}
              <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <button 
                    onClick={() => deletePet(selectedPet.id)}
                    className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                    title="Supprimer l'animal"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-32 h-32 bg-stone-100 rounded-3xl flex items-center justify-center shrink-0 border-4 border-white shadow-inner">
                    {selectedPet.type === 'dog' && <Dog size={64} className="text-stone-400" />}
                    {selectedPet.type === 'cat' && <Cat size={64} className="text-stone-400" />}
                    {selectedPet.type === 'turtle' && <Turtle size={64} className="text-stone-400" />}
                    {selectedPet.type === 'snake' && <Bug size={64} className="text-stone-400" />}
                    {['rabbit', 'bird', 'other'].includes(selectedPet.type) && <Heart size={48} className="text-stone-400" />}
                  </div>
                  <div className="space-y-4 flex-1">
                    <div>
                      <h2 className="text-4xl font-bold text-stone-900">{selectedPet.name}</h2>
                      <p className="text-stone-500 font-medium">{selectedPet.breed} • {differenceInYears(new Date(), parseISO(selectedPet.birthDate))} ans</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100">
                        <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-1">Poids</p>
                        <p className="font-semibold">{selectedPet.weight} kg</p>
                      </div>
                      <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100">
                        <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-1">Dernier Soin</p>
                        <p className="font-semibold">{selectedPet.treatments[0]?.type || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Treatments Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <History size={20} className="text-emerald-600" />
                    Carnet de Santé
                  </h3>
                  <button 
                    onClick={() => setIsAddingTreatment(true)}
                    className="text-emerald-600 text-sm font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Nouveau soin
                  </button>
                </div>
                
                <div className="grid gap-4">
                  {selectedPet.treatments.map(t => (
                    <div key={t.id} className="bg-white p-5 rounded-2xl border border-stone-200 flex items-start gap-4 hover:border-emerald-200 transition-colors">
                      <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                        <Heart size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-stone-900">{t.type}</h4>
                          <span className="text-xs text-stone-400 font-medium">{format(parseISO(t.date), 'dd MMM yyyy', { locale: fr })}</span>
                        </div>
                        <p className="text-sm text-stone-600 mt-1 leading-relaxed">{t.description}</p>
                        {t.nextReminder && (
                          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 w-fit px-2 py-1 rounded-md">
                            <Calendar size={12} />
                            Rappel : {format(parseISO(t.nextReminder), 'dd MMMM yyyy', { locale: fr })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {selectedPet.treatments.length === 0 && (
                    <div className="text-center py-12 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">
                      <p className="text-stone-400">Aucun historique médical pour le moment.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center text-stone-300">
                <Dog size={48} />
              </div>
              <div className="max-w-md">
                <h2 className="text-2xl font-bold text-stone-900">Bienvenue sur Médoc</h2>
                <p className="text-stone-500 mt-2">Commencez par ajouter votre premier animal pour suivre sa santé et son bien-être au quotidien.</p>
              </div>
              <button 
                onClick={() => setIsAddingPet(true)}
                className="bg-emerald-600 text-white px-8 py-3 rounded-full font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
              >
                Ajouter un animal
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Floating Action Button: Chat */}
      <button 
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-stone-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-40"
      >
        <MessageCircle size={28} />
      </button>

      {/* Modals */}
      <AnimatePresence>
        {isAddingPet && (
          <PetModal onClose={() => setIsAddingPet(false)} onSave={addPet} />
        )}
        {isAddingTreatment && selectedPet && (
          <TreatmentModal 
            onClose={() => setIsAddingTreatment(false)} 
            onSave={(t) => addTreatment(selectedPet.id, t)} 
          />
        )}
        {isChatOpen && (
          <ChatModal 
            onClose={() => setIsChatOpen(false)} 
            messages={chatMessages}
            onSend={handleChat}
            input={chatInput}
            setInput={setChatInput}
            isTyping={isTyping}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PetModal({ onClose, onSave }: { onClose: () => void, onSave: (p: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'dog' as PetType,
    breed: '',
    birthDate: '',
    weight: ''
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Nouvel Animal</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X /></button>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...formData, weight: parseFloat(formData.weight) });
        }} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Nom</label>
            <input 
              required
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Type</label>
              <select 
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as PetType})}
              >
                <option value="dog">Chien</option>
                <option value="cat">Chat</option>
                <option value="turtle">Tortue</option>
                <option value="snake">Serpent</option>
                <option value="rabbit">Lapin</option>
                <option value="bird">Oiseau</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Poids (kg)</label>
              <input 
                type="number" step="0.1" required
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.weight}
                onChange={e => setFormData({...formData, weight: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Race</label>
            <input 
              required
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.breed}
              onChange={e => setFormData({...formData, breed: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Date de naissance</label>
            <input 
              type="date" required
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.birthDate}
              onChange={e => setFormData({...formData, birthDate: e.target.value})}
            />
          </div>
          <button className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold mt-4 hover:bg-stone-800 transition-colors shadow-lg">
            Enregistrer
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function TreatmentModal({ onClose, onSave }: { onClose: () => void, onSave: (t: any) => void }) {
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    nextReminder: ''
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Nouveau Soin</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X /></button>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          onSave(formData);
        }} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Type de soin</label>
            <input 
              placeholder="Ex: Vaccin, Vermifuge, Consultation..."
              required
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Date</label>
            <input 
              type="date" required
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Notes / Description</label>
            <textarea 
              rows={3}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">Prochain rappel (Optionnel)</label>
            <input 
              type="date"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.nextReminder}
              onChange={e => setFormData({...formData, nextReminder: e.target.value})}
            />
          </div>
          <button className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold mt-4 hover:bg-emerald-700 transition-colors shadow-lg">
            Ajouter au carnet
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function ChatModal({ onClose, messages, onSend, input, setInput, isTyping }: any) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 md:p-8 bg-stone-900/20 backdrop-blur-[2px]">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="bg-white w-full max-w-lg h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-stone-200"
      >
        <div className="bg-stone-900 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
              <Stethoscope size={20} />
            </div>
            <div>
              <h3 className="font-bold">Médoc AI</h3>
              <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Vétérinaire de poche</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X /></button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-50">
          {messages.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm mx-auto flex items-center justify-center text-stone-300">
                <MessageCircle size={32} />
              </div>
              <p className="text-sm text-stone-500 max-w-[200px] mx-auto">Posez vos questions sur la santé ou le comportement de votre animal.</p>
            </div>
          )}
          {messages.map((m: any, i: number) => (
            <div key={i} className={cn(
              "flex",
              m.role === 'user' ? "justify-end" : "justify-start"
            )}>
              <div className={cn(
                "max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed",
                m.role === 'user' 
                  ? "bg-stone-900 text-white rounded-tr-none shadow-md" 
                  : "bg-white text-stone-800 rounded-tl-none border border-stone-200 shadow-sm"
              )}>
                {m.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-stone-200 shadow-sm flex gap-1">
                <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-stone-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={onSend} className="p-4 bg-white border-t border-stone-100 flex gap-2">
          <input 
            className="flex-1 bg-stone-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="Demander conseil à Médoc..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button className="bg-stone-900 text-white p-3 rounded-2xl hover:bg-stone-800 transition-colors flex items-center justify-center">
            <Send size={20} />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
