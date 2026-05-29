"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  created_at: string;
  last_checkin?: string | null;
  checkin_count?: number;
}

export default function AdminDashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const fetchClients = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("name", { ascending: true });

    if (data) {
      const clientsWithStats = await Promise.all(
        data.map(async (client) => {
          const { data: checkins } = await supabase
            .from("checkins")
            .select("created_at")
            .eq("client_id", client.id)
            .order("created_at", { ascending: false })
            .limit(1);

          const { count } = await supabase
            .from("checkins")
            .select("*", { count: "exact", head: true })
            .eq("client_id", client.id);

          return {
            ...client,
            last_checkin: checkins?.[0]?.created_at || null,
            checkin_count: count || 0,
          };
        })
      );
      setClients(clientsWithStats);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-light tracking-tight text-text">
            Clients
          </h2>
          <p className="mt-1 font-sans text-sm text-text-muted">
            {clients.length} total · {clients.filter((c) => c.active).length}{" "}
            active
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-terracotta px-4 py-2.5 font-sans text-sm font-medium text-white transition hover:bg-terracotta/90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Client
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-text/10 bg-white px-4 py-2.5 font-sans text-sm text-text outline-none transition focus:border-terracotta focus:ring-1 focus:ring-terracotta/30"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-terracotta border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-text/5 bg-white p-12 text-center">
          <p className="font-sans text-text-muted">
            {search ? "No clients match your search" : "No clients yet"}
          </p>
          {!search && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 font-sans text-sm font-medium text-terracotta transition hover:text-terracotta/80"
            >
              Add your first client
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <button
              key={client.id}
              onClick={() => router.push(`/admin/clients/${client.id}`)}
              className="group rounded-xl border border-text/5 bg-white p-5 text-left transition hover:border-terracotta/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-sans text-base font-medium text-text group-hover:text-terracotta">
                    {client.name}
                  </h3>
                  {client.email && (
                    <p className="mt-0.5 font-sans text-xs text-text-muted">
                      {client.email}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 font-sans text-[10px] font-medium uppercase tracking-wider ${
                    client.active
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {client.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-text-muted">
                <span>{client.checkin_count} check-ins</span>
                <span>·</span>
                <span>
                  {client.last_checkin
                    ? `Last: ${new Date(client.last_checkin).toLocaleDateString()}`
                    : "No check-ins yet"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
            fetchClients();
          }}
        />
      )}
    </AdminLayout>
  );
}

function AddClientModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [newClientUrl, setNewClientUrl] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);

    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from("clients")
      .insert({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      })
      .select("id")
      .single();

    if (error) {
      alert("Failed to create client: " + error.message);
      setSaving(false);
      return;
    }

    const url = `${window.location.origin}/checkin/${data.id}`;
    setNewClientUrl(url);
    setSaving(false);
  }

  function copyUrl() {
    navigator.clipboard.writeText(newClientUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {newClientUrl ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="font-serif text-xl font-light text-text">
              Client Created!
            </h3>
            <p className="mt-2 font-sans text-sm text-text-muted">
              Share this unique check-in URL with your client:
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-bg p-3">
              <input
                readOnly
                value={newClientUrl}
                className="flex-1 bg-transparent font-mono text-xs text-text outline-none"
              />
              <button
                onClick={copyUrl}
                className="shrink-0 rounded-md bg-terracotta px-3 py-1.5 font-sans text-xs font-medium text-white transition hover:bg-terracotta/90"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <button
              onClick={onAdded}
              className="mt-6 font-sans text-sm font-medium text-terracotta transition hover:text-terracotta/80"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h3 className="mb-5 font-serif text-xl font-light text-text">
              Add New Client
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block font-sans text-xs font-medium uppercase tracking-wider text-text-muted">
                  Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-text/10 bg-white px-4 py-2.5 font-sans text-sm text-text outline-none transition focus:border-terracotta focus:ring-1 focus:ring-terracotta/30"
                  placeholder="Client name"
                />
              </div>
              <div>
                <label className="mb-1 block font-sans text-xs font-medium uppercase tracking-wider text-text-muted">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full rounded-lg border border-text/10 bg-white px-4 py-2.5 font-sans text-sm text-text outline-none transition focus:border-terracotta focus:ring-1 focus:ring-terracotta/30"
                  placeholder="client@email.com"
                />
              </div>
              <div>
                <label className="mb-1 block font-sans text-xs font-medium uppercase tracking-wider text-text-muted">
                  Phone
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-text/10 bg-white px-4 py-2.5 font-sans text-sm text-text outline-none transition focus:border-terracotta focus:ring-1 focus:ring-terracotta/30"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="mb-1 block font-sans text-xs font-medium uppercase tracking-wider text-text-muted">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-text/10 bg-white px-4 py-2.5 font-sans text-sm text-text outline-none transition focus:border-terracotta focus:ring-1 focus:ring-terracotta/30"
                  placeholder="Training goals, injuries, preferences..."
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-text/10 px-4 py-2.5 font-sans text-sm font-medium text-text-muted transition hover:bg-bg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || saving}
                className="flex-1 rounded-lg bg-terracotta px-4 py-2.5 font-sans text-sm font-medium text-white transition hover:bg-terracotta/90 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Client"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
