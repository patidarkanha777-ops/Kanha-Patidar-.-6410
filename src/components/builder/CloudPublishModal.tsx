import React, { useState, useEffect } from "react";
import {
  Cloud,
  X,
  LogIn,
  LogOut,
  Save,
  Globe,
  Copy,
  Check,
  Trash2,
  FolderOpen,
  ExternalLink,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, googleProvider, OperationType, handleFirestoreError } from "../../firebase";
import type { BNode } from "./types";

interface CloudPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPageRoot: BNode;
  customCss: string;
  pageTitle: string;
  onLoadProject: (root: BNode, css: string, name: string) => void;
}

interface CloudProjectDoc {
  id: string;
  name: string;
  customCss: string;
  isPublished: boolean;
  root: BNode;
  updatedAt?: any;
}

export function CloudPublishModal({
  isOpen,
  onClose,
  currentPageRoot,
  customCss,
  pageTitle,
  onLoadProject,
}: CloudPublishModalProps) {
  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [projectName, setProjectName] = useState(pageTitle || "My Canvas Website");
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    return localStorage.getItem("canvas_active_cloud_project_id") || `proj_${Math.random().toString(36).slice(2, 10)}`;
  });
  const [projects, setProjects] = useState<CloudProjectDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  const fetchUserProjects = async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "projects"), where("ownerId", "==", uid));
      const snap = await getDocs(q);
      const list: CloudProjectDoc[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          name: data.name,
          customCss: data.customCss || "",
          isPublished: Boolean(data.isPublished),
          root: data.root as BNode,
          updatedAt: data.updatedAt,
        });
      });
      setProjects(list);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.LIST, "projects");
      } catch (formattedErr: any) {
        setError("Could not load cloud projects. Please verify permissions.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchUserProjects(user.uid);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err?.message || "Google Sign-In failed.");
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setProjects([]);
  };

  // Sanitize BNode recursively so no undefined values exist before writing to Firestore Map
  const cleanMap = (obj: any): any => {
    return JSON.parse(JSON.stringify(obj));
  };

  const handleSaveToCloud = async (publishLive = false) => {
    setError(null);
    setStatusMsg(null);
    if (publishLive) setPublishing(true);
    else setLoading(true);

    const safeId = activeProjectId.replace(/[^a-zA-Z0-9_-]/g, "") || `proj_${Date.now()}`;
    const safeName = (projectName.trim() || "Canvas Website").slice(0, 120);
    const safeCss = (customCss || "").slice(0, 50000);
    const cleanedRoot = cleanMap(currentPageRoot);

    try {
      // 1. Always register on Express backend for instant shareable link access
      await fetch("/api/sites/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: safeId,
          name: safeName,
          customCss: safeCss,
          root: cleanedRoot,
        }),
      });

      // 2. If signed in to Firebase, save permanently to Firestore /projects/{projectId}
      if (user) {
        const existingDoc = projects.find((p) => p.id === safeId);
        const path = `projects/${safeId}`;
        try {
          await setDoc(doc(db, "projects", safeId), {
            ownerId: user.uid,
            name: safeName,
            customCss: safeCss,
            isPublished: publishLive ? true : existingDoc?.isPublished ?? true,
            root: cleanedRoot,
            createdAt: existingDoc?.updatedAt ? existingDoc.updatedAt : serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, path);
        }
        await fetchUserProjects(user.uid);
      }

      localStorage.setItem("canvas_active_cloud_project_id", safeId);
      const generatedUrl = `${window.location.origin}/?live=${safeId}`;
      setLiveUrl(generatedUrl);
      setStatusMsg(
        publishLive
          ? "Website published live! Share the link below with anyone."
          : user
          ? "Saved to Firebase Cloud Firestore & Live Server!"
          : "Published to Live Server! (Sign in with Google below to also save permanently to your Firebase account)."
      );
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to save or publish project.");
    } finally {
      setLoading(false);
      setPublishing(false);
    }
  };

  const handleDeleteCloudProject = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "projects", id));
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `projects/${id}`);
    }
  };

  const copyLiveLink = () => {
    if (!liveUrl) return;
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#1c1917] border border-[#3c3836] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3c3836] bg-[#221f1d]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <Cloud size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
                Firebase Cloud Save & 1-Click Shareable Live Link
              </h3>
              <p className="text-xs text-stone-400">
                Save your projects to Firebase Firestore and generate a public live preview URL for clients.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Firebase Auth Bar */}
          <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between">
            {user ? (
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full border border-orange-500/40" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
                    {user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-stone-100">{user.displayName || "Signed-In Builder"}</div>
                  <div className="text-[11px] text-emerald-400">{user.email} · Connected to Firebase Cloud</div>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-xs font-bold text-stone-200">Sign in with Google for Permanent Cloud Storage</div>
                <div className="text-[11px] text-stone-400">
                  Sync your websites & form leads across all devices with Firebase Firestore.
                </div>
              </div>
            )}

            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="px-4 py-2 rounded-xl bg-white hover:bg-stone-200 text-stone-900 text-xs font-bold flex items-center gap-2 transition shadow"
              >
                <LogIn size={14} />
                <span>Sign in with Google</span>
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {statusMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Save & Publish Form */}
          <div className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Project Name</label>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Startup Landing Page"
                  className="w-full px-3 py-2 rounded-xl bg-[#121110] border border-stone-700 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Live Share Slug / ID</label>
                <input
                  value={activeProjectId}
                  onChange={(e) => setActiveProjectId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                  placeholder="my-site-1"
                  className="w-full px-3 py-2 rounded-xl bg-[#121110] border border-stone-700 text-xs font-mono text-orange-400 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleSaveToCloud(false)}
                disabled={loading || publishing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-700 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} className="text-orange-400" />}
                <span>Save to Cloud Database</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveToCloud(true)}
                disabled={loading || publishing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-orange-950/50"
              >
                {publishing ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                <span>1-Click Publish Shareable Live Link</span>
              </button>
            </div>

            {/* Live Shareable URL Box */}
            {liveUrl && (
              <div className="p-3.5 rounded-xl bg-black/60 border border-orange-500/40 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-orange-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={12} />
                    Live Shareable Client Preview URL
                  </span>
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline flex items-center gap-1 hover:text-orange-300"
                  >
                    <span>Open Live Site</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={liveUrl}
                    className="flex-1 px-3 py-2 rounded-lg bg-stone-900 border border-stone-800 text-xs font-mono text-stone-200"
                  />
                  <button
                    type="button"
                    onClick={copyLiveLink}
                    className="px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copied ? "Copied!" : "Copy Link"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Saved Cloud Projects List */}
          {user && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Your Saved Cloud Projects ({projects.length})
              </h4>
              {projects.length === 0 ? (
                <div className="p-6 rounded-xl bg-stone-900/40 border border-stone-800 text-center text-xs text-stone-500">
                  No cloud projects saved yet. Click "Save to Cloud Database" above to store your first project!
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-stone-100">{proj.name}</div>
                        <div className="text-[11px] font-mono text-stone-400">
                          ID: {proj.id} · {proj.isPublished ? "Published Live" : "Private Draft"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveProjectId(proj.id);
                            setProjectName(proj.name);
                            onLoadProject(proj.root, proj.customCss, proj.name);
                            setLiveUrl(`${window.location.origin}/?live=${proj.id}`);
                            setStatusMsg(`Loaded "${proj.name}" onto Canvas!`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <FolderOpen size={13} className="text-orange-400" />
                          <span>Load</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCloudProject(proj.id)}
                          className="p-1.5 text-stone-500 hover:text-red-400 transition"
                          title="Delete project"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
