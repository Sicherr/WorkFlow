export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                ink: "#1b1c1c",
                muted: "#5f5e5e",
                line: "#EDEBE9",
                task: "#005faa",
                event: "#0078d4",
                background: "#fbf9f9",
                surface: "#ffffff",
                "surface-low": "#f5f3f3",
                "surface-container": "#efeded",
                "surface-high": "#e9e8e7",
                "outline-soft": "#c0c7d4",
                "primary-blue": "#0078d4",
                "primary-dark": "#005faa",
                "focus-warm": "#ffdbc8",
                "focus-warm-strong": "#bc5b00"
            },
            boxShadow: {
                panel: "0 4px 12px rgba(0, 0, 0, 0.08)",
                floating: "0 16px 40px rgba(0, 95, 170, 0.18)"
            }
        }
    },
    plugins: []
};
