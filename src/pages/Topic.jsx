import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../services/api';
import './Topic.css';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { nanoid } from 'nanoid';

export default function Topic() {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [text, setText] = useState('');
  const [insertMode, setInsertMode] = useState(false);
  const [insertIndex, setInsertIndex] = useState(null);
  const [mode, setMode] = useState('improve');
  const [originalNotes, setOriginalNotes] = useState([]);
  const [enhancedNotes, setEnhancedNotes] = useState([]);
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    API.get(`/topics/${id}`).then((res) => setTopic(res.data));
  }, [id]);

  const handleAddNote = async () => {
    if (!text.trim()) return;
    const notes = topic?.notes || [];
    const newNote = { id: nanoid(), content: text };
    const newNotes = [...notes];
    const position = insertMode && insertIndex !== null ? insertIndex : newNotes.length;
    newNotes.splice(position, 0, newNote);

    await API.put(`/topics/${id}/updateNotes`, { notes: newNotes });
    setText('');
    const updated = await API.get(`/topics/${id}`);
    setTopic(updated.data);
    setInsertIndex(null);
    setInsertMode(false);
  };

  const handleAIEnhancement = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://note-maker-ai-service.onrender.com/improve/enhance/${id}?mode=${mode}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setOriginalNotes(data.originalNotes);
        setEnhancedNotes(data.improvedNotes);
        setShowDiff(true);
      } else {
        alert(data.message || 'AI enhancement failed.');
      }
    } catch (err) {
      console.error('Improvement error:', err);
      alert('An error occurred while enhancing notes.');
    }
  };

  const acceptChanges = async () => {
  const formattedNotes = enhancedNotes.map((note) => {
    if (typeof note === 'object' && note.id && note.content) return note;
    return { id: nanoid(), content: note };
  });

  await API.put(`/topics/${id}/updateNotes`, { notes: formattedNotes });
  const updated = await API.get(`/topics/${id}`);
  setTopic(updated.data);
  setShowDiff(false);
};


  const rejectChanges = () => {
    setShowDiff(false);
    setEnhancedNotes([]);
  };

  const downloadAsPDF = async () => {
    const content = document.getElementById('pdf-content');
    if (!content) return;
    const canvas = await html2canvas(content, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth - 20;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    pdf.save(`${topic?.title || 'notes'}.pdf`);
  };

  return (
    <div className="topic-page">
      <h1 className="title">{topic?.title}</h1>

      <div className="add-note">
        <textarea
          placeholder="Paste or write your note..."
          className="text-field"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="buttons">
          <button onClick={() => setInsertMode(!insertMode)} className={`button ${insertMode ? 'active' : ''}`}>
            {insertMode ? '🛑 Cancel Insert Mode' : '🖊️ Set Insert Position'}
          </button>
          <button onClick={handleAddNote} className="button">+ Add Note</button>
        </div>
        <div className="buttons"> 
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="button1">
            <option value="improve">✨ Improve</option>
            <option value="summarize">📌 Summarize</option>
            <option value="expand">📖 Expand</option>
            <option value="formal">🧑‍💼 Formal</option>
            <option value="flashcards">🗂️ Flashcards</option>
            <option value="simplify">😄 Simplify</option>
          </select>
          <button onClick={handleAIEnhancement} className="button">🚀 Enhance with AI</button>
        </div>
        <div className="buttons">
          <button onClick={downloadAsPDF} className="button">🧾 Export as PDF</button>
        </div>
          
        {insertMode && insertIndex !== null && (
          <p className="note-position-indicator">Inserting at position: {insertIndex + 1}</p>
        )}
      </div>

      {showDiff && (
        <div className="diff-container">
        <div className="diff-preview">
          
          <div className="diff-box">
            <h3>Original Notes</h3>
              {originalNotes.map((note, i) => (
                <div key={i}>
                  <ReactMarkdown>{note.content || note}</ReactMarkdown>
                </div>
              ))}
          </div>

          
          <div className="diff-box enhanced">
            <h3>Enhanced Notes ({mode})</h3>
            {enhancedNotes.map((note, i) => (
              <div key={i}>
                <ReactMarkdown>{note.content || note}</ReactMarkdown>
              </div>
              ))}
          </div>
        </div>

          <div className="flex gap-3 mt-2">
            <button onClick={acceptChanges} className="button">✅ Accept</button>
            <button onClick={rejectChanges} className="button">❌ Reject</button>
          </div>
        </div>
      )}

      <div className="note-list-container" id="pdf-content">
        <h2 className="header">{topic?.title}</h2>
        <ul className="note-list">
          {topic?.notes?.map((note, idx) => (
            <li
              key={note.id}
              className={`markdown-wrapper ${insertMode && insertIndex === idx + 1 ? 'inserting' : ''}`}
              onClick={() => insertMode && setInsertIndex(idx + 1)}
            >
              <div className="markdown-container">
                <ReactMarkdown
                  components={{
                    code({ children, ...props }) {
                      return <code style={{ whiteSpace: 'pre-wrap' }} {...props}>{children}</code>;
                    },
                    pre({ children }) {
                      return <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{children}</pre>;
                    },
                  }}
                  className="markdown-body"
                >
                  {note.content}
                </ReactMarkdown>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
