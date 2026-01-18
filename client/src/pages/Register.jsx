import { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate, Link } from "react-router-dom";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "../components/ModernUI";
import { Plus, Trash2, Loader2, ArrowLeft } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ house_no: "", phone: "", email: "", password: "" });
  const [members, setMembers] = useState([{ name: "", dob: "", relation: "" }]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleMemberChange = (index, field, value) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const addMember = () => setMembers([...members, { name: "", dob: "", relation: "" }]);
  const removeMember = (index) => setMembers(members.filter((_, i) => i !== index));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password
      });

      if (authError) throw authError;

      const houseId = data.user.id;
      const { error: profileError } = await supabase.from("profiles").insert({
        id: houseId,
        house_no: form.house_no,
        name: `House ${form.house_no}`,
        phone: form.phone,
        role: "CITIZEN"
      });

      if (profileError) throw profileError;

      const validMembers = members.filter((m) => m.name && m.dob);
      if (validMembers.length > 0) {
        await supabase.from("house_members").insert(
          validMembers.map((m) => ({
            house_id: houseId,
            name: m.name,
            dob: m.dob,
            relation: m.relation
          }))
        );
      }
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center text-sm text-gray-500 hover:text-black mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
        </Link>
        
        <form onSubmit={submit}>
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">House Registration</CardTitle>
              <p className="text-gray-500 text-sm">Create a digital profile for your household.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>}
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">House Number</label>
                  <Input name="house_no" placeholder="e.g. H-23" onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input name="phone" placeholder="9876543210" onChange={handleChange} required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email (Login ID)</label>
                <Input type="email" name="email" onChange={handleChange} required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input type="password" name="password" onChange={handleChange} required />
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Members</h3>
                  <Button type="button" variant="secondary" size="sm" onClick={addMember}>
                    <Plus className="w-4 h-4 mr-2" /> Add Member
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {members.map((m, i) => (
                    <div key={i} className="flex gap-3 items-end p-4 bg-gray-50 rounded-lg border">
                      <div className="flex-1 space-y-1">
                        <label className="text-xs font-medium text-gray-500">Name</label>
                        <Input value={m.name} onChange={(e) => handleMemberChange(i, "name", e.target.value)} required />
                      </div>
                      <div className="w-1/4 space-y-1">
                        <label className="text-xs font-medium text-gray-500">DOB</label>
                        <Input type="date" value={m.dob} onChange={(e) => handleMemberChange(i, "dob", e.target.value)} required />
                      </div>
                      <div className="w-1/4 space-y-1">
                        <label className="text-xs font-medium text-gray-500">Relation</label>
                        <Input value={m.relation} onChange={(e) => handleMemberChange(i, "relation", e.target.value)} />
                      </div>
                      {members.length > 1 && (
                        <Button type="button" variant="ghost" onClick={() => removeMember(i)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base mt-4" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : "Complete Registration"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}