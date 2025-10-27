# Base Block Design System

## 🎨 Color Palette

### Primary Colors
```css
--primary-blue: rgb(59, 130, 246)        /* #3b82f6 */
--primary-blue-light: rgb(96, 165, 250)  /* #60a5fa */
--accent-green: rgb(139, 195, 74)        /* #8BC34A */
--accent-green-dark: rgb(111, 174, 62)   /* #6FAE3E */
```

### Background Colors
```css
--background-dark: #000000
--background-overlay: rgba(0, 0, 0, 0.85)
--glass-background: rgba(20, 20, 40, 0.7)
```

### Text Colors
```css
--text-primary: rgb(255, 255, 255)
--text-secondary: rgb(200, 200, 220)
--text-muted: rgba(255, 255, 255, 0.8)
```

### Gradients
```css
--gradient-blue: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)
--gradient-green: linear-gradient(135deg, #8BC34A 0%, #6FAE3E 100%)
--gradient-overlay: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(29, 78, 216, 0.2) 100%)
```

---

## 📝 Typography

### Font Families
```css
font-family: 'Nunito', system-ui, -apple-system, sans-serif;  /* Body text */
font-family: 'Fredoka', 'Nunito', system-ui, sans-serif;      /* Headings */
```

### Font Sizes
```css
/* Headings */
h1: 64px (4rem) - fontWeight: bold
h2: 48px (3rem) - fontWeight: bold
h3: 32px (2rem) - fontWeight: 600
h4: 24px (1.5rem) - fontWeight: 600

/* Body */
body: 16px (1rem)
small: 14px (0.875rem)
caption: 12px (0.75rem)
```

---

## 🎭 Component Styles

### Cards (Glassmorphism)
```tsx
style={{
  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(29, 78, 216, 0.2) 100%)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '2px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '20px',
  padding: '40px',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
}}
```

### Buttons

#### Primary Button (Blue)
```tsx
style={{
  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
  color: 'white',
  padding: '16px 32px',
  border: 'none',
  borderRadius: '12px',
  fontSize: '20px',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
}}
onMouseEnter={(e) => {
  e.currentTarget.style.transform = 'translateY(-2px)';
  e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.5)';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = 'translateY(0)';
  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
}}
```

#### Secondary Button (Green)
```tsx
style={{
  background: 'linear-gradient(135deg, #8BC34A, #6FAE3E)',
  color: 'white',
  padding: '16px 32px',
  border: 'none',
  borderRadius: '12px',
  fontSize: '20px',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
}}
onMouseEnter={(e) => {
  e.currentTarget.style.transform = 'translateY(-2px)';
  e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 195, 74, 0.5)';
}}
```

### Stat Cards
```tsx
<div style={{
  background: 'var(--glass-background)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
}}>
  <h3 style={{
    background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '8px',
  }}>Title</h3>
  <p style={{
    fontSize: '32px',
    fontWeight: 'bold',
    color: 'white',
  }}>Value</p>
</div>
```

### Leaderboard Table Row
```tsx
<div style={{
  background: 'rgba(20, 20, 40, 0.6)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  padding: '16px 24px',
  marginBottom: '8px',
  transition: 'all 0.3s ease',
}}
onMouseEnter={(e) => {
  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
  e.currentTarget.style.transform = 'translateX(4px)';
  e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.3)';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.background = 'rgba(20, 20, 40, 0.6)';
  e.currentTarget.style.transform = 'translateX(0)';
  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
}}>
  {/* Row content */}
</div>
```

---

## 🎬 Animations

### Hover Effects
```css
/* Button hover */
transform: translateY(-2px);
box-shadow: 0 8px 20px rgba(59, 130, 246, 0.5);
transition: all 0.3s ease;

/* Card hover */
transform: scale(1.02);
box-shadow: 0 12px 40px rgba(59, 130, 246, 0.3);
```

### Loading States
```tsx
<div style={{
  display: 'inline-block',
  width: '20px',
  height: '20px',
  border: '3px solid rgba(255, 255, 255, 0.3)',
  borderTop: '3px solid rgb(59, 130, 246)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
}} />

/* In CSS */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

---

## 📐 Layout Guidelines

### Container Widths
```css
max-width: 1200px;  /* Desktop container */
max-width: 800px;   /* Content container */
max-width: 600px;   /* Card/Modal */
```

### Spacing Scale
```css
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
```

### Border Radius
```css
small: 8px   /* Small elements */
medium: 12px /* Buttons, inputs */
large: 16px  /* Cards */
xlarge: 20px /* Large cards */
```

---

## 🎯 Component Examples

### Homepage Hero Section
```tsx
<div style={{
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
  padding: '80px 24px',
}}>
  <h1 style={{
    fontSize: '64px',
    fontWeight: 'bold',
    fontFamily: 'Fredoka, Nunito, system-ui',
    background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textAlign: 'center',
    marginBottom: '24px',
  }}>
    Base Block
  </h1>
  <p style={{
    fontSize: '20px',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    maxWidth: '600px',
    margin: '0 auto 48px',
  }}>
    Stack blocks to build the ultimate tower
  </p>
</div>
```

### Stat Grid
```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '24px',
  padding: '24px',
  maxWidth: '1200px',
  margin: '0 auto',
}}>
  {/* Stat cards here */}
</div>
```

---

## 🚀 Implementation Checklist

### For ALL components:

- [ ] Replace bright/colorful backgrounds with dark (#000000)
- [ ] Use glassmorphism for cards (backdrop-filter: blur(10px))
- [ ] Apply blue gradient for primary actions (#3b82f6 → #1d4ed8)
- [ ] Apply green gradient for secondary actions (#8BC34A → #6FAE3E)
- [ ] Use Nunito font for body text
- [ ] Use Fredoka font for headings
- [ ] Add hover effects (translateY, scale, boxShadow)
- [ ] Use rounded corners (12px-20px)
- [ ] Apply consistent spacing (16px, 24px, 32px)
- [ ] White text with opacity variations (0.8, 0.9, 1.0)
- [ ] Add subtle border: 1px solid rgba(255, 255, 255, 0.1)
- [ ] Use consistent shadows: 0 8px 32px rgba(0, 0, 0, 0.4)

---

## 🎨 Quick Reference

### Common Inline Styles

**Dark Container:**
```tsx
background: '#000',
color: 'white',
minHeight: '100vh'
```

**Glass Card:**
```tsx
background: 'rgba(20, 20, 40, 0.7)',
backdropFilter: 'blur(10px)',
border: '1px solid rgba(255, 255, 255, 0.2)',
borderRadius: '20px',
padding: '32px'
```

**Gradient Text:**
```tsx
background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
WebkitBackgroundClip: 'text',
WebkitTextFillColor: 'transparent'
```

**Hover Button:**
```tsx
transition: 'all 0.3s ease',
'&:hover': { transform: 'translateY(-2px)' }
```

---

## 📱 Responsive Design

```css
/* Mobile first approach */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

Use clamp() for responsive typography:
```css
font-size: clamp(24px, 5vw, 64px);
padding: clamp(16px, 3vw, 48px);
```

---

## ✅ Final Notes

1. **Consistency is key** - Use these exact values across all components
2. **No bright colors** - Stick to dark backgrounds with blue/green accents
3. **Glassmorphism everywhere** - backdrop-filter: blur() for depth
4. **Smooth transitions** - All interactive elements should have 0.3s ease
5. **Rounded corners** - 12px minimum, 20px for large cards
6. **Subtle borders** - Always use rgba(255, 255, 255, 0.1-0.2)
7. **Shadow depth** - Use consistent box-shadows for hierarchy

This design system matches Base Block' dark, futuristic, professional SaaS aesthetic!

