import { createContext, useContext } from 'react';

/**
 * Context for providing a portal target for nested floating elements (dropdowns, tooltips, etc.)
 * inside modals.
 *
 * When a dropdown is inside a modal, it should portal to the modal's internal portal container
 * rather than document.body. This ensures:
 * - Proper event propagation (clicks recognized as "inside" the modal)
 * - Correct focus management (no fighting with modal's focus trap)
 * - Proper z-index stacking within the modal's context
 * - Correct hover/scroll behavior
 */
export const ModalPortalContext = createContext<HTMLElement | null>(null);

/**
 * Hook to get the current portal target
 * Returns the modal's portal container if inside a modal, otherwise null
 */
export const useModalPortal = (): HTMLElement | null => {
  return useContext(ModalPortalContext);
};

export default ModalPortalContext;
