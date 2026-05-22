export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: #1a1a2e; color: #fff; font-family: system-ui, sans-serif; }
        button:hover { opacity: 0.9; }
        tr:hover { background-color: #16213e !important; }
      `}</style>
      {children}
    </>
  );
}
