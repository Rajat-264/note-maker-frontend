import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../services/api';
import './Topic.css';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { nanoid } from 'nanoid';

export default function Topic() {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [text, setText] = useState('');
  const [insertMode, setInsertMode] = useState(false);
  const [insertIndex, setInsertIndex] = useState(null);

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

  const handleImproveWithAI = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://note-maker-ai-service.onrender.com/improve/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Topic improved successfully!');
        const updated = await API.get(`/topics/${id}`);
        setTopic(updated.data);
      } else {
        alert(data.message || 'AI improvement failed.');
      }
    } catch (err) {
      console.error('Improvement error:', err);
      alert('An error occurred while improving the notes.');
    }
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

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    setInsertIndex(null);
  setInsertMode(false);

    const reorderedNotes = Array.from(topic.notes);
    const [moved] = reorderedNotes.splice(result.source.index, 1);
    reorderedNotes.splice(result.destination.index, 0, moved);

    await API.put(`/topics/${id}/updateNotes`, { notes: reorderedNotes });
    const updated = await API.get(`/topics/${id}`);
    setTopic(updated.data);
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
        <div className="flex gap-3 mt-2">
          <button onClick={handleAddNote} className="button">+ Add Note</button>
          <button onClick={handleImproveWithAI} className="button">✨ Improve with AI</button>
          <button onClick={downloadAsPDF} className="button">🧾 Export as PDF</button>
          <button onClick={() => setInsertMode(!insertMode)} className={`button ${insertMode ? 'active' : ''}`}>
            {insertMode ? '🛑 Cancel Insert Mode' : '🖊️ Set Insert Position'}
          </button>
        </div>
        {insertMode && insertIndex !== null && (
          <p className="note-position-indicator">Inserting at position: {insertIndex + 1}</p>
        )}
      </div>

      <div className="note-list-container" id="pdf-content">
        <h2 className="header">{topic?.title}</h2>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="notes">
            {(provided) => (
              <ul className="note-list" {...provided.droppableProps} ref={provided.innerRef}>
                {topic?.notes?.map((note, idx) => (
                  <Draggable key={note.id} draggableId={note.id} index={idx}>
                    {(provided, snapshot) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{
                        ...provided.draggableProps.style,
                              opacity: snapshot.isDragging ? 0.8 : 1,
                            }}
                              className={`markdown-wrapper ${insertMode && insertIndex === idx + 1 ? 'inserting' : ''}`}
                          >
                              <div className="drag-handle" {...provided.dragHandleProps}>
                                ☰
                              </div>
                              <div 
                                  className="markdown-container"
                                  onClick={() => !snapshot.isDragging && insertMode && setInsertIndex(idx + 1)}
                              >
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
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}
