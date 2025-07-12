module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Precise custom colors based on detailed screenshot analysis
        'primary-text': '#202124',      // Dark text for titles, active states
        'secondary-text': '#70757A',    // Lighter gray for contextual info, inactive text, placeholders
        'background-light': '#F8F9FA',  // Main chat area background
        'background-white': '#FFFFFF',  // Modal background, agent bubbles, header, input area
        'bubble-user': '#E8F0FE',       // Light blue for user message bubbles
        'border-default': '#E0E0E0',    // Standard light border for elements like meeting cards, input
        'border-header': '#DADCE0',     // Slightly darker border for header bottom
        'icon-default': '#5F6368',      // Default gray for icons (e.g., plus)
        'icon-light': '#E0E0E0',        // Very light gray for the lightning bolt icon
        'blue-action': '#1A73E8',       // Standard blue (for sign-in button, new thread text)
        'blue-action-hover': '#1766CC', // Darker blue for hover states
        'tab-active-bg': '#F1F3F4',     // Background for the active 'Chat' tab
        'button-gray-bg': '#F1F3F4',    // Background for "All meetings" button
      },
      boxShadow: {
        // Custom subtle shadows for exact matching
        'chat-modal': '0px 4px 16px rgba(0, 0, 0, 0.08)', // Modal shadow
        'chat-input-top': '0px -2px 8px rgba(0, 0, 0, 0.03)', // Subtle shadow for input bar top
        'bubble-subtle': '0px 1px 2px rgba(0, 0, 0, 0.03)', // Very subtle shadow for agent bubbles/meeting cards
      }
    },
  },
  plugins: [],
}