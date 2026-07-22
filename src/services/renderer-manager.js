import { ArrayRenderer } from "@/components/visualization/renderers/array-renderer";
import { UniversalDsaRenderer } from "@/components/visualization/renderers/universal-dsa-renderer";

class RendererRegistry {
  renderers = new Map();

  register(renderer) {
    this.renderers.set(renderer.id, renderer);
  }

  getRenderer(id) {
    return this.renderers.get(id);
  }

  /**
   * Scans and returns all registered renderers that match the step variables signatures.
   */
  getSupportingRenderers(step) {
    return Array.from(this.renderers.values())
      .filter((r) => r.supports(step))
      .sort((a, b) => b.getPriority() - a.getPriority());
  }

  /**
   * Auto-selects the renderer with the highest matching priority.
   */
  getBestRenderer(step) {
    const list = this.getSupportingRenderers(step);
    return list.length > 0 ? list[0] : null;
  }

  getAllRenderers() {
    return Array.from(this.renderers.values());
  }
}

export const rendererManager = new RendererRegistry();

// ==========================================
// PRE-REGISTER CORE FRAMEWORK DETECTORS
// ==========================================

// 1. Array & Matrix Visual Renderer
rendererManager.register(ArrayRenderer);

// 2. Universal DSA Renderer
rendererManager.register(UniversalDsaRenderer);
