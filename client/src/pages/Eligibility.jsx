import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardHeader, CardTitle, CardContent, PageHeader, cn } from "../components/ModernUI";
import { ArrowLeft, CheckCircle2, XCircle, Loader2 } from "lucide-react";

const GAS_URL = "https://script.google.com/macros/s/AKfycbwM1NAIwaQ8vuT2GDcKyT5rILm4DZkZdOgxshcLlfdBMHK7sviLwxxmyrl935KpkK9aJQ/exec";

export default function Eligibility() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Data State
  const [members, setMembers] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [questions, setQuestions] = useState([]);
  
  // Selection State
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedScheme, setSelectedScheme] = useState("");
  const [answers, setAnswers] = useState({});
  
  // UI State
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMembers();
      fetchSchemes();
    }
  }, [user]);

  const fetchMembers = async () => {
    const { data } = await supabase.from("house_members").select("*").eq("house_id", user.id);
    setMembers(data || []);
  };

  const fetchSchemes = async () => {
    const { data } = await supabase.from("notifications").select("id, title");
    setSchemes(data || []);
  };

  const loadQuestions = async (schemeId) => {
    setQuestions([]);
    setAnswers({});
    setResult(null);
    if (!schemeId) return;

    const { data } = await supabase
      .from("eligibility_questions")
      .select(`id, question, eligibility_options (id, option_text, is_correct)`)
      .eq("notification_id", schemeId);
    setQuestions(data || []);
  };

  // Logic remains identical
  const checkEligibility = () => {
    if (!selectedMember || !selectedScheme) return;
    const member = members.find((m) => String(m.id) === String(selectedMember));
    if (!member) return;

    const age = new Date().getFullYear() - new Date(member.dob).getFullYear();
    if (age < 5) {
      setResult({ eligible: false, reason: "Age criteria not satisfied (Must be > 5 years)" });
      return;
    }

    for (const q of questions) {
      const selectedOption = q.eligibility_options.find((o) => o.id === answers[q.id]);
      if (!selectedOption || !selectedOption.is_correct) {
        setResult({ eligible: false, reason: "Eligibility conditions not satisfied based on your answers." });
        return;
      }
    }
    setResult({ eligible: true, reason: "You meet all the criteria for this scheme." });
  };

  const applyForScheme = async () => {
    const member = members.find((m) => String(m.id) === String(selectedMember));
    const scheme = schemes.find((s) => String(s.id) === String(selectedScheme));
    if (!member || !scheme) return;

    setSending(true);
    try {
      const { error } = await supabase.from("scheme_applications").insert({
        user_id: user.id, scheme_id: scheme.id, scheme_title: scheme.title,
        house_no: profile?.house_no || "N/A", member_name: member.name,
      });

      if (error) throw error;

      await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({
          scheme: scheme.title, house_no: profile?.house_no || "N/A",
          member_name: member.name, phone: member.phone || "",
        }),
      });
      alert("Application submitted successfully!");
      navigate("/citizen/applications");
    } catch (err) {
      console.warn(err);
      alert("Saved, but notification might have failed.");
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" className="mb-6 pl-0" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <PageHeader title="Check Eligibility" subtitle="Answer a few questions to see if you qualify." />

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Step 1: Select Member */}
          <Card>
            <CardHeader><CardTitle className="text-base">1. Select Household Member</CardTitle></CardHeader>
            <CardContent>
              <select 
                className="w-full h-10 rounded-md border border-gray-300 px-3 bg-white focus:ring-2 focus:ring-black focus:outline-none"
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
              >
                <option value="">Choose member...</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </CardContent>
          </Card>

          {/* Step 2: Select Scheme */}
          <Card>
            <CardHeader><CardTitle className="text-base">2. Select Scheme</CardTitle></CardHeader>
            <CardContent>
              <select 
                className="w-full h-10 rounded-md border border-gray-300 px-3 bg-white focus:ring-2 focus:ring-black focus:outline-none"
                value={selectedScheme}
                onChange={(e) => { setSelectedScheme(e.target.value); loadQuestions(e.target.value); }}
              >
                <option value="">Choose scheme...</option>
                {schemes.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </CardContent>
          </Card>
        </div>

        {/* Step 3: Questions */}
        {questions.length > 0 && (
          <div className="space-y-6 mb-8">
            <h3 className="font-semibold text-lg">3. Answer Eligibility Questions</h3>
            {questions.map((q, idx) => (
              <Card key={q.id}>
                <CardContent className="pt-6">
                  <p className="font-medium mb-4 text-gray-900">{idx + 1}. {q.question}</p>
                  <div className="space-y-3">
                    {q.eligibility_options.map((o) => (
                      <label key={o.id} className={cn(
                        "flex items-center p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50",
                        answers[q.id] === o.id ? "border-black bg-gray-50 ring-1 ring-black" : "border-gray-200"
                      )}>
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          className="w-4 h-4 text-black border-gray-300 focus:ring-black"
                          onChange={() => setAnswers({ ...answers, [q.id]: o.id })}
                        />
                        <span className="ml-3 text-sm text-gray-700">{o.option_text}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button size="lg" className="w-full h-12 text-base" onClick={checkEligibility}>
              Check My Status
            </Button>
          </div>
        )}

        {/* Result Block */}
        {result && (
          <div className={cn(
            "rounded-xl p-6 border-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500",
            result.eligible ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          )}>
            <div className="flex gap-4">
              <div className={cn("p-2 rounded-full h-fit", result.eligible ? "bg-green-100" : "bg-red-100")}>
                {result.eligible ? <CheckCircle2 className="w-6 h-6 text-green-700" /> : <XCircle className="w-6 h-6 text-red-700" />}
              </div>
              <div>
                <h4 className={cn("font-bold text-lg", result.eligible ? "text-green-800" : "text-red-800")}>
                  {result.eligible ? "You are Eligible!" : "Not Eligible"}
                </h4>
                <p className={cn("text-sm mt-1", result.eligible ? "text-green-700" : "text-red-700")}>
                  {result.reason}
                </p>
              </div>
            </div>

            {result.eligible && (
              <Button 
                onClick={applyForScheme} 
                disabled={sending}
                className="bg-green-700 hover:bg-green-800 text-white w-full md:w-auto"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : "Submit Application"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}