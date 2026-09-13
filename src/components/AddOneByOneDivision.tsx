import React, { useState } from 'react';
import { UserPlus, Plus, Check, Mail, Building2, User, Briefcase, Sparkles, X, ListPlus } from 'lucide-react';
import { Lead } from '../types';

interface AddOneByOneDivisionProps {
  onAddLead: (lead: Lead) => void;
  leads: Lead[];
  onRemoveLead: (id: string) => void;
}

export const AddOneByOneDivision: React.FC<AddOneByOneDivisionProps> = ({
  onAddLead,
  leads,
  onRemoveLead,
}) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [customIcebreaker, setCustomIcebreaker] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    // Check duplicate
    if (leads.some((l) => l.email.toLowerCase() === cleanEmail.toLowerCase())) {
      if (!confirm(`An email for ${cleanEmail} is already in the list. Do you want to add it anyway?`)) {
        return;
      }
    }

    const newLead: Lead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      firstName: firstName.trim() || (cleanEmail.split('@')[0] ? cleanEmail.split('@')[0].split('.')[0] : 'there'),
      lastName: lastName.trim() || '',
      company: company.trim() || 'Company',
      jobTitle: jobTitle.trim() || 'Recruiter / Hiring Manager',
      customIcebreaker: customIcebreaker.trim() || undefined,
      status: 'pending',
      currentStep: 0,
    };

    onAddLead(newLead);

    setSuccessNotice(`Added ${cleanEmail} to recipient list`);
    setTimeout(() => setSuccessNotice(null), 3500);

    // Reset fields for the next one
    setEmail('');
    setFirstName('');
    setLastName('');
    setCompany('');
    setJobTitle('');
    setCustomIcebreaker('');
  };

  // Get the 5 most recently added leads
  const recentLeads = [...leads].slice(-4).reverse();

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Add Recipients One by One</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter target emails individually (recruiters, professors, hiring managers) with custom personalization.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
            {leads.length} {leads.length === 1 ? 'Recipient' : 'Total Recipients'}
          </span>
        </div>
      </div>

      {successNotice && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center space-x-2">
          <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Main Single-Add Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Email (Required) */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recruiter@google.com"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* First Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              First Name
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Sarah"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Connor"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Company / University / Lab */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Company / University / Lab
            </label>
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Meta / Stanford Lab"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Role / Job Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Job Title / Position
            </label>
            <div className="relative">
              <Briefcase className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Engineering Manager / Professor"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Personalized Note / Icebreaker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Personalized Hook / Note (Optional)
            </label>
            <input
              type="text"
              value={customIcebreaker}
              onChange={(e) => setCustomIcebreaker(e.target.value)}
              placeholder="Loved your recent paper on LLM optimization"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400">
            Tip: Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono text-[10px]">Enter</kbd> to quickly add recipient
          </span>

          <button
            type="submit"
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Recipient to Queue</span>
          </button>
        </div>
      </form>

      {/* Recipient Chips Preview */}
      {leads.length > 0 && (
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">Recently Added Recipients</span>
            <span className="text-[11px] text-slate-400">Showing {recentLeads.length} of {leads.length}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {recentLeads.map((lead) => (
              <div
                key={lead.id}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between gap-1 group hover:border-slate-300"
              >
                <div className="overflow-hidden">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {lead.firstName} {lead.lastName}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{lead.email}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                    {lead.company} • {lead.jobTitle}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveLead(lead.id)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                  title="Remove from list"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
