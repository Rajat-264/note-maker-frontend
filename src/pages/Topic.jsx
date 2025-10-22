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
  const isComposingRef = useRef(false);

  // ✅ Fetch topic once
  useEffect(() => {
    API.get(`/topics/${id}`).then((res) => {
      // Filter out empty or null notes before setting
      const filteredNotes = res.data.notes?.filter(n => n?.content?.trim() !== '') || [];
      setTopic({ ...res.data, notes: filteredNotes.length ? filteredNotes : [{ id: nanoid(), content: '' }] });
    });
  }, [id]);

  // ✅ Debounced auto-save (filter out empty)
  useEffect(() => {
    if (!topic?.notes) return;
    const timeout = setTimeout(() => {
      const cleanNotes = topic.notes.filter((n) => n.content.trim() !== '');
      API.put(`/topics/${id}/updateNotes`, { notes: cleanNotes });
    }, 800);
    return () => clearTimeout(timeout);
  }, [topic?.notes]);

  // ✅ Cursor position logic (unchanged)
  const saveCursorPosition = useCallback((element) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      const position = preCaretRange.toString().length;
      return { position, elementId: element.id };
    }
    return null;
  }, []);

  const restoreCursorPosition = useCallback((element, position) => {
    if (!element || position === null) return;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    let currentPos = 0, targetNode = null, targetOffset = 0;
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const nodeLength = node.textContent.length;
      if (currentPos + nodeLength >= position) {
        targetNode = node;
        targetOffset = position - currentPos;
        break;
      }
      currentPos += nodeLength;
    }
    if (targetNode) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.setStart(targetNode, targetOffset);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, []);

  // ✅ Stable edit with cursor
  const handleEditNote = useCallback((noteId, e) => {
    if (isComposingRef.current) return;
    const element = e.target;
    const cursorPosition = saveCursorPosition(element);
    const content = element.innerText;

    setTopic((prev) => {
      if (!prev) return prev;
      const updatedNotes = prev.notes.map((n) =>
        n.id === noteId ? { ...n, content } : n
      );
      return { ...prev, notes: updatedNotes };
    });

    if (cursorPosition) {
      setTimeout(() => {
        const updatedElement = document.getElementById(`note-${noteId}`);
        if (updatedElement) restoreCursorPosition(updatedElement, cursorPosition.position);
      }, 0);
    }
  }, [saveCursorPosition, restoreCursorPosition]);

  // ✅ Handle IME
  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);
  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
  }, []);

  // ✅ Enter / Backspace logic
  const handleKeyDown = (e, idx) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Only add if last note isn't empty
      if (topic.notes[topic.notes.length - 1].content.trim() !== '') {
        const newNote = { id: nanoid(), content: '' };
        const updated = [...topic.notes];
        updated.splice(idx + 1, 0, newNote);
        setTopic((prev) => ({ ...prev, notes: updated }));
        setTimeout(() => noteRefs.current[newNote.id]?.focus(), 0);
      }
    } else if (e.key === 'Backspace' && e.currentTarget.innerText === '') {
      e.preventDefault();
      if (topic.notes.length > 1) {
        const updated = topic.notes.filter((_, i) => i !== idx);
        setTopic((prev) => ({ ...prev, notes: updated }));
        setTimeout(() => {
          const prevBlock = noteRefs.current[topic.notes[idx - 1]?.id];
          if (prevBlock) {
            prevBlock.focus();
            const range = document.createRange();
            range.selectNodeContents(prevBlock);
            range.collapse(false);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }, 0);
      }
    }
  };

  // ✅ Prevent extra empty block on outside click
  const handleClickOutside = (e) => {
    if (e.target.classList.contains('note-list-container')) {
      const last = topic.notes[topic.notes.length - 1];
      if (last?.content.trim() !== '') {
        const newNote = { id: nanoid(), content: '' };
        setTopic((prev) => ({ ...prev, notes: [...prev.notes, newNote] }));
        setTimeout(() => noteRefs.current[newNote.id]?.focus(), 0);
      }
    }
  };

  // ✅ AI Enhancement (unchanged)
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

  // ✅ PDF Export (unchanged)
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
        <button className="panel-button" onClick={handleAIEnhancement}>🚀 Enhance with AI</button>
        <select value={mode} onChange={(e) => setMode(e.target.value)} className="panel-button-1">
          <option value="improve">✨ Improve</option>
          <option value="summarize">📌 Summarize</option>
          <option value="expand">📖 Expand</option>
          <option value="formal">🧑‍💼 Formal</option>
          <option value="flashcards">🗂️ Flashcards</option>
          <option value="simplify">😄 Simplify</option>
        </select>
        <button className="panel-button" onClick={downloadAsPDF}>🧾 Download as PDF</button>
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
          {topic?.notes
            ?.filter((n) => n.content.trim() !== '' || topic.notes.length === 1)
            .map((note, idx) => (
              <div
                key={note.id}
                id={`note-${note.id}`}
                ref={(el) => (noteRefs.current[note.id] = el)}
                contentEditable
                suppressContentEditableWarning
                className="note-block"
                onInput={(e) => handleEditNote(note.id, e)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
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
