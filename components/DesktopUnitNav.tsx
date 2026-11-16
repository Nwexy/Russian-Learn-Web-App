/**
 * components/DesktopUnitNav.tsx
 * Faz 12.0: PC için "DeepSeek" tarzı sol kenar yan menüsü.
 * Kapalıyken sol kenarda dikey ince bir şerit olarak durur.
 * Fare üzerine geldiğinde (hover) yumuşakça açılarak tüm ünitelerin listesini sunar.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllUnits, getUnitTitle } from "@/lib/content";
import { useLang } from "@/lib/lang-context";
import { getMessages } from "@/lib/i18n";
import { isUnitUnlocked, getUnitStatus, setForceUnlocked } from "@/lib/progress";
import { db } from "@/lib/db";
import {
  Compass,
  Lock,
  CheckCircle2,
  Clock,
  Circle,
  ChevronRight,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Unit, UnitStatus, Progress } from "@/types";

interface DesktopUnitNavProps {
  units?: Unit[];
  unitStatuses?: Record<string, UnitStatus>;
  allProgress?: Progress[];
  onLockedClick?: (unitId: string) => void;
}

export function DesktopUnitNav({
  units: propUnits,
  unitStatuses: propStatuses,
  allProgress: propProgress,
  onLockedClick,
}: DesktopUnitNavProps) {
  const router = useRouter();
  const { uiLang } = useLang();
  const t = getMessages(uiLang);

  const units = propUnits || getAllUnits();
  const [internalProgress, setInternalProgress] = useState<Progress[]>([]);
  const [internalStatuses, setInternalStatuses] = useState<Record<string, UnitStatus>>({});
  const [unlockDialogOpen, setUnlockDialogOpen] = useState<boolean>(false);
  const [selectedLockedUnitId, setSelectedLockedUnitId] = useState<string | null>(null);

  const allProgress = propProgress || internalProgress;
  const unitStatuses = propStatuses || internalStatuses;

  // Prop olarak progress gelmediyse kendimiz Dexie'den çekelim
  useEffect(() => {
    if (!propProgress || !propStatuses) {
      async function loadData() {
        try {
          const progs = await db.progress.toArray();
          setInternalProgress(progs);

          const statuses: Record<string, UnitStatus> = {};
          for (const u of units) {
            statuses[u.id] = await getUnitStatus(u.id);
          }
          setInternalStatuses(statuses);
        } catch {
          // ignore
        }
      }
      loadData();
    }
  }, [propProgress, propStatuses, units]);

  const handleUnitClick = (unitId: string, isUnlocked: boolean) => {
    if (!isUnlocked) {
      if (onLockedClick) {
        onLockedClick(unitId);
      } else {
        setSelectedLockedUnitId(unitId);
        setUnlockDialogOpen(true);
      }
    } else {
      router.push(`/unit/${unitId}`);
    }
  };

  const handleConfirmUnlock = async () => {
    if (!selectedLockedUnitId) return;
    const targetId = selectedLockedUnitId;
    await setForceUnlocked(targetId);
    setUnlockDialogOpen(false);
    setSelectedLockedUnitId(null);
    router.push(`/unit/${targetId}`);
  };

  const completedCount = Object.values(unitStatuses).filter((s) => s === "completed").length;

  return (
    <>
      <aside
        className="hidden md:block fixed left-0 top-1/2 -translate-y-1/2 z-40 group select-none"
        aria-label={t.unitList}
      >
        <div className="w-2.5 h-32 group-hover:w-80 group-hover:h-[76vh] bg-card/90 border border-l-0 border-border/80 shadow-md group-hover:shadow-2xl rounded-r-xl group-hover:rounded-r-2xl transition-all duration-300 ease-out overflow-hidden flex flex-col backdrop-blur-md relative">
          {/* Kapalı Hal: İnce dikey şerit ve tutamaç */}
          <div className="absolute inset-y-0 left-0 w-2.5 bg-muted-foreground/25 group-hover:bg-accent/80 transition-colors flex items-center justify-center pointer-events-none">
            <div className="w-1 h-8 rounded-full bg-foreground/25 group-hover:bg-white/80 transition-colors" />
          </div>

          {/* Açık Hal: Panel İçeriği */}
          <div className="opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200 delay-100 flex flex-col h-full pl-5 pr-3 py-4 w-80">
            {/* Panel Başlığı */}
            <div className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center text-accent">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">
                    {t.unitList}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                  {completedCount} / {units.length}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {t.navHelp}
              </p>
            </div>

            {/* Ünite Listesi */}
            <div className="overflow-y-auto flex-1 space-y-1 py-2 pr-1 custom-scrollbar">
              {units.map((unit) => {
                const isUnlocked = isUnitUnlocked(unit.id, units, allProgress);
                const status = unitStatuses[unit.id] || "notStarted";

                const isCompleted = status === "completed";
                const isInProgress = status === "inProgress";

                return (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => handleUnitClick(unit.id, isUnlocked)}
                    className={`w-full p-2 rounded-xl text-left flex items-center justify-between gap-2.5 transition-all text-xs cursor-pointer ${
                      !isUnlocked
                        ? "opacity-55 hover:opacity-85 hover:bg-secondary/40 text-muted-foreground"
                        : "hover:bg-secondary/80 text-foreground active:scale-[0.99]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-6 h-6 rounded-md bg-secondary/80 flex items-center justify-center shrink-0">
                        {!isUnlocked ? (
                          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        ) : isInProgress ? (
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          <Circle className="w-3 h-3 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-secondary text-secondary-foreground shrink-0">
                            {unit.level}
                          </span>
                          <span className="font-semibold truncate">
                            {getUnitTitle(unit, uiLang)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      {!isUnlocked ? (
                        <span className="text-[10px] text-muted-foreground/80 font-medium">
                          {t.unitLocked}
                        </span>
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* Standalone Kullanım Durumu İçin Kilit Açma Penceresi */}
      {!onLockedClick && (
        <AlertDialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.confirmUnlockTitle}</AlertDialogTitle>
              <AlertDialogDescription>{t.confirmUnlockDesc}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUnlockDialogOpen(false)}>
                {t.cancel}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmUnlock}>
                {t.confirmUnlockAction}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

export default DesktopUnitNav;

