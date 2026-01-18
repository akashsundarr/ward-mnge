import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Users, Activity } from "lucide-react";
import { Button } from "../components/ModernUI";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-gray-900 selection:text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6" />
            Ward<span className="text-gray-500">Connect</span>
          </div>
          <div className="flex gap-4">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-8">
          <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-800">
            <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2"></span>
            Digital Governance v2.0 Live
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900">
            Your Ward, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500">
              Digitally Connected.
            </span>
          </h1>
          
          <p className="text-xl text-gray-500 leading-relaxed">
            Raise complaints, apply for welfare schemes, and track your eligibility instantly. 
            Transparent governance for the modern citizen.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/register">
              <Button className="h-12 px-8 text-lg rounded-full">
                Register Household <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" className="h-12 px-8 text-lg rounded-full">
                Citizen Login
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          {[
            { icon: Users, title: "Household Registry", desc: "Manage your family members and profile in one secure place." },
            { icon: Activity, title: "Track Complaints", desc: "Real-time updates on your street lights, water, and road issues." },
            { icon: ShieldCheck, title: "Welfare Schemes", desc: "Check eligibility and apply for government benefits instantly." },
          ].map((f, i) => (
            <div key={i} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all">
              <f.icon className="w-10 h-10 mb-4 text-gray-900" />
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}