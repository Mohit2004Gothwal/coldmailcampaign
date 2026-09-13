import React, { useState } from 'react';
import {
  Users,
  Upload,
  UserPlus,
  Sparkles,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  MessageSquare,
  Trash2,
  FileSpreadsheet,
  RefreshCw,
  Edit2,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Lead, LeadStatus } from '../types';
import { DEFAULT_LEADS } from '../data/defaultLeads';
import { AddOneByOneDivision } from './AddOneByOneDivision';

interface LeadManagerProps {
  leads: Lead[];
  onUpdateLeads: (leads: Lead[]) => void;
}

export const LeadManager: React.FC<LeadManagerProps> = ({ leads, onUpdateLeads }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isGeneratingIcebreakers, setIsGeneratingIcebreakers] = useState(false);
  const [showOneByOneDivision, setShowOneByOneDivision] = useState(true);
  const [csvText, setCsvText] = useState('');
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
    industry: '',
    city: '',
    customIcebreaker: '',
    painPoint: '',
  });

  // Filtered leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      `${lead.firstName} ${lead.lastName} ${lead.email} ${lead.company} ${lead.jobTitle}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteLead = (id: string) => {
    onUpdateLeads(leads.filter((l) => l.id !== id));
  };

  const handleResetToSample = () => {
    if (confirm('Reset prospect list to the pre-verified 5 sample leads?')) {
      onUpdateLeads(DEFAULT_LEADS);
    }
  };

  const handleAddSingleLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.email) {
      alert('Email address is required.');
      return;
    }
    const created: Lead = {
      id: `lead-${Date.now()}`,
      email: newLead.email.trim(),
      firstName: newLead.firstName?.trim() || '',
      lastName: newLead.lastName?.trim() || '',
      company: newLead.company?.trim() || '',
      jobTitle: newLead.jobTitle?.trim() || '',
      industry: newLead.industry?.trim() || '',
      city: newLead.city?.trim() || '',
      customIcebreaker: newLead.customIcebreaker?.trim() || '',
      painPoint: newLead.painPoint?.trim() || '',
      status: 'pending',
      currentStep: 0,
    };
    onUpdateLeads([...leads, created]);
    setNewLead({
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      jobTitle: '',
      industry: '',
      city: '',
      customIcebreaker: '',
      painPoint: '',
    });
    setIsAddLeadModalOpen(false);
  };

  const handleParseAndImportCsv = () => {
    if (!csvText.trim()) return;

    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return;

    // Header detection
    const headerLine = lines[0].toLowerCase();
    const headers = headerLine.split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));

    const emailIdx = headers.findIndex((h) => h.includes('email'));
    const firstIdx = headers.findIndex((h) => h.includes('first') || h === 'name');
    const lastIdx = headers.findIndex((h) => h.includes('last'));
    const companyIdx = headers.findIndex((h) => h.includes('company') || h.includes('organization'));
    const titleIdx = headers.findIndex((h) => h.includes('title') || h.includes('role') || h.includes('position'));
    const industryIdx = headers.findIndex((h) => h.includes('industry') || h.includes('sector'));
    const cityIdx = headers.findIndex((h) => h.includes('city') || h.includes('location'));
    const icebreakerIdx = headers.findIndex((h) => h.includes('icebreaker') || h.includes('custom'));

    if (emailIdx === -1) {
      alert('Could not detect an "email" column in the CSV header. Please make sure the first line has an "email" header.');
      return;
    }

    const imported: Lead[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // Basic CSV split respecting quotes
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((v) => v.trim().replace(/^["']|["']$/g, ''));

      const email = values[emailIdx];
      if (!email || !email.includes('@')) continue;

      imported.push({
        id: `lead-csv-${Date.now()}-${i}`,
        email,
        firstName: firstIdx !== -1 ? values[firstIdx] || '' : '',
        lastName: lastIdx !== -1 ? values[lastIdx] || '' : '',
        company: companyIdx !== -1 ? values[companyIdx] || '' : '',
        jobTitle: titleIdx !== -1 ? values[titleIdx] || '' : '',
        industry: industryIdx !== -1 ? values[industryIdx] || '' : '',
        city: cityIdx !== -1 ? values[cityIdx] || '' : '',
        customIcebreaker: icebreakerIdx !== -1 ? values[icebreakerIdx] || '' : '',
        status: 'pending',
        currentStep: 0,
      });
    }

    if (imported.length > 0) {
      onUpdateLeads([...leads, ...imported]);
      setCsvText('');
      setIsCsvModalOpen(false);
    } else {
      alert('No valid lead rows with email addresses found.');
    }
  };

  const handleGenerateAiIcebreakers = async () => {
    if (leads.length === 0 || isGeneratingIcebreakers) return;

    setIsGeneratingIcebreakers(true);
    try {
      const res = await fetch('/api/ai/generate-icebreakers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: leads.slice(0, 10),
          productContext: 'High-response automated cold outreach and deliverability engine',
        }),
      });
      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        const updatedLeads = [...leads];
        data.results.forEach((item: { index: number; icebreaker: string }) => {
          if (updatedLeads[item.index]) {
            updatedLeads[item.index] = {
              ...updatedLeads[item.index],
              customIcebreaker: item.icebreaker,
            };
          }
        });
        onUpdateLeads(updatedLeads);
      }
    } catch (err) {
      console.error('Failed to generate icebreakers:', err);
      alert('Failed to generate icebreakers. Please check server status.');
    } finally {
      setIsGeneratingIcebreakers(false);
    }
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 text-slate-700">Pending</span>;
      case 'in_sequence':
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-blue-100 text-blue-800">In Sequence</span>;
      case 'step_1_sent':
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-indigo-100 text-indigo-800">Step 1 Sent</span>;
      case 'step_2_sent':
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-purple-100 text-purple-800">Follow-up 1 Sent</span>;
      case 'step_3_sent':
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-pink-100 text-pink-800">Follow-up 2 Sent</span>;
      case 'replied':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Replied</span>;
      case 'bounced':
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3" /> Bounced</span>;
      case 'completed':
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-200 text-slate-800">Completed</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Action & Stats Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 mb-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Prospects & Contact Database</h2>
            <p className="text-xs text-slate-500">
              Manage target accounts, generate hyper-personalized AI icebreakers, and import CSV lists.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerateAiIcebreakers}
              disabled={isGeneratingIcebreakers || leads.length === 0}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{isGeneratingIcebreakers ? 'Generating Icebreakers...' : 'AI Bulk Icebreakers'}</span>
            </button>

            <button
              onClick={() => setShowOneByOneDivision(!showOneByOneDivision)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add One by One</span>
              {showOneByOneDivision ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={handleResetToSample}
              className="text-xs text-slate-500 hover:text-slate-800 underline px-1"
              title="Reset to 5 verified sample leads"
            >
              Reset Samples
            </button>
          </div>
        </div>

        {/* Filter and Search */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, role, email..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 whitespace-nowrap">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="all">All Statuses ({leads.length})</option>
              <option value="pending">Pending</option>
              <option value="in_sequence">In Sequence</option>
              <option value="step_1_sent">Step 1 Sent</option>
              <option value="step_2_sent">Follow-up 1 Sent</option>
              <option value="replied">Replied (Won/Qualified)</option>
              <option value="bounced">Bounced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Division for Adding Emails One by One */}
      {showOneByOneDivision && (
        <div className="mb-6">
          <AddOneByOneDivision
            onAddLead={(lead) => onUpdateLeads([...leads, lead])}
            leads={leads}
            onRemoveLead={handleDeleteLead}
          />
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Prospect</th>
                <th className="px-4 py-3">Company & Role</th>
                <th className="px-4 py-3">Industry / City</th>
                <th className="px-4 py-3">AI Icebreaker / Hook</th>
                <th className="px-4 py-3">Sequence Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No prospects match your current search or filter.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Prospect Name & Email */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 text-xs">
                        {lead.firstName} {lead.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{lead.email}</div>
                    </td>

                    {/* Company & Role */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{lead.company}</div>
                      <div className="text-[11px] text-slate-500">{lead.jobTitle || 'Decision Maker'}</div>
                    </td>

                    {/* Industry & City */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-slate-700">{lead.industry || '—'}</div>
                      <div className="text-[11px] text-slate-400">{lead.city || '—'}</div>
                    </td>

                    {/* Custom Icebreaker Hook */}
                    <td className="px-4 py-3 max-w-xs">
                      {lead.customIcebreaker ? (
                        <p className="text-[11px] text-slate-700 bg-blue-50/70 p-1.5 rounded border border-blue-100 line-clamp-2 italic">
                          "{lead.customIcebreaker}"
                        </p>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No icebreaker yet</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(lead.status)}
                      {lead.currentStep > 0 && (
                        <div className="text-[10px] text-slate-400 mt-0.5">Stage {lead.currentStep}</div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                        title="Delete Prospect"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Showing {filteredLeads.length} of {leads.length} prospects</span>
          <span className="text-[11px]">
            {leads.filter((l) => l.customIcebreaker).length} personalized with AI icebreakers
          </span>
        </div>
      </div>

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Import Prospects from CSV</h3>
              </div>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Paste CSV data with headers (e.g. <code>email, firstName, lastName, company, jobTitle, industry</code>).
            </p>

            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`email,firstName,lastName,company,jobTitle,industry\nalex@acme.com,Alex,Taylor,Acme Corp,VP Engineering,SaaS\njordan@techflow.org,Jordan,Lee,TechFlow,Head of Growth,AI`}
              className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 mb-4"
            />

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <button
                onClick={() => {
                  setCsvText(
                    `email,firstName,lastName,company,jobTitle,industry\nkate.miller@vantagecloud.com,Kate,Miller,Vantage Cloud,Chief Technology Officer,Cloud DevOps\nliam.patel@streamlinecrm.io,Liam,Patel,Streamline CRM,Head of Sales Ops,Enterprise B2B`
                  );
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Insert Sample Data
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleParseAndImportCsv}
                  className="px-3.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Import Leads
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Single Lead Modal */}
      {isAddLeadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Add New Prospect</h3>
              </div>
              <button
                onClick={() => setIsAddLeadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSingleLead} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">First Name</label>
                  <input
                    type="text"
                    value={newLead.firstName}
                    onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
                    placeholder="e.g. Jessica"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Last Name</label>
                  <input
                    type="text"
                    value={newLead.lastName}
                    onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
                    placeholder="e.g. Gomez"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  placeholder="e.g. jessica@luminary.ai"
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 mt-1 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Company</label>
                  <input
                    type="text"
                    value={newLead.company}
                    onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                    placeholder="e.g. Luminary AI"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Job Title</label>
                  <input
                    type="text"
                    value={newLead.jobTitle}
                    onChange={(e) => setNewLead({ ...newLead, jobTitle: e.target.value })}
                    placeholder="e.g. VP of Product"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Industry</label>
                  <input
                    type="text"
                    value={newLead.industry}
                    onChange={(e) => setNewLead({ ...newLead, industry: e.target.value })}
                    placeholder="e.g. AI / Automation"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">City / Location</label>
                  <input
                    type="text"
                    value={newLead.city}
                    onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
                    placeholder="e.g. Austin, TX"
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Custom Icebreaker / Hook</label>
                <textarea
                  rows={2}
                  value={newLead.customIcebreaker}
                  onChange={(e) => setNewLead({ ...newLead, customIcebreaker: e.target.value })}
                  placeholder="e.g. Loved your recent podcast episode on scaling engineering teams."
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500 mt-1"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddLeadModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Prospect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
