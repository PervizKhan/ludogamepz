export const metadata = {
  title: 'Dice Duel Admin',
  description: 'Admin Dashboard - Dice Duel Betting Game',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          * { box-sizing: border-box; }
          body { 
            margin: 0; 
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #1a1a2e;
            color: #fff;
          }
          button:hover { opacity: 0.9; }
          tr:hover { background-color: #16213e !important; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
