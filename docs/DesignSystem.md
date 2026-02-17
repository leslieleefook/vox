# 

This revision integrates the **Lumina: Layered Light** design system into the technical foundation of **Project Vox**. This ensures that while the backend handles high-scale telephony, the frontend provides a premium, "physical" experience for managing those voice agents.

* * *

# Design System & Style Guide: Lumina (Vox Edition)

## 1\. Visual Philosophy: The Layered Light Principle

# 

The UI for Project Vox is treated as a series of **acrylic sheets** floating over the "Media Stream." Since the app deals with real-time voice, the background should feel alive—pulsing subtly with the agent's activity.

-   **Transparency:** Elements are never solid; they are windows into the system state.
    
-   **Refraction:** High `backdrop-filter: blur()` values are mandatory to ensure that the vibrant "Under-Glow" doesn't interfere with data legibility.
    
-   **Edge Physics:** Light always catches the **top-left** edge, creating a "specular highlight" that gives the glass its physical thickness.
    

* * *

## 2\. Color & Surface Palettes

# 

Lumina uses a "Dark-Glass" foundation, where colors represent active data streams (e.g., green for a live call, violet for LLM processing).

### Surface Elevation (The Alpha Stack)

# 

| **Level** | **Usage** | **Tailwind / CSS Definition** |
| --- | --- | --- |
| **Base** | Main App Canvas | `bg-[#0A0A0B]` with a Mesh Gradient |
| **Surface 01** | Assistant Cards | `bg-white/5` + `backdrop-blur-md` |
| **Surface 02** | Modals / Settings | `bg-white/10` + `backdrop-blur-xl` |
| **Surface 03** | Tooltips / Hover | `bg-white/20` + `border-white/30` |

### The "Vox Under-Glow" (Dynamic State Colors)

# 

These colors live _behind_ the glass cards and move based on system events.

-   **Idle State:** `Electric Violet (#8B5CF6)`
    
-   **Active Call:** `Cyan Neon (#06B6D4)`
    
-   **API Error:** `Rose Glow (#FB7185)`
    

* * *

## 3\. Core Component Specifications

### The "Vox-Glass" Card

# 

Every management card (for Assistants or Call Logs) must implement the following stack:

CSS

    .vox-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(16px);
      border-radius: 12px;
      /* Top-left highlight, bottom-right fade */
      border: 1px solid linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05));
      box-shadow: 
        0 8px 32px 0 rgba(0, 0, 0, 0.37), /* Depth shadow */
        0 0 15px rgba(139, 92, 246, 0.1); /* Subtle brand glow */
    }

### The "Pulse" Indicator

# 

For live calls, the status indicator isn't just a dot; it's a glowing orb that expands and contracts based on the `audio_level` metadata from LiveKit.

* * *

## 4\. Typography & Readability

# 

To combat the legibility issues of Glassmorphism, we use a high-contrast, high-readability stack.

-   **Font Family:** `Inter` or `Geist` (Sans-serif).
    
-   **Contrast:** Primary text is always `#FFFFFF`. Secondary text is `#94A3B8` (Slate-400), but only used outside of glass containers.
    
-   **Readability Hack:** **Letter spacing** is increased by `0.02em` and **Font weight** is bumped to `500 (Medium)` for all body text to ensure characters don't "bleed" into the background blur.
    

* * *

## 5\. Motion & Interaction (The "Light" Feel)

# 

-   **The "Hover Refraction":** When hovering over an Assistant, the `backdrop-filter` increases from `16px` to `24px`, and the border opacity increases.
    
-   **The "Magnetic" Cursor:** Buttons have a subtle magnetic pull, and a light glow follows the cursor behind the glass pane.
    
-   **Active Call Parallax:** During a call, the background "Cyan Neon" glow should move subtly in response to the user's mouse movement, creating a sense of physical depth.
    

* * *

## 6\. Accessibility & Fallbacks

# 

-   **High Contrast Mode:** If `prefers-contrast: more` is detected, the `alpha` levels are ignored, and surfaces become solid `#121212` with `#FFFFFF` borders.
    
-   **Motion Safety:** Parallax and pulse animations are disabled for `prefers-reduced-motion`.
    
-   **Legibility Guardrail:** Every glass card must have a **minimum contrast ratio of 4.5:1** against the dynamic background. This is achieved by placing a subtle `bg-black/40` overlay between the under-glow and the text layer.
    

* * *

## 7\. Tech Stack: Frontend Implementation

# 

-   **Framework:** Next.js 14 (App Router).
    
-   **Styling:** Tailwind CSS (for layout) + Framer Motion (for Lumina light effects).
    
-   **Icons:** Lucide-React (thin stroke versions to match the glass aesthetic).
    
-   **Components:** A custom library built on top of **Radix UI** primitives for accessibility.