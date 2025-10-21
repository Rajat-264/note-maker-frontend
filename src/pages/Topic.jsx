import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import './Topic.css';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { nanoid } from 'nanoid';

export default function Topic() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [mode, setMode] = useState('improve');
  const [originalNotes, setOriginalNotes] = useState([]);
  const [enhancedNotes, setEnhancedNotes] = useState([]);
  const [showDiff, setShowDiff] = useState(false);
  const noteRefs = useRef({});

  // ✅ Fetch topic once
  useEffect(() => {
    API.get(`/topics/${id}`).then((res) => setTopic(res.data));
  }, [id]);

  // ✅ Debounced auto-save
  useEffect(() => {
    if (!topic?.notes) return;
    const timeout = setTimeout(() => {
      API.put(`/topics/${id}/updateNotes`, { notes: topic.notes });
    }, 800);
    return () => clearTimeout(timeout);
  }, [topic?.notes]);

  // ✅ Cursor-stable edit handling
  const handleEditNote = useCallback((noteId, e) => {
    const content = e.target.innerText.replace(/\n+$/, '');
    setTopic((prev) => {
      if (!prev) return prev;
      const updatedNotes = prev.notes.map((n) =>
        n.id === noteId ? { ...n, content } : n
      );
      return { ...prev, notes: updatedNotes };
    });
  }, []);

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newNote = { id: nanoid(), content: '' };
      const updated = [...topic.notes];
      updated.splice(idx + 1, 0, newNote);
      setTopic((prev) => ({ ...prev, notes: updated }));

      setTimeout(() => {
        const next = noteRefs.current[newNote.id];
        next?.focus();
      }, 0);
    } else if (e.key === 'Backspace' && e.currentTarget.innerText.trim() === '') {
      e.preventDefault();
      const updated = topic.notes.filter((_, i) => i !== idx);
      setTopic((prev) => ({ ...prev, notes: updated }));

      setTimeout(() => {
        const prevBlock = noteRefs.current[topic.notes[idx - 1]?.id];
        prevBlock?.focus();
      }, 0);
    }
  };

  const handleClickOutside = (e) => {
    if (e.target.classList.contains('note-list-container')) {
      const newNote = { id: nanoid(), content: '' };
      setTopic((prev) => ({ ...prev, notes: [...prev.notes, newNote] }));
      setTimeout(() => {
        noteRefs.current[newNote.id]?.focus();
      }, 0);
    }
  };

  // ✅ AI Enhancement
  const handleAIEnhancement = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(
        `https://note-maker-ai-service.onrender.com/improve/enhance/${id}?mode=${mode}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setOriginalNotes(data.originalNotes);
        setEnhancedNotes(data.improvedNotes);
        setShowDiff(true);
      } else alert(data.message || 'AI enhancement failed.');
    } catch (err) {
      console.error('AI enhance error:', err);
      alert('An error occurred while enhancing notes.');
    }
  };

  const acceptChanges = async () => {
    const formattedNotes = enhancedNotes.map((note) =>
      typeof note === 'object' && note.id && note.content
        ? note
        : { id: nanoid(), content: note }
    );
    await API.put(`/topics/${id}/updateNotes`, { notes: formattedNotes });
    const updated = await API.get(`/topics/${id}`);
    setTopic(updated.data);
    setShowDiff(false);
  };

  const rejectChanges = () => {
    setShowDiff(false);
    setEnhancedNotes([]);
  };

  // ✅ Export PDF
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

  if (!topic) return <div>Loading...</div>;

  return (
    <div className="topic-page">
      {/* Floating Sidebar */}
      <div className="floating-panel">
        <button className="panel-button" onClick={() => navigate('/dashboard')}>⬅ Back</button>

        <select value={mode} onChange={(e) => setMode(e.target.value)} className="panel-button">
          <option value="improve">✨ Improve</option>
          <option value="summarize">📌 Summarize</option>
          <option value="expand">📖 Expand</option>
          <option value="formal">🧑‍💼 Formal</option>
          <option value="flashcards">🗂️ Flashcards</option>
          <option value="simplify">😄 Simplify</option>
        </select>

        <button className="panel-button" onClick={handleAIEnhancement}>🚀 Enhance</button>
        <button className="panel-button" onClick={downloadAsPDF}>🧾 Export PDF</button>
      </div>

      <h1 className="title">📝 {topic?.title}</h1>

      {showDiff ? (
        <div className="diff-container">
          <div className="diff-preview">
            <div className="diff-box">
              <h3>Original Notes</h3>
              {originalNotes.map((note, i) => (
                <div key={i}><ReactMarkdown>{note.content || note}</ReactMarkdown></div>
              ))}
            </div>

            <div className="diff-box enhanced">
              <h3>Enhanced ({mode})</h3>
              {enhancedNotes.map((note, i) => (
                <div key={i}><ReactMarkdown>{note.content || note}</ReactMarkdown></div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button onClick={acceptChanges} className="button">✅ Accept</button>
            <button onClick={rejectChanges} className="button">❌ Reject</button>
          </div>
        </div>
      ) : (
        <div
          className="note-list-container"
          id="pdf-content"
          onClick={handleClickOutside}
        >
          {topic?.notes?.map((note, idx) => (
            <div
              key={note.id}
              id={`note-${note.id}`}
              ref={(el) => (noteRefs.current[note.id] = el)}
              contentEditable
              suppressContentEditableWarning
              className="note-block"
              onInput={(e) => handleEditNote(note.id, e)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              spellCheck={false}
            >
              {note.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
