"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Users as UsersIcon,
  FileText,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Check,
  Shield,
  UserCheck,
  AlertCircle,
  Calendar,
  Tag,
  MapPin,
  Star,
  Award,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAdminStats,
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getAdminPosts,
  createAdminPost,
  updateAdminPost,
  deleteAdminPost,
  getAdminErrors,
  createAdminError,
  updateAdminError,
  deleteAdminError,
  getAdminSolutions,
  createAdminSolution,
  updateAdminSolution,
  deleteAdminSolution,
  getAdminComments,
  createAdminComment,
  updateAdminComment,
  deleteAdminComment,
  getAdminUserOptions,
  getAdminErrorOptions,
  getAdminPostOptions,
} from "@/app/actions/adminActions";

type Tab = "dashboard" | "users" | "posts" | "errors" | "solutions" | "comments";

export default function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Stats State
  const [stats, setStats] = useState<any>(null);

  // Entities Data
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [solutions, setSolutions] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 8;

  // Dropdown options for relations
  const [userOptions, setUserOptions] = useState<any[]>([]);
  const [errorOptions, setErrorOptions] = useState<any[]>([]);
  const [postOptions, setPostOptions] = useState<any[]>([]);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form States
  const [userForm, setUserForm] = useState({
    email: "",
    username: "",
    name: "",
    password: "",
    bio: "",
    totalPoints: 0,
    isVerified: false,
    title: "",
  });

  const [postForm, setPostForm] = useState({
    authorId: "",
    caption: "",
    location: "",
    tags: "",
    mediaUrl: "",
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
  });

  const [errorForm, setErrorForm] = useState({
    authorId: "",
    title: "",
    description: "",
    code: "",
    points: 10,
    category: "frontend",
    difficulty: "easy",
    isSolved: false,
  });

  const [solutionForm, setSolutionForm] = useState({
    errorId: "",
    authorId: "",
    content: "",
    isApproved: false,
    rate: 0,
    earnedPoints: 0,
  });

  const [commentForm, setCommentForm] = useState({
    postId: "",
    authorId: "",
    content: "",
    likesCount: 0,
  });

  // Load stats and options
  useEffect(() => {
    loadStats();
    loadRelationOptions();
  }, []);

  // Reload data when tab, search, or page changes
  useEffect(() => {
    setPage(1);
    fetchTabData(activeTab, search, 1);
  }, [activeTab, search]);

  const loadStats = async () => {
    const res = await getAdminStats();
    if (res.success) {
      setStats(res.stats);
    } else {
      toast.error(res.error || "Failed to load admin stats");
    }
  };

  const loadRelationOptions = async () => {
    const [uRes, eRes, pRes] = await Promise.all([
      getAdminUserOptions(),
      getAdminErrorOptions(),
      getAdminPostOptions(),
    ]);
    if (uRes.success) setUserOptions(uRes.users || []);
    if (eRes.success) setErrorOptions(eRes.errors || []);
    if (pRes.success) setPostOptions(pRes.posts || []);
  };

  const fetchTabData = (tab: Tab, query: string, targetPage: number) => {
    startTransition(async () => {
      let res: any;
      if (tab === "users") {
        res = await getAdminUsers(query, targetPage, limit);
        if (res.success) {
          setUsers(res.users);
          setTotalItems(res.total);
        }
      } else if (tab === "posts") {
        res = await getAdminPosts(query, targetPage, limit);
        if (res.success) {
          setPosts(res.posts);
          setTotalItems(res.total);
        }
      } else if (tab === "errors") {
        res = await getAdminErrors(query, targetPage, limit);
        if (res.success) {
          setErrors(res.errors);
          setTotalItems(res.total);
        }
      } else if (tab === "solutions") {
        res = await getAdminSolutions(query, targetPage, limit);
        if (res.success) {
          setSolutions(res.solutions);
          setTotalItems(res.total);
        }
      } else if (tab === "comments") {
        res = await getAdminComments(query, targetPage, limit);
        if (res.success) {
          setComments(res.comments);
          setTotalItems(res.total);
        }
      }
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchTabData(activeTab, search, newPage);
  };

  // CRUD handlers
  const openCreateModal = () => {
    // Reset forms
    setUserForm({
      email: "",
      username: "",
      name: "",
      password: "",
      bio: "",
      totalPoints: 0,
      isVerified: false,
      title: "novice",
    });
    setPostForm({
      authorId: userOptions[0]?.id || "",
      caption: "",
      location: "",
      tags: "",
      mediaUrl: "",
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
    });
    setErrorForm({
      authorId: userOptions[0]?.id || "",
      title: "",
      description: "",
      code: "",
      points: 10,
      category: "frontend",
      difficulty: "easy",
      isSolved: false,
    });
    setSolutionForm({
      errorId: errorOptions[0]?.id || "",
      authorId: userOptions[0]?.id || "",
      content: "",
      isApproved: false,
      rate: 0,
      earnedPoints: 0,
    });
    setCommentForm({
      postId: postOptions[0]?.id || "",
      authorId: userOptions[0]?.id || "",
      content: "",
      likesCount: 0,
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let res: any;

    if (activeTab === "users") {
      res = await createAdminUser(userForm);
    } else if (activeTab === "posts") {
      res = await createAdminPost(postForm);
    } else if (activeTab === "errors") {
      res = await createAdminError(errorForm);
    } else if (activeTab === "solutions") {
      res = await createAdminSolution(solutionForm);
    } else if (activeTab === "comments") {
      res = await createAdminComment(commentForm);
    }

    if (res && res.success) {
      toast.success(`${activeTab.slice(0, -1)} created successfully!`);
      setIsCreateModalOpen(false);
      loadStats();
      loadRelationOptions();
      fetchTabData(activeTab, search, page);
    } else {
      toast.error(res?.error || "Creation failed");
    }
  };

  const openEditModal = (item: any) => {
    setSelectedItem(item);
    if (activeTab === "users") {
      setUserForm({
        email: item.email || "",
        username: item.username || "",
        name: item.name || "",
        password: "", // Not editable this way
        bio: item.bio || "",
        totalPoints: item.totalPoints || 0,
        isVerified: !!item.isVerified,
        title: item.title || "novice",
      });
    } else if (activeTab === "posts") {
      setPostForm({
        authorId: item.authorId || "",
        caption: item.caption || "",
        location: item.location || "",
        tags: item.tags ? item.tags.join(", ") : "",
        mediaUrl: item.mediaUrl || "",
        likesCount: item.likesCount || 0,
        commentsCount: item.commentsCount || 0,
        sharesCount: item.sharesCount || 0,
      });
    } else if (activeTab === "errors") {
      setErrorForm({
        authorId: item.authorId || "",
        title: item.title || "",
        description: item.description || "",
        code: item.code || "",
        points: item.points || 0,
        category: item.category || "frontend",
        difficulty: item.difficulty || "easy",
        isSolved: !!item.isSolved,
      });
    } else if (activeTab === "solutions") {
      setSolutionForm({
        errorId: item.errorId || "",
        authorId: item.authorId || "",
        content: item.content || "",
        isApproved: !!item.isApproved,
        rate: item.rate || 0,
        earnedPoints: item.earnedPoints || 0,
      });
    } else if (activeTab === "comments") {
      setCommentForm({
        postId: item.postId || "",
        authorId: item.authorId || "",
        content: item.content || "",
        likesCount: item.likesCount || 0,
      });
    }
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    let res: any;

    if (activeTab === "users") {
      res = await updateAdminUser(selectedItem.id, userForm);
    } else if (activeTab === "posts") {
      res = await updateAdminPost(selectedItem.id, postForm);
    } else if (activeTab === "errors") {
      res = await updateAdminError(selectedItem.id, errorForm);
    } else if (activeTab === "solutions") {
      res = await updateAdminSolution(selectedItem.id, solutionForm);
    } else if (activeTab === "comments") {
      res = await updateAdminComment(selectedItem.id, commentForm);
    }

    if (res && res.success) {
      toast.success(`${activeTab.slice(0, -1)} updated successfully!`);
      setIsEditModalOpen(false);
      loadStats();
      fetchTabData(activeTab, search, page);
    } else {
      toast.error(res?.error || "Update failed");
    }
  };

  const openDeleteModal = (item: any) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    let res: any;

    if (activeTab === "users") {
      res = await deleteAdminUser(selectedItem.id);
    } else if (activeTab === "posts") {
      res = await deleteAdminPost(selectedItem.id);
    } else if (activeTab === "errors") {
      res = await deleteAdminError(selectedItem.id);
    } else if (activeTab === "solutions") {
      res = await deleteAdminSolution(selectedItem.id);
    } else if (activeTab === "comments") {
      res = await deleteAdminComment(selectedItem.id);
    }

    if (res && res.success) {
      toast.success(`${activeTab.slice(0, -1)} deleted successfully!`);
      setIsDeleteModalOpen(false);
      loadStats();
      loadRelationOptions();
      fetchTabData(activeTab, search, page);
    } else {
      toast.error(res?.error || "Deletion failed");
    }
  };

  const totalPages = Math.ceil(totalItems / limit) || 1;

  // Custom Chart Builders
  const renderCategoryChart = () => {
    if (!stats || !stats.errorsByCategory || stats.errorsByCategory.length === 0) {
      return <div className="text-light-4 text-sm">No data available</div>;
    }
    const colors = ["#877EFF", "#FFB620", "#FF5A5A", "#5D5FEF", "#38BDF8"];
    const totalErrors = stats.errorsByCategory.reduce((sum: number, c: any) => sum + c.count, 0);

    let cumulativePercent = 0;
    return (
      <div className="flex flex-col md:flex-row items-center gap-6">
        <svg width="180" height="180" className="rotate-[-90deg]">
          {stats.errorsByCategory.map((c: any, i: number) => {
            const percent = (c.count / totalErrors) * 100;
            const strokeDasharray = `${percent} ${100 - percent}`;
            const strokeDashoffset = 100 - cumulativePercent + 25; // 25 coordinates center
            cumulativePercent += percent;
            return (
              <circle
                key={c.category}
                cx="90"
                cy="90"
                r="70"
                fill="transparent"
                stroke={colors[i % colors.length]}
                strokeWidth="24"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                pathLength="100"
                className="transition-all duration-1000 hover:stroke-[28px] cursor-pointer"
              />
            );
          })}
        </svg>
        <div className="flex flex-col gap-2">
          {stats.errorsByCategory.map((c: any, i: number) => (
            <div key={c.category} className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: colors[i % colors.length] }}
              />
              <span className="text-sm font-medium text-light-2 capitalize">
                {c.category.replace("_", " ")}
              </span>
              <span className="text-xs text-light-4">
                ({c.count} errors - {Math.round((c.count / totalErrors) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDifficultyChart = () => {
    if (!stats || !stats.errorsByDifficulty || stats.errorsByDifficulty.length === 0) {
      return <div className="text-light-4 text-sm">No data available</div>;
    }
    const maxVal = Math.max(...stats.errorsByDifficulty.map((d: any) => d.count)) || 1;
    const diffColors: Record<string, string> = {
      easy: "#10B981",
      medium: "#FFB620",
      hard: "#F97316",
      expert: "#FF5A5A",
    };

    return (
      <div className="flex flex-col gap-4 w-full pt-2">
        {stats.errorsByDifficulty.map((d: any) => {
          const percentage = (d.count / maxVal) * 100;
          return (
            <div key={d.difficulty} className="flex flex-col gap-1 w-full">
              <div className="flex justify-between text-sm">
                <span className="capitalize font-medium text-light-2">{d.difficulty}</span>
                <span className="text-light-4 font-semibold">{d.count} errors</span>
              </div>
              <div className="w-full h-3.5 bg-dark-4 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: diffColors[d.difficulty] || "#5c5c7b",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full h-full min-h-0 bg-dark-1 text-white overflow-hidden">
      {/* Admin Panel Header */}
      <div className="flex flex-col gap-1.5 md:flex-row md:justify-between md:items-center px-6 py-6 md:px-8 border-b border-dark-4 shrink-0 bg-dark-2">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary-500/10 text-primary-500 rounded-lg">
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <h1 className="h2-bold text-transparent bg-clip-text bg-gradient-to-r from-light-1 to-primary-500">
              System Control Room
            </h1>
          </div>
          <p className="small-regular text-light-3">
            Manage users, posts, error reports, solutions, and site comments
          </p>
        </div>
        {activeTab !== "dashboard" && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white text-sm font-semibold rounded-xl transition duration-200 shadow-lg shadow-primary-500/20"
          >
            <Plus className="w-4 h-4" />
            Create {activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}
          </button>
        )}
      </div>

      {/* Tabs list */}
      <div className="flex px-4 md:px-8 py-3 bg-dark-2/50 border-b border-dark-4 gap-2 overflow-x-auto hide-scrollbar shrink-0">
        {[
          { id: "dashboard", label: "Overview", icon: FileText },
          { id: "users", label: "Users", icon: UsersIcon },
          { id: "posts", label: "Posts", icon: FileText },
          { id: "errors", label: "Errors (Hunts)", icon: AlertTriangle },
          { id: "solutions", label: "Solutions", icon: CheckCircle },
          { id: "comments", label: "Comments", icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 shrink-0 border border-transparent ${
                isActive
                  ? "bg-primary-500/10 text-primary-500 border-primary-500/20 shadow-[0_0_15px_rgba(135,126,255,0.1)]"
                  : "text-light-3 hover:text-light-1 hover:bg-dark-4"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
        {activeTab === "dashboard" ? (
          // DASHBOARD OVERVIEW TAB
          <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {[
                {
                  label: "Total Users",
                  val: stats?.users ?? 0,
                  sub: `${stats?.verifiedUsers ?? 0} verified`,
                  icon: UsersIcon,
                  color: "from-blue-600/20 to-blue-400/5 text-blue-400 border-blue-500/20",
                },
                {
                  label: "Total Posts",
                  val: stats?.posts ?? 0,
                  sub: "Shared on feed",
                  icon: FileText,
                  color: "from-fuchsia-600/20 to-fuchsia-400/5 text-fuchsia-400 border-fuchsia-500/20",
                },
                {
                  label: "Bug Hunts",
                  val: stats?.errors ?? 0,
                  sub: "Developer errors",
                  icon: AlertTriangle,
                  color: "from-amber-600/20 to-amber-400/5 text-amber-400 border-amber-500/20",
                },
                {
                  label: "Solutions",
                  val: stats?.solutions ?? 0,
                  sub: "Submissions",
                  icon: CheckCircle,
                  color: "from-emerald-600/20 to-emerald-400/5 text-emerald-400 border-emerald-500/20",
                },
                {
                  label: "Comments",
                  val: stats?.comments ?? 0,
                  sub: "Feed interactions",
                  icon: MessageSquare,
                  color: "from-cyan-600/20 to-cyan-400/5 text-cyan-400 border-cyan-500/20",
                },
              ].map((m, idx) => {
                const Icon = m.icon;
                return (
                  <div
                    key={idx}
                    className={`flex flex-col p-5 bg-gradient-to-br ${m.color} border rounded-2xl shadow-xl backdrop-blur-md`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-semibold text-light-3 uppercase tracking-wider">
                        {m.label}
                      </span>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-3xl font-extrabold text-light-1 tracking-tight">
                      {isPending ? (
                        <Loader2 className="w-8 h-8 animate-spin text-light-3" />
                      ) : (
                        m.val
                      )}
                    </div>
                    <span className="text-[11px] text-light-4 font-medium mt-1.5">{m.sub}</span>
                  </div>
                );
              })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
              <div className="flex flex-col p-6 md:p-8 bg-dark-2 rounded-2xl border border-dark-4">
                <h3 className="text-lg font-bold text-light-1 mb-6 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary-500" />
                  Errors by Category
                </h3>
                <div className="flex-1 flex items-center justify-center min-h-[220px]">
                  {renderCategoryChart()}
                </div>
              </div>

              <div className="flex flex-col p-6 md:p-8 bg-dark-2 rounded-2xl border border-dark-4">
                <h3 className="text-lg font-bold text-light-1 mb-6 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Errors by Difficulty
                </h3>
                <div className="flex-1 flex items-center justify-center min-h-[220px]">
                  {renderDifficultyChart()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // CRUD TABLES TAB
          <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            {/* Search Filters */}
            <div className="flex flex-col gap-3 sm:flex-row bg-dark-2 p-4 rounded-xl border border-dark-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-light-4" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-4 rounded-lg text-sm border-none placeholder:text-light-4 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Table Container */}
            <div className="w-full bg-dark-2 border border-dark-4 rounded-xl overflow-hidden shadow-2xl">
              {isPending ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-light-3">
                  <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                  <p className="text-sm font-semibold">Syncing database data...</p>
                </div>
              ) : totalItems === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-light-4">
                  <AlertCircle className="w-12 h-12 mb-3 text-light-4" />
                  <p className="text-base font-bold">No results found</p>
                  <p className="text-xs">Try clearing search filters or create a new entry</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {/* Users Table */}
                  {activeTab === "users" && (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-dark-4 bg-dark-3 text-light-3 text-xs uppercase tracking-wider font-semibold">
                          <th className="py-4 px-6">User</th>
                          <th className="py-4 px-6">Email</th>
                          <th className="py-4 px-6">Rank Title</th>
                          <th className="py-4 px-6 text-center">Points</th>
                          <th className="py-4 px-6 text-center">Verified</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-4 text-sm text-light-2">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-dark-3/45 transition">
                            <td className="py-4 px-6 flex items-center gap-3">
                              <img
                                src={u.image || "/icons/profile-placeholder.svg"}
                                alt={u.username || "avatar"}
                                className="w-9 h-9 rounded-full object-cover border border-dark-4"
                              />
                              <div className="flex flex-col">
                                <span className="font-bold text-light-1">{u.name || "N/A"}</span>
                                <span className="text-xs text-light-4">@{u.username}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-light-3">{u.email}</td>
                            <td className="py-4 px-6">
                              <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-dark-4 text-primary-500 capitalize">
                                {u.title ? u.title.replace("_", " ") : "Novice"}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center font-bold text-amber-400">
                              {u.totalPoints || 0}
                            </td>
                            <td className="py-4 px-6 text-center">
                              {u.isVerified ? (
                                <UserCheck className="w-5 h-5 mx-auto text-emerald-400" />
                              ) : (
                                <span className="text-xs text-light-4">No</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => openEditModal(u)}
                                  className="p-1.5 hover:bg-dark-4 text-light-3 hover:text-primary-500 rounded-lg transition"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(u)}
                                  className="p-1.5 hover:bg-red/10 text-light-3 hover:text-red rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Posts Table */}
                  {activeTab === "posts" && (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-dark-4 bg-dark-3 text-light-3 text-xs uppercase tracking-wider font-semibold">
                          <th className="py-4 px-6">Author</th>
                          <th className="py-4 px-6">Caption</th>
                          <th className="py-4 px-6">Location</th>
                          <th className="py-4 px-6">Stats (L/C/S)</th>
                          <th className="py-4 px-6">Date</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-4 text-sm text-light-2">
                        {posts.map((p) => (
                          <tr key={p.id} className="hover:bg-dark-3/45 transition">
                            <td className="py-4 px-6">
                              <span className="font-semibold text-light-1">
                                {p.author?.name || "Deleted User"}
                              </span>
                              <div className="text-xs text-light-4">@{p.author?.username}</div>
                            </td>
                            <td className="py-4 px-6 max-w-xs truncate text-light-3">
                              {p.caption || "No caption"}
                            </td>
                            <td className="py-4 px-6 text-light-4 flex items-center gap-1 mt-3">
                              {p.location ? (
                                <>
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>{p.location}</span>
                                </>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-xs bg-dark-4 px-2 py-1 rounded text-light-3">
                                {p.likesCount} / {p.commentsCount} / {p.sharesCount}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-xs text-light-4">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => openEditModal(p)}
                                  className="p-1.5 hover:bg-dark-4 text-light-3 hover:text-primary-500 rounded-lg transition"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(p)}
                                  className="p-1.5 hover:bg-red/10 text-light-3 hover:text-red rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Errors Table */}
                  {activeTab === "errors" && (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-dark-4 bg-dark-3 text-light-3 text-xs uppercase tracking-wider font-semibold">
                          <th className="py-4 px-6">Title</th>
                          <th className="py-4 px-6">Author</th>
                          <th className="py-4 px-6">Category</th>
                          <th className="py-4 px-6">Difficulty</th>
                          <th className="py-4 px-6 text-center">Reward</th>
                          <th className="py-4 px-6 text-center">Solved</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-4 text-sm text-light-2">
                        {errors.map((e) => (
                          <tr key={e.id} className="hover:bg-dark-3/45 transition">
                            <td className="py-4 px-6">
                              <div className="font-semibold text-light-1">{e.title}</div>
                            </td>
                            <td className="py-4 px-6 text-xs text-light-4">
                              {e.author?.name || `ID: ${e.authorId}`}
                            </td>
                            <td className="py-4 px-6 capitalize text-light-3">
                              {e.category ? e.category.replace("_", " ") : "-"}
                            </td>
                            <td className="py-4 px-6 capitalize">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  e.difficulty === "easy"
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : e.difficulty === "medium"
                                      ? "bg-amber-500/10 text-amber-400"
                                      : e.difficulty === "hard"
                                        ? "bg-orange-500/10 text-orange-400"
                                        : "bg-red/10 text-red"
                                }`}
                              >
                                {e.difficulty}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center font-bold text-amber-400">
                              {e.points}
                            </td>
                            <td className="py-4 px-6 text-center">
                              {e.isSolved ? (
                                <CheckCircle className="w-5 h-5 mx-auto text-emerald-400" />
                              ) : (
                                <span className="text-xs text-light-4">No</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => openEditModal(e)}
                                  className="p-1.5 hover:bg-dark-4 text-light-3 hover:text-primary-500 rounded-lg transition"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(e)}
                                  className="p-1.5 hover:bg-red/10 text-light-3 hover:text-red rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Solutions Table */}
                  {activeTab === "solutions" && (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-dark-4 bg-dark-3 text-light-3 text-xs uppercase tracking-wider font-semibold">
                          <th className="py-4 px-6">Error Hunt</th>
                          <th className="py-4 px-6">Solver</th>
                          <th className="py-4 px-6">Snippet / Summary</th>
                          <th className="py-4 px-6 text-center">Approved</th>
                          <th className="py-4 px-6 text-center">Stars</th>
                          <th className="py-4 px-6 text-center">Pts Earned</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-4 text-sm text-light-2">
                        {solutions.map((s) => (
                          <tr key={s.id} className="hover:bg-dark-3/45 transition">
                            <td className="py-4 px-6 max-w-[150px] truncate text-light-1">
                              {s.error?.title || "Deleted Error"}
                            </td>
                            <td className="py-4 px-6 text-xs text-light-4">
                              {s.author?.name || `ID: ${s.authorId}`}
                            </td>
                            <td className="py-4 px-6 max-w-xs truncate text-light-3">
                              {s.content}
                            </td>
                            <td className="py-4 px-6 text-center">
                              {s.isApproved ? (
                                <CheckCircle className="w-5 h-5 mx-auto text-emerald-400" />
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="py-4 px-6 text-center text-amber-400 font-semibold flex items-center justify-center gap-0.5 mt-3">
                              <Star className="w-3.5 h-3.5 fill-amber-400" />
                              <span>{s.rate}</span>
                            </td>
                            <td className="py-4 px-6 text-center text-amber-400 font-bold">
                              {s.earnedPoints}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => openEditModal(s)}
                                  className="p-1.5 hover:bg-dark-4 text-light-3 hover:text-primary-500 rounded-lg transition"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(s)}
                                  className="p-1.5 hover:bg-red/10 text-light-3 hover:text-red rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Comments Table */}
                  {activeTab === "comments" && (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-dark-4 bg-dark-3 text-light-3 text-xs uppercase tracking-wider font-semibold">
                          <th className="py-4 px-6">Post ID / Caption</th>
                          <th className="py-4 px-6">Author</th>
                          <th className="py-4 px-6 flex-1">Content</th>
                          <th className="py-4 px-6 text-center">Likes</th>
                          <th className="py-4 px-6">Date</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-4 text-sm text-light-2">
                        {comments.map((c) => (
                          <tr key={c.id} className="hover:bg-dark-3/45 transition">
                            <td className="py-4 px-6 max-w-[180px] truncate text-light-3">
                              {c.post?.caption || `Post: ${c.post?.id?.substring(0, 8)}`}
                            </td>
                            <td className="py-4 px-6 text-xs text-light-4">
                              {c.author?.name || `ID: ${c.authorId}`}
                            </td>
                            <td className="py-4 px-6 max-w-sm truncate text-light-1">
                              {c.content}
                            </td>
                            <td className="py-4 px-6 text-center text-fuchsia-400 font-bold">
                              {c.likesCount}
                            </td>
                            <td className="py-4 px-6 text-xs text-light-4">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => openEditModal(c)}
                                  className="p-1.5 hover:bg-dark-4 text-light-3 hover:text-primary-500 rounded-lg transition"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(c)}
                                  className="p-1.5 hover:bg-red/10 text-light-3 hover:text-red rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* Pagination controls */}
            {totalItems > limit && (
              <div className="flex justify-between items-center px-2 py-4 shrink-0 bg-transparent">
                <span className="text-xs text-light-4 font-medium">
                  Showing page {page} of {totalPages} ({totalItems} total items)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="px-4 py-2 bg-dark-2 hover:bg-dark-4 disabled:opacity-40 disabled:hover:bg-dark-2 text-xs font-bold rounded-lg border border-dark-4 transition"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    className="px-4 py-2 bg-dark-2 hover:bg-dark-4 disabled:opacity-40 disabled:hover:bg-dark-2 text-xs font-bold rounded-lg border border-dark-4 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE DIALOG MODAL (PURE REACT GLASSMORPHISM) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-5 border-b border-dark-4 bg-dark-3">
              <h3 className="text-base font-bold text-light-1">
                Create New {activeTab.slice(0, -1).toUpperCase()}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-dark-4 text-light-3 hover:text-light-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {activeTab === "users" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Username</label>
                    <input
                      type="text"
                      required
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Password</label>
                    <input
                      type="password"
                      placeholder="At least 8 chars"
                      required
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Bio</label>
                    <textarea
                      value={userForm.bio}
                      onChange={(e) => setUserForm({ ...userForm, bio: e.target.value })}
                      className="w-full h-24 px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 resize-none focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-light-3 mb-1.5">Total Points</label>
                      <input
                        type="number"
                        value={userForm.totalPoints}
                        onChange={(e) => setUserForm({ ...userForm, totalPoints: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-light-3 mb-1.5">Rank Title</label>
                      <select
                        value={userForm.title}
                        onChange={(e) => setUserForm({ ...userForm, title: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none capitalize"
                      >
                        {["novice", "apprentice", "journeyman", "expert", "master", "grandmaster", "legend", "the_debuger", "master_of_Code"].map((t) => (
                          <option key={t} value={t} className="bg-dark-3">
                            {t.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="verified"
                      checked={userForm.isVerified}
                      onChange={(e) => setUserForm({ ...userForm, isVerified: e.target.checked })}
                      className="w-4 h-4 rounded bg-dark-4 border-none text-primary-500 focus:ring-0 focus:outline-none"
                    />
                    <label htmlFor="verified" className="text-sm text-light-2 font-medium">Verify User Account</label>
                  </div>
                </>
              )}

              {activeTab === "posts" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Post Author</label>
                    <select
                      value={postForm.authorId}
                      onChange={(e) => setPostForm({ ...postForm, authorId: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    >
                      {userOptions.map((u) => (
                        <option key={u.id} value={u.id} className="bg-dark-3">
                          {u.name || u.username} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Post Caption</label>
                    <textarea
                      required
                      value={postForm.caption}
                      onChange={(e) => setPostForm({ ...postForm, caption: e.target.value })}
                      className="w-full h-24 px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 resize-none focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Location</label>
                    <input
                      type="text"
                      value={postForm.location}
                      onChange={(e) => setPostForm({ ...postForm, location: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Tags (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. react, design, admin"
                      value={postForm.tags}
                      onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Media URL</label>
                    <input
                      type="text"
                      value={postForm.mediaUrl}
                      onChange={(e) => setPostForm({ ...postForm, mediaUrl: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {activeTab === "errors" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Error Author</label>
                    <select
                      value={errorForm.authorId}
                      onChange={(e) => setErrorForm({ ...errorForm, authorId: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    >
                      {userOptions.map((u) => (
                        <option key={u.id} value={u.id} className="bg-dark-3">
                          {u.name || u.username} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Error Title</label>
                    <input
                      type="text"
                      required
                      value={errorForm.title}
                      onChange={(e) => setErrorForm({ ...errorForm, title: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Description</label>
                    <textarea
                      value={errorForm.description}
                      onChange={(e) => setErrorForm({ ...errorForm, description: e.target.value })}
                      className="w-full h-24 px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 resize-none focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Code Snippet</label>
                    <textarea
                      value={errorForm.code}
                      onChange={(e) => setErrorForm({ ...errorForm, code: e.target.value })}
                      className="w-full h-24 px-4 py-2 bg-dark-4 font-mono text-xs rounded-lg border-none text-light-1 resize-none focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-light-3 mb-1.5">Points Reward</label>
                      <input
                        type="number"
                        value={errorForm.points}
                        onChange={(e) => setErrorForm({ ...errorForm, points: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-light-3 mb-1.5">Category</label>
                      <select
                        value={errorForm.category}
                        onChange={(e) => setErrorForm({ ...errorForm, category: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none capitalize"
                      >
                        {["frontend", "backend", "problem_solving", "ai_ml", "mobile_dev"].map((c) => (
                          <option key={c} value={c} className="bg-dark-3">
                            {c.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-light-3 mb-1.5">Difficulty</label>
                      <select
                        value={errorForm.difficulty}
                        onChange={(e) => setErrorForm({ ...errorForm, difficulty: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none capitalize"
                      >
                        {["easy", "medium", "hard", "expert"].map((d) => (
                          <option key={d} value={d} className="bg-dark-3">
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "solutions" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Target Error Hunt</label>
                    <select
                      value={solutionForm.errorId}
                      onChange={(e) => setSolutionForm({ ...solutionForm, errorId: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    >
                      {errorOptions.map((err) => (
                        <option key={err.id} value={err.id} className="bg-dark-3">
                          {err.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Author (Solver)</label>
                    <select
                      value={solutionForm.authorId}
                      onChange={(e) => setSolutionForm({ ...solutionForm, authorId: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    >
                      {userOptions.map((u) => (
                        <option key={u.id} value={u.id} className="bg-dark-3">
                          {u.name || u.username} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Solution Content</label>
                    <textarea
                      required
                      value={solutionForm.content}
                      onChange={(e) => setSolutionForm({ ...solutionForm, content: e.target.value })}
                      className="w-full h-24 px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 resize-none focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-light-3 mb-1.5">Star Rating (0-5)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="5"
                        value={solutionForm.rate}
                        onChange={(e) => setSolutionForm({ ...solutionForm, rate: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-light-3 mb-1.5">Earned Points</label>
                      <input
                        type="number"
                        value={solutionForm.earnedPoints}
                        onChange={(e) => setSolutionForm({ ...solutionForm, earnedPoints: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="approved"
                      checked={solutionForm.isApproved}
                      onChange={(e) => setSolutionForm({ ...solutionForm, isApproved: e.target.checked })}
                      className="w-4 h-4 rounded bg-dark-4 border-none text-primary-500 focus:ring-0 focus:outline-none"
                    />
                    <label htmlFor="approved" className="text-sm text-light-2 font-medium">Mark as Approved Solution</label>
                  </div>
                </>
              )}

              {activeTab === "comments" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Target Post</label>
                    <select
                      value={commentForm.postId}
                      onChange={(e) => setCommentForm({ ...commentForm, postId: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    >
                      {postOptions.map((p) => (
                        <option key={p.id} value={p.id} className="bg-dark-3">
                          {p.caption}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Author</label>
                    <select
                      value={commentForm.authorId}
                      onChange={(e) => setCommentForm({ ...commentForm, authorId: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    >
                      {userOptions.map((u) => (
                        <option key={u.id} value={u.id} className="bg-dark-3">
                          {u.name || u.username} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Content</label>
                    <textarea
                      required
                      value={commentForm.content}
                      onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                      className="w-full h-24 px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 resize-none focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-dark-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 bg-dark-4 hover:bg-dark-3 text-xs font-semibold rounded-xl text-light-2 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-xs font-semibold rounded-xl text-white transition shadow-lg shadow-primary-500/10"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DIALOG MODAL (PURE REACT GLASSMORPHISM) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-5 border-b border-dark-4 bg-dark-3">
              <h3 className="text-base font-bold text-light-1">
                Edit {activeTab.slice(0, -1).toUpperCase()} details
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 hover:bg-dark-4 text-light-3 hover:text-light-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {activeTab === "users" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Username</label>
                    <input
                      type="text"
                      required
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Bio</label>
                    <textarea
                      value={userForm.bio}
                      onChange={(e) => setUserForm({ ...userForm, bio: e.target.value })}
                      className="w-full h-24 px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 resize-none focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-light-3 mb-1.5">Total Points</label>
                      <input
                        type="number"
                        value={userForm.totalPoints}
                        onChange={(e) => setUserForm({ ...userForm, totalPoints: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-light-3 mb-1.5">Rank Title</label>
                      <select
                        value={userForm.title}
                        onChange={(e) => setUserForm({ ...userForm, title: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none capitalize"
                      >
                        {["novice", "apprentice", "journeyman", "expert", "master", "grandmaster", "legend", "the_debuger", "master_of_Code"].map((t) => (
                          <option key={t} value={t} className="bg-dark-3">
                            {t.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="edit-verified"
                      checked={userForm.isVerified}
                      onChange={(e) => setUserForm({ ...userForm, isVerified: e.target.checked })}
                      className="w-4 h-4 rounded bg-dark-4 border-none text-primary-500 focus:ring-0 focus:outline-none"
                    />
                    <label htmlFor="edit-verified" className="text-sm text-light-2 font-medium">Verify User Account</label>
                  </div>
                </>
              )}

              {activeTab === "posts" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Post Caption</label>
                    <textarea
                      required
                      value={postForm.caption}
                      onChange={(e) => setPostForm({ ...postForm, caption: e.target.value })}
                      className="w-full h-24 px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 resize-none focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Location</label>
                    <input
                      type="text"
                      value={postForm.location}
                      onChange={(e) => setPostForm({ ...postForm, location: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Tags (comma separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. react, design, admin"
                      value={postForm.tags}
                      onChange={(e) => setPostForm({ ...postForm, tags: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Media URL</label>
                    <input
                      type="text"
                      value={postForm.mediaUrl}
                      onChange={(e) => setPostForm({ ...postForm, mediaUrl: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-light-3 mb-1.5">Likes Count</label>
                      <input
                        type="number"
                        value={postForm.likesCount}
                        onChange={(e) => setPostForm({ ...postForm, likesCount: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-light-3 mb-1.5">Comments Count</label>
                      <input
                        type="number"
                        value={postForm.commentsCount}
                        onChange={(e) => setPostForm({ ...postForm, commentsCount: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-light-3 mb-1.5">Shares Count</label>
                      <input
                        type="number"
                        value={postForm.sharesCount}
                        onChange={(e) => setPostForm({ ...postForm, sharesCount: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === "errors" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Error Title</label>
                    <input
                      type="text"
                      required
                      value={errorForm.title}
                      onChange={(e) => setErrorForm({ ...errorForm, title: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Description</label>
                    <textarea
                      value={errorForm.description}
                      onChange={(e) => setErrorForm({ ...errorForm, description: e.target.value })}
                      className="w-full h-24 px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 resize-none focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Code Snippet</label>
                    <textarea
                      value={errorForm.code}
                      onChange={(e) => setErrorForm({ ...errorForm, code: e.target.value })}
                      className="w-full h-24 px-4 py-2 bg-dark-4 font-mono text-xs rounded-lg border-none text-light-1 resize-none focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-light-3 mb-1.5">Points Reward</label>
                      <input
                        type="number"
                        value={errorForm.points}
                        onChange={(e) => setErrorForm({ ...errorForm, points: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-light-3 mb-1.5">Category</label>
                      <select
                        value={errorForm.category}
                        onChange={(e) => setErrorForm({ ...errorForm, category: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none capitalize"
                      >
                        {["frontend", "backend", "problem_solving", "ai_ml", "mobile_dev"].map((c) => (
                          <option key={c} value={c} className="bg-dark-3">
                            {c.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-light-3 mb-1.5">Difficulty</label>
                      <select
                        value={errorForm.difficulty}
                        onChange={(e) => setErrorForm({ ...errorForm, difficulty: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none capitalize"
                      >
                        {["easy", "medium", "hard", "expert"].map((d) => (
                          <option key={d} value={d} className="bg-dark-3">
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="edit-solved"
                      checked={errorForm.isSolved}
                      onChange={(e) => setErrorForm({ ...errorForm, isSolved: e.target.checked })}
                      className="w-4 h-4 rounded bg-dark-4 border-none text-primary-500 focus:ring-0 focus:outline-none"
                    />
                    <label htmlFor="edit-solved" className="text-sm text-light-2 font-medium">Mark as Solved</label>
                  </div>
                </>
              )}

              {activeTab === "solutions" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Solution Content</label>
                    <textarea
                      required
                      value={solutionForm.content}
                      onChange={(e) => setSolutionForm({ ...solutionForm, content: e.target.value })}
                      className="w-full h-24 px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 resize-none focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-light-3 mb-1.5">Star Rating (0-5)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="5"
                        value={solutionForm.rate}
                        onChange={(e) => setSolutionForm({ ...solutionForm, rate: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-light-3 mb-1.5">Earned Points</label>
                      <input
                        type="number"
                        value={solutionForm.earnedPoints}
                        onChange={(e) => setSolutionForm({ ...solutionForm, earnedPoints: Number(e.target.value) })}
                        className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="edit-approved"
                      checked={solutionForm.isApproved}
                      onChange={(e) => setSolutionForm({ ...solutionForm, isApproved: e.target.checked })}
                      className="w-4 h-4 rounded bg-dark-4 border-none text-primary-500 focus:ring-0 focus:outline-none"
                    />
                    <label htmlFor="edit-approved" className="text-sm text-light-2 font-medium">Mark as Approved Solution</label>
                  </div>
                </>
              )}

              {activeTab === "comments" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Content</label>
                    <textarea
                      required
                      value={commentForm.content}
                      onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                      className="w-full h-24 px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 resize-none focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-light-3 mb-1.5">Likes Count</label>
                    <input
                      type="number"
                      value={commentForm.likesCount}
                      onChange={(e) => setCommentForm({ ...commentForm, likesCount: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-dark-4 rounded-lg text-sm border-none text-light-1 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-dark-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 bg-dark-4 hover:bg-dark-3 text-xs font-semibold rounded-xl text-light-2 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-xs font-semibold rounded-xl text-white transition shadow-lg shadow-primary-500/10"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-dark-2 border border-dark-4 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-red">
              <AlertCircle className="w-8 h-8" />
              <h3 className="text-base font-bold text-light-1">Are you absolutely sure?</h3>
            </div>
            <p className="text-sm text-light-3 mb-6 leading-relaxed">
              This will permanently delete this <span className="font-bold text-light-1">{activeTab.slice(0, -1)}</span>.
              {activeTab === "users" && " This action will cascade and remove all their posts, errors, solutions, and comments. This cannot be undone."}
              {activeTab === "posts" && " All comments, likes, saves, and shares related to this post will also be deleted."}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-dark-4 hover:bg-dark-3 text-xs font-semibold rounded-xl text-light-2 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red hover:bg-red/80 text-xs font-semibold rounded-xl text-white transition shadow-lg shadow-red/10"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
