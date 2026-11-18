"use client";

import React, { useState } from "react";
import { motion, LayoutGroup } from "framer-motion";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { WordToken } from "@/types";

export interface WordBankDndProps {
  selectedTokens: WordToken[];
  bankTokens: WordToken[];
  onTokensChange: (selected: WordToken[], bank: WordToken[]) => void;
  onPickWord?: (token: WordToken) => void;
  onUnpickWord?: (token: WordToken) => void;
  disabled?: boolean;
  emptyPlaceholder?: string;
  layoutGroupId?: string;
}

interface SortablePillProps {
  token: WordToken;
  variant: "selected" | "available";
  disabled?: boolean;
  isDragActive?: boolean;
  onClick?: () => void;
}

const wbSpring = {
  type: "spring",
  stiffness: 350,
  damping: 28,
} as const;

function SortableWordPill({
  token,
  variant,
  disabled,
  isDragActive = false,
  onClick,
}: SortablePillProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: token.id,
    disabled,
  });

  const style: React.CSSProperties = {
    // Sürükleme esnasında dnd-kit transform'u geçerlidir; sürükleme yokken framer-motion layout FLIP animasyonu çalışır
    transform: isDragActive && transform ? CSS.Translate.toString(transform) : undefined,
    transition: isDragActive ? transition : undefined,
    opacity: isDragging ? 0.35 : 1,
    touchAction: "none",
  };

  return (
    <motion.button
      ref={setNodeRef}
      layoutId={`wb-tok-${token.id}`}
      layout={!isDragActive}
      transition={wbSpring}
      whileHover={!disabled && !isDragActive ? { scale: 1.04 } : undefined}
      whileTap={!disabled && !isDragActive ? { scale: 0.96 } : undefined}
      style={style}
      {...attributes}
      {...listeners}
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`wb-word-pill ${
        variant === "selected" ? "wb-word-pill-selected" : "wb-word-pill-available"
      }`}
    >
      {token.word}
    </motion.button>
  );
}

function DroppableZone({
  id,
  className,
  children,
  isDropTargetActive,
}: {
  id: string;
  className: string;
  children: React.ReactNode;
  isDropTargetActive?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${className} transition-all duration-150 ${
        isOver && isDropTargetActive ? "ring-2 ring-primary/60 border-primary" : ""
      }`}
    >
      {children}
    </div>
  );
}

export function WordBankDnd({
  selectedTokens,
  bankTokens,
  onTokensChange,
  onPickWord,
  onUnpickWord,
  disabled = false,
  emptyPlaceholder = "Kelimeleri sırasıyla seçin",
  layoutGroupId,
}: WordBankDndProps) {
  const [activeToken, setActiveToken] = useState<WordToken | null>(null);

  // Hassas sensör ayarları: masaüstünde pointer mesafesi (5px), mobilde hafif dokunma toleransı
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 150,
      tolerance: 5,
    },
  });

  const sensors = useSensors(pointerSensor, touchSensor);

  const handleDragStart = (event: DragStartEvent) => {
    if (disabled) return;
    const activeId = String(event.active.id);
    const token = [...selectedTokens, ...bankTokens].find((t) => t.id === activeId);
    setActiveToken(token || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveToken(null);
    if (disabled) return;

    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeInSelectedIdx = selectedTokens.findIndex((t) => t.id === activeId);
    const activeInBankIdx = bankTokens.findIndex((t) => t.id === activeId);

    // 1. Cevap alanındaki bir kelime taşındığında
    if (activeInSelectedIdx !== -1) {
      const currentToken = selectedTokens[activeInSelectedIdx];

      // Kelime bankası alanına (veya bankadaki bir kelime üzerine) bırakıldıysa: geri iade et
      if (overId === "bank-zone" || bankTokens.some((t) => t.id === overId)) {
        const newSelected = selectedTokens.filter((t) => t.id !== activeId);
        const newBank = [...bankTokens, currentToken];
        onTokensChange(newSelected, newBank);
        return;
      }

      // Cevap alanı içinde kendi arasında sıra değiştirme
      const overInSelectedIdx = selectedTokens.findIndex((t) => t.id === overId);
      if (overInSelectedIdx !== -1 && overInSelectedIdx !== activeInSelectedIdx) {
        const newSelected = arrayMove(selectedTokens, activeInSelectedIdx, overInSelectedIdx);
        onTokensChange(newSelected, bankTokens);
        return;
      }

      return;
    }

    // 2. Kelime bankasından cevap alanına kelime taşındığında
    if (activeInBankIdx !== -1) {
      const currentToken = bankTokens[activeInBankIdx];

      // Cevap alanına veya cevap alanındaki belirli bir kelimenin arasına bırakıldıysa
      const overInSelectedIdx = selectedTokens.findIndex((t) => t.id === overId);

      if (overId === "answer-zone" || overInSelectedIdx !== -1) {
        const newBank = bankTokens.filter((t) => t.id !== activeId);
        let newSelected: WordToken[];

        if (overInSelectedIdx !== -1) {
          // Araya ekleme: hedef kelimenin hemen önüne yerleştir
          newSelected = [
            ...selectedTokens.slice(0, overInSelectedIdx),
            currentToken,
            ...selectedTokens.slice(overInSelectedIdx),
          ];
        } else {
          // Cevap alanının sonuna ekleme
          newSelected = [...selectedTokens, currentToken];
        }

        onTokensChange(newSelected, newBank);
        return;
      }

      // Banka içinde sıra değiştirme
      const overInBankIdx = bankTokens.findIndex((t) => t.id === overId);
      if (overInBankIdx !== -1 && overInBankIdx !== activeInBankIdx) {
        const newBank = arrayMove(bankTokens, activeInBankIdx, overInBankIdx);
        onTokensChange(selectedTokens, newBank);
        return;
      }
    }
  };

  // Tıklama ile doğrudan seçim (erişilebilirlik için korunur)
  const handlePillClick = (token: WordToken, source: "bank" | "selected") => {
    if (disabled) return;
    if (source === "bank") {
      if (onPickWord) {
        onPickWord(token);
      } else {
        const newBank = bankTokens.filter((t) => t.id !== token.id);
        const newSelected = [...selectedTokens, token];
        onTokensChange(newSelected, newBank);
      }
    } else {
      if (onUnpickWord) {
        onUnpickWord(token);
      } else {
        const newSelected = selectedTokens.filter((t) => t.id !== token.id);
        const newBank = [...bankTokens, token];
        onTokensChange(newSelected, newBank);
      }
    }
  };

  const isDragActive = activeToken !== null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <LayoutGroup id={layoutGroupId || "wb-dnd"}>
        <div className="wb-container">
          {/* Üst Kısım: Cevap Alanı (Drop Zone & Sortable) */}
          <DroppableZone id="answer-zone" className="wb-drop-zone" isDropTargetActive={!disabled}>
            {selectedTokens.length === 0 ? (
              <span className="text-sm text-muted-foreground select-none italic py-1 px-2">
                {emptyPlaceholder}
              </span>
            ) : (
              <SortableContext
                items={selectedTokens.map((t) => t.id)}
                strategy={rectSortingStrategy}
              >
                {selectedTokens.map((tok) => (
                  <SortableWordPill
                    key={tok.id}
                    token={tok}
                    variant="selected"
                    disabled={disabled}
                    isDragActive={isDragActive}
                    onClick={() => handlePillClick(tok, "selected")}
                  />
                ))}
              </SortableContext>
            )}
          </DroppableZone>

          {/* Alt Kısım: Kelime Bankası Havuzu (Droppable) */}
          <DroppableZone id="bank-zone" className="wb-pool-zone" isDropTargetActive={!disabled}>
            <SortableContext
              items={bankTokens.map((t) => t.id)}
              strategy={rectSortingStrategy}
            >
              {bankTokens.map((tok) => (
                <SortableWordPill
                  key={tok.id}
                  token={tok}
                  variant="available"
                  disabled={disabled}
                  isDragActive={isDragActive}
                  onClick={() => handlePillClick(tok, "bank")}
                />
              ))}
            </SortableContext>
          </DroppableZone>
        </div>
      </LayoutGroup>

      {/* Sürükleme esnasında havada süzülen aktif kelime */}
      <DragOverlay adjustScale={false}>
        {activeToken ? (
          <div
            className={`wb-word-pill ${
              selectedTokens.some((t) => t.id === activeToken.id)
                ? "wb-word-pill-selected"
                : "wb-word-pill-available"
            } shadow-2xl scale-105 ring-2 ring-primary/60 cursor-grabbing pointer-events-none`}
          >
            {activeToken.word}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default WordBankDnd;

