import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import imageCompression from "browser-image-compression";
import { Button, Input, Textarea, Card, CardHeader, CardTitle, CardContent, Badge, PageHeader, cn} from "../components/ModernUI";
import { LogOut, Home, FileText, Bell, ThumbsUp, ThumbsDown, Camera, MapPin, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_PRIORITY = {
  "Water Supply": "High", Electricity: "High", "Road Damage": "High",
  Garbage: "Medium", "Street Light": "Medium", Noise: "Low", Other: "Low",
};

export default function Citizen() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("complaints"); // 'complaints' | 'notices' | 'create'
  
  // Data States
  const [schemes, setSchemes] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);
  const [wardComplaints, setWardComplaints] = useState([]);
  
  // Form States
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationNote, setLocationNote] = useState("");

  useEffect(() => {
    if (user) {
      fetchComplaints();
      fetchSchemes();
    }
  }, [user]);

  const fetchSchemes = async () => {
    const { data } = await supabase.from("notifications").select("id, title, description").order("created_at", { ascending: false });
    setSchemes(data || []);
  };

  const fetchComplaints = async () => {
    const { data: mine } = await supabase.from("complaints").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    const { data: all } = await supabase.from("complaints").select(`
        id, category, description, priority, status, image_url, created_at,
        complaint_votes ( vote )
      `).order("created_at", { ascending: false });
    
    setMyComplaints(mine || []);
    setWardComplaints(all || []);
  };

  // ... (Cloudinary Upload & Submit Logic remains exactly same as your original code, just omitted here for brevity) ...
  // Assume uploadToCloudinary and submitComplaint functions are here exactly as provided in original.
  
  async function uploadToCloudinary(file) {
      // ... original logic ...
      const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true });
      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
      const data = await res.json();
      return data.secure_url;
  }

  async function submitComplaint(e) {
    e.preventDefault();
    if (!category || !description) return;
    setLoading(true);
    try {
      const priority = CATEGORY_PRIORITY[category] || "Low";
      let imageUrl = null;
      if (imageFile) imageUrl = await uploadToCloudinary(imageFile);

      const { error } = await supabase.from("complaints").insert({
        user_id: user.id, category, description, priority, status: "Submitted", image_url: imageUrl, location_note: locationNote || null,
      });
      if (error) throw error;
      setCategory(""); setDescription(""); setImageFile(null); setLocationNote("");
      fetchComplaints();
      setActiveTab("complaints");
    } catch (err) { alert(err.message); }
    setLoading(false);
  }

  const voteComplaint = async (complaintId, value) => {
     await supabase.from("complaint_votes").insert({ complaint_id: complaintId, user_id: user.id, vote: value });
     fetchComplaints();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r fixed h-full z-10">
        <div className="p-6 font-bold text-xl border-b flex items-center gap-2">
          <Home className="w-5 h-5"/> WardConnect
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Button variant={activeTab === "complaints" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("complaints")}>
            <FileText className="w-4 h-4 mr-2"/> Complaints
          </Button>
          <Button variant={activeTab === "notices" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("notices")}>
            <Bell className="w-4 h-4 mr-2"/> Notices & Schemes
          </Button>
          <Button variant={activeTab === "create" ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab("create")}>
            <Camera className="w-4 h-4 mr-2"/> Raise Issue
          </Button>
        </nav>
        <div className="p-4 border-t">
          <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2"/> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto w-full">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6">
          <h1 className="font-bold text-lg">WardConnect</h1>
          <Button size="sm" variant="ghost" onClick={logout}><LogOut className="w-4 h-4"/></Button>
        </div>

        {activeTab === "complaints" && (
          <div className="space-y-6">
            <PageHeader 
              title="Dashboard" 
              subtitle="Overview of ward issues and your activity." 
              action={
                <Button onClick={() => navigate("/citizen/applications")}>
                  View My Applications
                </Button>
              }
            />
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* My Complaints */}
              <section className="space-y-4">
                <h3 className="font-semibold text-gray-900">My Recent Activity</h3>
                {myComplaints.length === 0 ? (
                  <Card className="p-8 text-center text-gray-500 bg-gray-50 border-dashed">No complaints raised yet.</Card>
                ) : (
                  myComplaints.map(c => (
                    <Card key={c.id} className="overflow-hidden">
                      <div className="flex">
                        {c.image_url && <img src={c.image_url} alt="" className="w-24 h-full object-cover" />}
                        <div className="p-4 flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline">{c.category}</Badge>
                            <StatusBadge status={c.status} />
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{c.description}</p>
                          <div className="mt-3 text-xs text-gray-400">
                            {new Date(c.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </section>

              {/* Ward Feed */}
              <section className="space-y-4">
                <h3 className="font-semibold text-gray-900">Community Feed</h3>
                {wardComplaints.map(c => (
                  <Card key={c.id} className="p-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">{c.category}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{c.description}</p>
                    <div className="flex items-center gap-4 border-t pt-3">
                      <button onClick={() => voteComplaint(c.id, 1)} className="flex items-center text-xs text-gray-600 hover:text-green-600 transition-colors">
                        <ThumbsUp className="w-3 h-3 mr-1"/> {c.complaint_votes?.filter(v => v.vote === 1).length || 0}
                      </button>
                      <button onClick={() => voteComplaint(c.id, -1)} className="flex items-center text-xs text-gray-600 hover:text-red-600 transition-colors">
                        <ThumbsDown className="w-3 h-3 mr-1"/> {c.complaint_votes?.filter(v => v.vote === -1).length || 0}
                      </button>
                    </div>
                  </Card>
                ))}
              </section>
            </div>
          </div>
        )}

        {activeTab === "create" && (
          <div className="max-w-2xl mx-auto">
             <PageHeader title="Raise a Complaint" subtitle="Report an issue in your locality." />
             <Card>
               <CardContent className="space-y-4 pt-6">
                 <form onSubmit={submitComplaint} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Category</label>
                      <select className="w-full h-10 rounded-md border border-gray-300 px-3 bg-white" value={category} onChange={e => setCategory(e.target.value)} required>
                        <option value="">Select Category</option>
                        {Object.keys(CATEGORY_PRIORITY).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Description</label>
                      <Textarea placeholder="Describe the issue in detail..." value={description} onChange={e => setDescription(e.target.value)} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Location / Landmark</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                        <Input className="pl-9" placeholder="e.g. Near Main Temple" value={locationNote} onChange={e => setLocationNote(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Photo Evidence</label>
                      <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin mr-2"/> : "Submit Report"}
                    </Button>
                 </form>
               </CardContent>
             </Card>
          </div>
        )}

        {activeTab === "notices" && (
          <div className="max-w-3xl mx-auto">
            <PageHeader title="Welfare Schemes" subtitle="Government notifications and benefits." />
            <div className="space-y-4">
              {schemes.map(s => (
                <Card key={s.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{s.description}</p>
                    <Button onClick={() => navigate("/citizen/eligibility", { state: { schemeId: s.id } })}>
                      Check Eligibility
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t flex justify-around p-3 z-50">
        <NavBtn icon={FileText} label="Home" active={activeTab === "complaints"} onClick={() => setActiveTab("complaints")} />
        <NavBtn icon={Camera} label="Raise" active={activeTab === "create"} onClick={() => setActiveTab("create")} />
        <NavBtn icon={Bell} label="Notices" active={activeTab === "notices"} onClick={() => setActiveTab("notices")} />
      </nav>
    </div>
  );
}

const NavBtn = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={cn("flex flex-col items-center gap-1 text-xs font-medium", active ? "text-black" : "text-gray-400")}>
    <Icon className={cn("w-6 h-6", active ? "fill-current" : "")} />
    {label}
  </button>
);

const StatusBadge = ({ status }) => {
  const styles = { Submitted: "bg-gray-100 text-gray-800", Pending: "bg-yellow-100 text-yellow-800", "In Progress": "bg-blue-100 text-blue-800", Resolved: "bg-green-100 text-green-800" };
  return <span className={cn("px-2 py-1 rounded-full text-xs font-medium", styles[status])}>{status}</span>;
};