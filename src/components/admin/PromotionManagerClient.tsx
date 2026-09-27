"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Megaphone,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  X,
  MonitorPlay,
  Ban,
} from "lucide-react";
import { PromoBanner } from "@/lib/promotions";
import ImageUploadField from "@/components/admin/ImageUploadField";
import PromotionBannerSlider from "@/components/PromotionBannerSlider";
import {
  createPromotionAction,
  updatePromotionAction,
  deletePromotionAction,
  togglePromotionActiveAction,
  reorderPromotionsAction,
} from "@/app/actions/promotions";

const THEME_COLORS = [
  { label: "None (No Glow)", hex: "none" },
  { label: "OnePlus Red", hex: "#EB0028" },
  { label: "Neon Orange", hex: "#FF5500" },
  { label: "Cyber Cyan", hex: "#00F0FF" },
  { label: "Royal Purple", hex: "#A855F7" },
  { label: "Gold Accent", hex: "#EAB308" },
  { label: "Emerald Green", hex: "#10B981" },
];


interface PromotionManagerClientProps {
  initialPromotions: PromoBanner[];
}

export default function PromotionManagerClient({
  initialPromotions,
}: PromotionManagerClientProps) {
  const [promotions, setPromotions] = useState<PromoBanner[]>(initialPromotions);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formLinkUrl, setFormLinkUrl] = useState("");
  const [formThemeColor, setFormThemeColor] = useState("#FF5500");
  const [formIsActive, setFormIsActive] = useState(true);

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormImageUrl("");
    setFormLinkUrl("");
    setFormThemeColor("none");
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (item: PromoBanner) => {
    setEditingId(item.id);
    setFormImageUrl(item.imageUrl || "");
    setFormLinkUrl(item.linkUrl || "");
    setFormThemeColor(item.themeColor || "none");
    setFormIsActive(item.isActive);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formImageUrl.trim()) {
      triggerToast("Banner artwork image is required (upload file or paste URL).", "error");
      return;
    }

    if (editingId) {
      // Update existing
      const updatedList = promotions.map((p) =>
        p.id === editingId
          ? {
              ...p,
              title: "",
              subtitle: "",
              badge: "",
              imageUrl: formImageUrl,
              linkUrl: formLinkUrl,
              ctaText: "",
              themeColor: formThemeColor,
              isActive: formIsActive,
            }
          : p
      );
      setPromotions(updatedList);
      setIsModalOpen(false);

      startTransition(async () => {
        const res = await updatePromotionAction(editingId, {
          title: "",
          subtitle: "",
          badge: "",
          imageUrl: formImageUrl,
          linkUrl: formLinkUrl,
          ctaText: "",
          themeColor: formThemeColor,
          isActive: formIsActive,
        });

        if (res.success) {
          triggerToast("Promotional banner updated successfully!");
        } else {
          triggerToast(res.error || "Failed to update banner", "error");
        }
      });
    } else {
      // Create new
      const tempId = `promo-${Date.now()}`;
      const newPromo: PromoBanner = {
        id: tempId,
        title: "",
        subtitle: "",
        badge: "",
        imageUrl: formImageUrl,
        linkUrl: formLinkUrl,
        ctaText: "",
        themeColor: formThemeColor,
        isActive: formIsActive,
        order: promotions.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setPromotions([...promotions, newPromo]);
      setIsModalOpen(false);

      startTransition(async () => {
        const res = await createPromotionAction({
          title: "",
          subtitle: "",
          badge: "",
          imageUrl: formImageUrl,
          linkUrl: formLinkUrl,
          ctaText: "",
          themeColor: formThemeColor,
          isActive: formIsActive,
        });

        if (res.success && res.promotion) {
          triggerToast("Created new promotional banner!");
          setPromotions((prev) =>
            prev.map((item) => (item.id === tempId ? res.promotion! : item))
          );
        } else {
          triggerToast(res.error || "Failed to create banner", "error");
        }
      });
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete banner "${title}"?`)) return;

    setPromotions(promotions.filter((p) => p.id !== id));

    startTransition(async () => {
      const res = await deletePromotionAction(id);
      if (res.success) {
        triggerToast(`Deleted "${title}".`);
      } else {
        triggerToast(res.error || "Failed to delete", "error");
      }
    });
  };

  const handleToggleActive = (id: string, current: boolean) => {
    const updated = promotions.map((p) =>
      p.id === id ? { ...p, isActive: !current } : p
    );
    setPromotions(updated);

    startTransition(async () => {
      const res = await togglePromotionActiveAction(id, !current);
      if (res.success) {
        triggerToast(`Banner is now ${!current ? "Active" : "Inactive"}.`);
      } else {
        triggerToast(res.error || "Failed to update status", "error");
      }
    });
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...promotions];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;

    setPromotions(newOrder);

    startTransition(async () => {
      const res = await reorderPromotionsAction(newOrder.map((p) => p.id));
      if (res.success) {
        triggerToast("Banner order updated!");
      } else {
        triggerToast(res.error || "Failed to reorder", "error");
      }
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= promotions.length - 1) return;
    const newOrder = [...promotions];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;

    setPromotions(newOrder);

    startTransition(async () => {
      const res = await reorderPromotionsAction(newOrder.map((p) => p.id));
      if (res.success) {
        triggerToast("Banner order updated!");
      } else {
        triggerToast(res.error || "Failed to reorder", "error");
      }
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border animate-in slide-in-from-bottom-5 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/30"
              : "bg-red-950/90 text-red-200 border-red-500/30"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Page Header with Tab Switcher */}
      <div className="space-y-4">
        {/* Banner Section Mode Switcher Tabs */}
        <div className="flex items-center space-x-2 p-1.5 rounded-2xl bg-[#121318] border border-white/10 w-fit">
          <Link
            href="/admin/hero"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-[#8E8E93] hover:text-white hover:bg-white/5 transition-all"
          >
            <MonitorPlay className="w-3.5 h-3.5" />
            <span>Movie Hero Spotlight</span>
          </Link>
          <Link
            href="/admin/promotions"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#FF5500] text-white shadow-lg shadow-[#FF5500]/30 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Promotions & Ads Slider</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/20 text-white uppercase font-black">Active</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5 mb-1">
              <span className="p-2 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                <Megaphone className="w-5 h-5" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Promotions & Advertisement News Slider
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#8E8E93]">
              Manage standalone billboard banners for promotions, VIP subscription discounts, festival announcements, and sponsor ads.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowLivePreview((prev) => !prev)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                showLivePreview
                  ? "bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/40"
                  : "bg-white/5 hover:bg-white/10 text-white/80 border-white/10"
              }`}
            >
              {showLivePreview ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Hide Preview</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Show Preview</span>
                </>
              )}
            </button>

            <button
              onClick={openCreateModal}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] active:scale-95 text-white text-xs font-bold shadow-[0_0_20px_rgba(255,85,0,0.4)] transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Promo Banner</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Interactive Preview Box */}
      {showLivePreview && (
        <div className="rounded-3xl border border-white/10 bg-[#0B0B0E] overflow-hidden shadow-2xl relative">
          <div className="px-5 py-3 bg-black/60 border-b border-white/10 flex items-center justify-between text-xs text-[#8E8E93]">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-semibold text-white/90">Live Front-End Preview</span>
              <span className="text-white/40">•</span>
              <span>{promotions.filter((p) => p.isActive).length} active billboard slides</span>
            </div>
            <span className="text-[11px] text-white/60">Cinematic 21:9 aspect layout</span>
          </div>

          <PromotionBannerSlider promotions={promotions} className="!px-3 sm:!px-4 !py-3" />
        </div>
      )}

      {/* List of Promotional Banners */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white tracking-tight flex items-center space-x-2">
            <span>Configured Banners</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/30 font-bold">
              {promotions.length} Total
            </span>
          </h2>
        </div>

        {promotions.length > 0 ? (
          <div className="space-y-3">
            {promotions.map((item, index) => {
              const theme = item.themeColor || "#FF5500";
              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    item.isActive
                      ? "bg-[#121318] border-white/10 hover:border-white/20"
                      : "bg-[#0E0F14]/70 border-white/5 opacity-75"
                  }`}
                >
                  {/* Left: Thumbnail & Banner Info */}
                  <div className="flex items-center space-x-4 min-w-0">
                    {/* Rank Badge */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-center">
                      <span className="text-xs font-black text-white/90">#{index + 1}</span>
                    </div>

                    {/* Image Thumbnail */}
                    <div className="relative w-28 h-16 rounded-xl overflow-hidden bg-[#181A24] flex-shrink-0 border border-white/10">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          unoptimized
                          referrerPolicy="no-referrer"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center space-x-2">
                        {item.badge ? (
                          <span
                            className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border"
                            style={{
                              backgroundColor: theme && theme !== "none" ? `${theme}20` : "rgba(255,255,255,0.08)",
                              borderColor: theme && theme !== "none" ? `${theme}40` : "rgba(255,255,255,0.15)",
                              color: theme && theme !== "none" ? theme : "rgba(255,255,255,0.8)",
                            }}
                          >
                            {item.badge}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-white/50 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                            Pure Image Artwork
                          </span>
                        )}

                        {!item.isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white/50">
                            Hidden / Inactive
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white truncate max-w-lg">
                        {item.title || <span className="text-white/50 italic font-normal">Graphic Banner (No Title Text)</span>}
                      </h3>

                      {item.subtitle && (
                        <p className="text-xs text-[#8E8E93] truncate max-w-lg">
                          {item.subtitle}
                        </p>
                      )}

                      <div className="flex items-center space-x-3 text-[11px] text-white/50">
                        {item.linkUrl && (
                          <span className="font-mono truncate max-w-[200px]">
                            Target: {item.linkUrl}
                          </span>
                        )}
                        {item.linkUrl && <span>•</span>}
                        <span>CTA: {item.ctaText || "None (Whole Banner Clickable)"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Controls */}
                  <div className="flex items-center space-x-2 flex-shrink-0 self-end md:self-auto">
                    {/* Active Toggle Switch */}
                    <button
                      onClick={() => handleToggleActive(item.id, item.isActive)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        item.isActive
                          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                          : "bg-white/5 text-white/40 border-white/10"
                      }`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </button>

                    {/* Move Up */}
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0 || isPending}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:pointer-events-none border border-white/10 transition-all active:scale-95"
                      title="Move banner earlier"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === promotions.length - 1 || isPending}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:pointer-events-none border border-white/10 transition-all active:scale-95"
                      title="Move banner later"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEditModal(item)}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-semibold transition-all active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#00F0FF]" />
                      <span>Edit</span>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      disabled={isPending}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all active:scale-95"
                      title="Delete banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 rounded-3xl bg-[#121318] border border-dashed border-white/10 text-center text-white/50 space-y-3">
            <Megaphone className="w-10 h-10 mx-auto text-white/30" />
            <p className="text-sm font-semibold text-white">No promotional banners yet.</p>
            <p className="text-xs text-[#8E8E93]">
              Click &quot;New Promo Banner&quot; above to create your first advertisement or news billboard.
            </p>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121318] border border-white/15 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2.5">
                <span
                  className="p-2 rounded-xl border"
                  style={{
                    backgroundColor: `${formThemeColor}20`,
                    borderColor: `${formThemeColor}40`,
                    color: formThemeColor,
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingId ? "Edit Promotion Banner" : "Create New Promotion Banner"}
                  </h3>
                  <p className="text-xs text-[#8E8E93]">
                    Configure image billboard, custom text, badge tag, and action link.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 text-[#8E8E93] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Image Upload Field */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <ImageUploadField
                  label="Banner Artwork Image (Upload File or URL)"
                  value={formImageUrl}
                  onChange={setFormImageUrl}
                  placeholder="Upload 16:9 or 21:9 image file or paste CDN / ChatGPT URL"
                  helperText="Supports local file upload or remote URLs. Remote links can be cached directly to local server."
                  aspectRatio="banner"
                  required
                />
              </div>


              {/* Target Link URL */}
              <div>
                <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-1.5">
                  Target Link URL (Optional)
                </label>
                <input
                  type="text"
                  value={formLinkUrl}
                  onChange={(e) => setFormLinkUrl(e.target.value)}
                  placeholder="e.g. /dashboard?tab=subscription or https://..."
                  className="w-full bg-[#181A24] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF5500]"
                />
                <p className="text-[10px] text-[#8E8E93] mt-1">If set, the entire banner becomes clickable and navigates to this URL.</p>
              </div>

              {/* Theme Color Picker */}
              <div>
                <label className="block text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-1.5">
                  Glow Accent Color (Optional)
                </label>
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  {THEME_COLORS.map((col) => {
                    const isNone = col.hex === "none";
                    const isSelected = formThemeColor === col.hex;
                    return (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setFormThemeColor(col.hex)}
                        className={`h-8 px-2.5 rounded-xl border-2 transition-all flex items-center justify-center space-x-1.5 text-xs font-bold ${
                          isSelected
                            ? "border-white bg-white/15 scale-105 shadow-lg text-white"
                            : "border-white/10 bg-white/5 opacity-70 hover:opacity-100 text-[#8E8E93]"
                        }`}
                        title={col.label}
                      >
                        {isNone ? (
                          <>
                            <Ban className="w-3.5 h-3.5 text-white/70" />
                            <span>None</span>
                          </>
                        ) : (
                          <>
                            <span
                              className="w-3.5 h-3.5 rounded-full inline-block shadow-sm"
                              style={{ backgroundColor: col.hex }}
                            />
                            <span>{col.label.split(" ")[0]}</span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[#8E8E93] mt-1.5">
                  Select &quot;None&quot; for pure neutral styling with zero colored glow or shadows.
                </p>
              </div>

              {/* Active Switch */}
              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#FF5500] focus:ring-0 bg-[#181A24] border-white/20 cursor-pointer"
                />
                <label htmlFor="formIsActive" className="text-xs font-semibold text-white/90 cursor-pointer">
                  Activate banner immediately on public slider
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#8E8E93] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#FF6600] active:scale-95 text-xs font-bold text-white shadow-[0_0_15px_rgba(255,85,0,0.4)] flex items-center space-x-1.5"
              >
                {isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingId ? "Save Changes" : "Create Banner"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
