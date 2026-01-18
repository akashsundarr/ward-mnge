import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, PageHeader, Badge, Button } from "../components/ModernUI";
import { Loader2, ArrowLeft, Calendar, Home, User } from "lucide-react";

export default function CitizenApplications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("scheme_applications")
        .select(`id, scheme_title, member_name, house_no, status, created_at`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setApps(data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  // Helper for status colors
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "approved": return "success";
      case "rejected": return "destructive";
      default: return "default"; // Pending
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        <PageHeader 
          title="My Applications" 
          subtitle="Track the status of your welfare scheme applications." 
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : apps.length === 0 ? (
          <Card className="p-12 text-center bg-gray-50 border-dashed">
            <p className="text-gray-500 mb-4">You haven't applied for any schemes yet.</p>
            <Button onClick={() => navigate("/citizen")}>Browse Schemes</Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {apps.map((a) => (
              <Card key={a.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{a.scheme_title}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" /> {a.member_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Home className="w-4 h-4" /> {a.house_no}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {new Date(a.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                  <Badge variant={getStatusVariant(a.status)} className="px-3 py-1 text-sm uppercase tracking-wide">
                    {a.status || "Pending"}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}