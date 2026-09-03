"use client";

import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

import { EvergreenTemplate } from "@/components/invoice-templates/evergreen";
import { ClassicTemplate } from "@/components/invoice-templates/classic";
import { BillToShipToTemplate } from "@/components/invoice-templates/bill-to-ship-to";
import { LegendTemplate } from "@/components/invoice-templates/legend";
import { CompactTemplate } from "@/components/invoice-templates/compact";
import { ElegantTemplate } from "@/components/invoice-templates/elegant";
import { VintageTemplate } from "@/components/invoice-templates/vintage";
import { MrpDiscountTemplate } from "@/components/invoice-templates/mrp-discount";
import { ModernTemplate } from "@/components/invoice-templates/modern";
import { ServiceTemplate } from "@/components/invoice-templates/service";

// --- TEMPLATE DATA ---
export const TEMPLATES = [
  { id: 'evergreen', name: 'EVERGREEN', component: EvergreenTemplate },
  { id: 'classic', name: 'CLASSIC', component: ClassicTemplate },
  { id: 'bill-to-ship-to', name: 'BILL TO - SHIP TO', component: BillToShipToTemplate },
  { id: 'legend', name: 'LEGEND', component: LegendTemplate },
  { id: 'compact', name: 'COMPACT', component: CompactTemplate },
  { id: 'elegant', name: 'ELEGANT', component: ElegantTemplate },
  { id: 'vintage', name: 'VINTAGE', component: VintageTemplate },
  { id: 'mrp-discount', name: 'MRP + DISCOUNT', component: MrpDiscountTemplate },
  { id: 'modern', name: 'MODERN', component: ModernTemplate },
  { id: 'service', name: 'SERVICE', component: ServiceTemplate },
];

const CARD_WIDTH = 270;
const GAP = 24;
const OFFSET = CARD_WIDTH + GAP;

interface TemplateSelectorProps {
  onSelect: (templateId: string) => void;
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Framer Motion values for drag & spring animation
  const dragX = useMotionValue(0);
  const trackX = useMotionValue(0);

  // Sync trackX to currentIndex when index changes
  useEffect(() => {
    animate(trackX, -currentIndex * OFFSET, { 
      type: "spring", 
      stiffness: 250, 
      damping: 25,
      mass: 0.8
    });
  }, [currentIndex, trackX]);

  // Handle drag gesture
  const onDragEnd = (e: any, { offset, velocity }: any) => {
    const swipePower = offset.x + velocity.x * 0.4;
    
    let newIndex = currentIndex;
    if (swipePower < -75 && newIndex < TEMPLATES.length - 1) {
      newIndex += 1;
    } else if (swipePower > 75 && newIndex > 0) {
      newIndex -= 1;
    }
    
    setCurrentIndex(newIndex);
    // Snap dragX back to 0
    animate(dragX, 0, { type: "spring", stiffness: 300, damping: 30 });
  };

  const handleSelect = () => {
    onSelect(TEMPLATES[currentIndex].id);
  };

  return (
    <div className="w-full rounded-3xl bg-gradient-to-b from-[#0a1f18] to-[#040e0b] flex flex-col font-sans text-white overflow-hidden shadow-2xl pb-10 pt-10">
      
      {/* --- SUCCESS HEADER --- */}
      <div className="flex flex-col items-center mt-2 mb-8 px-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Select Invoice Template</h1>
        <p className="text-white/70 text-sm font-medium">Swipe to choose your favorite design.</p>
      </div>

      {/* --- TEMPLATE NAME INDICATOR --- */}
      <div className="flex items-center justify-center gap-2 mb-8 h-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <span className="text-[11px] font-bold tracking-[0.2em] text-white/90 uppercase">
              {TEMPLATES[currentIndex].name}
            </span>
            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* --- CAROUSEL AREA --- */}
      <div className="relative w-full h-[380px] flex items-center justify-center mb-8">
        {/* Invisible drag overlay */}
        <motion.div
          className="absolute inset-0 z-30 cursor-grab active:cursor-grabbing touch-pan-y"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={onDragEnd}
          style={{ x: dragX }}
        />

        {/* Cards */}
        {TEMPLATES.map((template, idx) => {
          // Calculate dynamic position based on current track and drag
          const itemBaseX = idx * OFFSET;
          const motionX = useTransform(() => trackX.get() + dragX.get() + itemBaseX);
          
          // Animate scale and opacity based on distance from center
          const scale = useTransform(motionX, [-OFFSET, 0, OFFSET], [0.82, 1, 0.82]);
          const opacity = useTransform(motionX, [-OFFSET, 0, OFFSET], [0.3, 1, 0.3]);
          const zIndex = useTransform(motionX, [-OFFSET, 0, OFFSET], [10, 20, 10]);

          const TemplateComponent = template.component;

          return (
            <motion.div
              key={template.id}
              className="absolute pointer-events-none"
              style={{
                width: CARD_WIDTH,
                height: 380,
                x: motionX,
                scale,
                opacity,
                zIndex
              }}
            >
              {/* @ts-ignore */}
              <TemplateComponent invoice={{items: []}} settings={{}} isPreview={true} />
            </motion.div>
          );
        })}
      </div>

      {/* --- PAGINATION DOTS --- */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {TEMPLATES.map((_, idx) => {
          const isActive = idx === currentIndex;
          return (
            <motion.div
              key={idx}
              className={cn("h-1.5 rounded-full", isActive ? "bg-indigo-500" : "bg-white/20")}
              animate={{
                width: isActive ? 20 : 6,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          );
        })}
      </div>

      {/* --- BOTTOM CTA --- */}
      <div className="px-6 w-full max-w-md mx-auto">
        <button 
          onClick={handleSelect}
          className="relative w-full h-14 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(79,70,229,0.3)] hover:shadow-[0_10px_40px_rgba(79,70,229,0.4)] active:scale-[0.98] transition-all group pointer-events-auto z-40"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600" />
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
          <div className="relative h-full flex items-center justify-center text-white font-semibold tracking-wide text-[15px]">
            Use This Template
          </div>
        </button>
      </div>

    </div>
  );
}
