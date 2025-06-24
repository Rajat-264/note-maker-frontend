import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../services/api';
import './Topic.css';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Topic() {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [text, setText] = useState('');
  const [insertIndex, setInsertIndex] = useState(null);

  useEffect(() => {
    API.get(`/topics/${id}`).then((res) => setTopic(res.data));
  }, [id]);

  const handleAddNote = async () => {
    if (!text.trim()) return;

    const notes = topic?.notes || [];
    const newNotes = [...notes];
    const position = insertIndex !== null ? insertIndex : notes.length;

    newNotes.splice(position, 0, text);

    await API.put(`topics/${id}/updateNotes`, { notes: newNotes });
    setText('');
    const updated = await API.get(`/topics/${id}`);
    setTopic(updated.data);
    setInsertIndex(null);
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

    const canvas = await html2canvas(content, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth - 20;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    let position = 10;

    if (imgHeight < pageHeight) {
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    } else {
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, pageHeight - 20);
    }

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
        <div className="flex gap-3 mt-2">
          <button onClick={handleAddNote} className="button">
            + Add Note
          </button>
          <button onClick={handleImproveWithAI} className="button">
            ✨ Improve with AI
          </button>
          <button onClick={downloadAsPDF} className="button">
            🧾 Export as PDF
          </button>
        </div>
      </div>

      <div className="note-list-container" id="pdf-content">
        <h2 className="header">{topic?.title}</h2>
        <ul className="note-list">
          {topic?.notes?.map((note, idx) => (
            <div key={idx}>
              <button
                className={`insert-btn ${insertIndex === idx ? 'selected' : ''}`}
                onClick={() => setInsertIndex(idx)}
              >
                ➕ Insert Here
              </button>
              <li className="markdown-wrapper">
                <div className="markdown-container">
                  <ReactMarkdown
                    components={{
                      code({ children, ...props }) {
                        return (
                          <code
                            style={{
                              fontFamily: 'Poppins, sans-serif',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      pre({ children }) {
                        return (
                          <pre
                            style={{
                              fontFamily: 'Poppins, sans-serif',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              overflowWrap: 'anywhere',
                            }}
                          >
                            {children}
                          </pre>
                        );
                      },
                    }}
                    className="markdown-body"
                  >
                    {note}
                  </ReactMarkdown>
                </div>
              </li>
            </div>
          ))}

          {/* Insert at End */}
          <button
            className={`insert-btn ${insertIndex === topic?.notes?.length ? 'selected' : ''}`}
            onClick={() => setInsertIndex(topic?.notes?.length)}
          >
            ➕ Insert at End
          </button>
        </ul>
      </div>
    </div>
  );
}
