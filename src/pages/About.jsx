import './About.css';

export default function About() {
  return (
    <div className="about-page">
      <div className="about-container">
        <h1 className="about-title">✨ About Note Maker</h1>
        <p className="about-text">
          <strong>Note Maker</strong> is your smart companion for capturing, organizing, and enhancing study notes — all in one beautifully simple interface.
        </p>

        <h2 className="about-subtitle">🧠 Why Note Maker?</h2>
        <ul className="about-list">
          <li><strong>Quick Note-Taking:</strong> Paste or type notes into custom topics to keep your learning organized.</li>
          <li><strong>AI-Powered Improvements:</strong> Enhance your notes with better structure and clarity using powerful AI.</li>
          <li><strong>Chrome Extension:</strong> Select text from any webpage and save it directly to your topics using shortcut key (Ctrl + Shift + S).</li>
          <li><strong>PDF Export:</strong> Download neat, formatted versions of your notes for offline use.</li>
          <li><strong>Coming Soon:</strong> Version history, Flashcard mode, note sharing, collaboration & more!</li>
        </ul>

        <h2 className="about-subtitle">🚀 How It Works</h2>
        <ol className="about-steps">
          <li><strong>Create a Topic</strong> — A space to collect all your notes on a subject.</li>
          <li><strong>Add Notes</strong> — Write or paste information easily.</li>
          <li><strong>Click “Improve with AI”</strong> — Watch your notes transform into polished content.</li>
          <li><strong>Download as PDF</strong> — Export your notes and take them anywhere.</li>
        </ol>

        <p className="about-footer">
          Built by a passionate developer from <strong>NIT Calicut</strong>, Note Maker aims to make studying smarter, faster, and a little more fun.
        </p>
      </div>
    </div>
  );
}
