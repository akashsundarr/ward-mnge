import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../AuthContext";
import { Button, Input, Textarea, Card, CardHeader, CardTitle, CardContent, Badge, cn } from "../components/ModernUI";
import { Plus, Filter, LogOut, MapPin, Image as ImageIcon, X, CheckSquare, ListPlus } from "lucide-react";

export default function Ward() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("complaints"); 
  
  // --- Complaints State ---
  const [complaints, setComplaints] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  // --- Schemes State ---
  const [schemes, setSchemes] = useState([]);
  const [schemeTitle, setSchemeTitle] = useState("");
  const [schemeDesc, setSchemeDesc] = useState("");

  // --- Eligibility State ---
  const [schemeId, setSchemeId] = useState(""); // Selected scheme for editing
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState("");
  
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [optionText, setOptionText] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);

  // --- Initial Fetch ---
  useEffect(() => {
    fetchComplaints();
    fetchSchemes();
  }, []);

  // --- Data Fetching ---
  const fetchComplaints = async () => {
    const { data } = await supabase.from("complaints")
      .select(`id, category, description, priority, status, image_url, location_note, created_at, profiles(house_no)`)
      .order("created_at", { ascending: false });
    setComplaints(data || []);
  };

  const fetchSchemes = async () => {
    const { data } = await supabase.from("notifications").select("id, title").order("created_at", { ascending: false });
    setSchemes(data || []);
  };

  const fetchQuestions = async (nid) => {
    const { data } = await supabase.from("eligibility_questions").select("id, question").eq("notification_id", nid);
    setQuestions(data || []);
  };

  // --- Actions: Complaints ---
  const updateStatus = async (id, status) => {
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c)); // Optimistic UI
    await supabase.from("complaints").update({ status }).eq("id", id);
    fetchComplaints();
  };

  // --- Actions: Schemes ---
  const createScheme = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("notifications").insert({ title: schemeTitle, description: schemeDesc });
    if (!error) {
      setSchemeTitle(""); setSchemeDesc(""); 
      fetchSchemes(); 
      alert("Scheme Created");
    }
  };

  // --- Actions: Eligibility ---
  const addQuestion = async (e) => {
    e.preventDefault();
    if (!schemeId) return alert("Please select a scheme first");
    
    const { error } = await supabase.from("eligibility_questions").insert({ notification_id: schemeId, question: questionText });
    if (!error) {
      setQuestionText(""); 
      fetchQuestions(schemeId);
    }
  };

  const addOption = async (e) => {
    e.preventDefault();
    if (!selectedQuestionId) return alert("Please select a question first");

    const { error } = await supabase.from("eligibility_options").insert({
      question_id: selectedQuestionId,
      option_text: optionText,
      is_correct: isCorrect,
    });

    if (!error) {
      setOptionText(""); 
      setIsCorrect(false);
      alert("Option added!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      {/* --- HEADER --- */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <h1 className="font-bold text-lg sm:text-xl">Ward Admin</h1>
          <div className="flex gap-2">
             <div className="hidden sm:flex space-x-2">
                <Button variant={activeTab === "complaints" ? "default" : "ghost"} onClick={() => setActiveTab("complaints")}>Complaints</Button>
                <Button variant={activeTab === "schemes" ? "default" : "ghost"} onClick={() => setActiveTab("schemes")}>Schemes</Button>
             </div>
             <Button variant="danger" size="sm" onClick={logout} className="px-2 sm:px-4">
                <LogOut className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Logout</span>
             </Button>
          </div>
        </div>
        {/* Mobile Tabs */}
        <div className="flex sm:hidden border-t">
            <button onClick={() => setActiveTab("complaints")} className={cn("flex-1 py-3 text-sm font-medium", activeTab === "complaints" ? "bg-gray-50 text-black border-b-2 border-black" : "text-gray-500")}>
                Complaints
            </button>
            <button onClick={() => setActiveTab("schemes")} className={cn("flex-1 py-3 text-sm font-medium", activeTab === "schemes" ? "bg-gray-50 text-black border-b-2 border-black" : "text-gray-500")}>
                Schemes
            </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        
        {/* ================= COMPLAINTS TAB ================= */}
        {activeTab === "complaints" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <h2 className="text-lg font-semibold">Incoming Issues</h2>
               <div className="flex gap-2 w-full sm:w-auto">
                 <Input placeholder="Search..." className="flex-1 sm:w-64" />
                 <Button variant="outline"><Filter className="w-4 h-4 mr-2"/> Filter</Button>
               </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg border shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                  <tr>
                    <th className="px-6 py-4">Issue</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {complaints.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{c.category}</div>
                        <div className="text-gray-500 line-clamp-1">{c.description}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {c.profiles?.house_no} <br/>
                        <span className="text-xs text-gray-400">{c.location_note}</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusSelect value={c.status} onChange={(v) => updateStatus(c.id, v)} />
                      </td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {c.image_url && (
                          <button onClick={() => setSelectedImage(c.image_url)} className="text-blue-600 hover:text-blue-800 flex items-center justify-end gap-1 ml-auto text-xs font-medium">
                            <ImageIcon className="w-4 h-4" /> View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {complaints.map(c => (
                    <Card key={c.id} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-semibold text-gray-900">{c.category}</h3>
                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <span className="font-medium text-gray-700">{c.profiles?.house_no}</span>
                                    <span>•</span>
                                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <PriorityBadge priority={c.priority} />
                        </div>
                        <p className="text-sm text-gray-600 mb-3 bg-gray-50 p-2 rounded border border-gray-100">{c.description}</p>
                        {c.location_note && (
                            <div className="text-xs text-gray-500 mb-4 flex items-start gap-1"><MapPin className="w-3 h-3 mt-0.5" /> <span>{c.location_note}</span></div>
                        )}
                        <div className="flex items-center justify-between gap-3 pt-3 border-t mt-2">
                             <div className="w-1/2"><StatusSelect value={c.status} onChange={(v) => updateStatus(c.id, v)} /></div>
                             {c.image_url && (
                                <Button variant="secondary" size="sm" onClick={() => setSelectedImage(c.image_url)} className="w-1/2"><ImageIcon className="w-4 h-4 mr-2" /> Image</Button>
                             )}
                        </div>
                    </Card>
                ))}
            </div>
          </div>
        )}

        {/* ================= SCHEMES & ELIGIBILITY TAB ================= */}
        {activeTab === "schemes" && (
           <div className="grid md:grid-cols-2 gap-6">
              {/* 1. Create Scheme */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5"/> New Scheme</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={createScheme} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 uppercase">Title</label>
                      <Input placeholder="e.g. Housing Aid 2026" value={schemeTitle} onChange={e => setSchemeTitle(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 uppercase">Description</label>
                      <Textarea placeholder="Details regarding the scheme..." value={schemeDesc} onChange={e => setSchemeDesc(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full">Publish Notification</Button>
                  </form>
                </CardContent>
              </Card>
              
              {/* 2. Eligibility Setup */}
              <Card className="h-fit">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ListPlus className="w-5 h-5"/> Eligibility Rules</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-6">
                    
                    {/* Step A: Select Scheme */}
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-900 uppercase tracking-wide">1. Select Target Scheme</label>
                       <select 
                          className="w-full h-10 rounded-md border border-gray-300 px-3 bg-white text-sm focus:ring-2 focus:ring-black focus:outline-none"
                          value={schemeId}
                          onChange={(e) => {
                            setSchemeId(e.target.value);
                            fetchQuestions(e.target.value);
                            setSelectedQuestionId("");
                          }}
                       >
                          <option value="">-- Choose Scheme --</option>
                          {schemes.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                       </select>
                    </div>

                    {/* Step B: Add Question */}
                    <form onSubmit={addQuestion} className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                       <label className="text-xs font-bold text-gray-700 uppercase">2. Add Question</label>
                       <div className="flex gap-2">
                          <Input 
                            className="bg-white"
                            placeholder="e.g. Do you own a car?" 
                            value={questionText} 
                            onChange={(e) => setQuestionText(e.target.value)} 
                          />
                          <Button size="sm" type="submit" disabled={!schemeId}>Add</Button>
                       </div>
                    </form>

                    {/* Step C: Add Options */}
                    <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                       <label className="text-xs font-bold text-gray-700 uppercase">3. Add Options to Question</label>
                       
                       <select 
                          className="w-full h-10 rounded-md border border-gray-300 px-3 bg-white text-sm mb-2"
                          value={selectedQuestionId}
                          onChange={(e) => setSelectedQuestionId(e.target.value)}
                       >
                          <option value="">-- Select Question --</option>
                          {questions.map((q) => <option key={q.id} value={q.id}>{q.question}</option>)}
                       </select>

                       <form onSubmit={addOption} className="space-y-3">
                          <Input 
                            className="bg-white"
                            placeholder="Option text (e.g. Yes)" 
                            value={optionText} 
                            onChange={(e) => setOptionText(e.target.value)} 
                          />
                          
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                  checked={isCorrect} 
                                  onChange={(e) => setIsCorrect(e.target.checked)} 
                                />
                                <span className="text-gray-700">Is this the eligible answer?</span>
                            </label>
                            <Button size="sm" type="submit" variant="secondary" disabled={!selectedQuestionId}>Save Option</Button>
                          </div>
                       </form>
                    </div>
                 </CardContent>
              </Card>
           </div>
        )}
      </main>

      {/* --- IMAGE MODAL OVERLAY --- */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>
            <div className="relative w-full max-w-3xl" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedImage(null)} className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2">
                    <X className="w-8 h-8" />
                </button>
                <img src={selectedImage} alt="Proof" className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl" />
            </div>
        </div>
      )}
    </div>
  );
}

// --- Helper Components ---
const StatusSelect = ({ value, onChange }) => (
    <div className="relative">
        <select 
            className={cn(
                "appearance-none w-full text-xs font-semibold px-3 py-2 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 transition-colors",
                value === "Resolved" ? "bg-green-100 text-green-800 hover:bg-green-200" :
                value === "In Progress" ? "bg-blue-100 text-blue-800 hover:bg-blue-200" :
                value === "Pending" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" :
                "bg-gray-100 text-gray-800 hover:bg-gray-200"
            )}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="Submitted">Submitted</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
        </select>
    </div>
);

const PriorityBadge = ({ priority }) => (
    <Badge variant={priority === "High" ? "destructive" : priority === "Medium" ? "warning" : "success"}>
        {priority}
    </Badge>
);