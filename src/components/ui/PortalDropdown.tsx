import { type ReactNode, type RefObject, useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface PortalDropdownProps {
  isOpen: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  align?: 'left' | 'right';
  direction?: 'up' | 'down';
  matchTriggerWidth?: boolean;
  className?: string;
  onClose?: () => void;
}

export function PortalDropdown({
  isOpen,
  triggerRef,
  children,
  align = 'right',
  direction = 'up',
  matchTriggerWidth = false,
  className = '',
  onClose,
}: PortalDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, right: 0, width: 0 });

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const gap = 8;

    setPosition({
      top: direction === 'up' ? rect.top - gap : rect.bottom + gap,
      left: align === 'left' ? rect.left : NaN,
      right: align === 'right' ? window.innerWidth - rect.right : NaN,
      width: matchTriggerWidth ? rect.width : 0,
    });
  }, [triggerRef, align, direction, matchTriggerWidth]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const handler = () => updatePosition();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen || !onClose) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (dropdownRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose, triggerRef]);

  if (typeof document === 'undefined') return null;

  const style: React.CSSProperties = {
    position: 'fixed',
    zIndex: 99999,
  };

  if (direction === 'up') {
    style.bottom = window.innerHeight - position.top;
  } else {
    style.top = position.top;
  }

  if (!isNaN(position.left)) style.left = position.left;
  if (!isNaN(position.right)) style.right = position.right;
  if (matchTriggerWidth && position.width > 0) style.width = position.width;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: direction === 'up' ? 4 : -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: direction === 'up' ? 4 : -4, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          style={style}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
