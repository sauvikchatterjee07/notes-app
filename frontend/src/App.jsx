import { useEffect, useState } from "react";

const apiUrl = "/api/notes";

function App() {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("notes-app-theme") === "dark";
    setDarkMode(storedTheme);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("notes-app-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    fetchNotes();
  }, [searchTerm, statusFilter]);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`${apiUrl}?${params.toString()}`);
      const data = await response.json();
      setNotes(data);
      setError("");
    } catch (err) {
      setError("Unable to load notes.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Please enter both title and content.");
      return;
    }
    try {
      const payload = { title: title.trim(), content: content.trim() };
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${apiUrl}/${editingId}` : apiUrl;
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error || "Request failed");
      }
      setTitle("");
      setContent("");
      setEditingId(null);
      setError("");
      fetchNotes();
    } catch (err) {
      setError(err.message || "Failed to save note.");
    }
  };

  const handleEdit = (note) => {
    setTitle(note.title);
    setContent(note.content);
    setEditingId(note._id);
    setError("");
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete note.");
      fetchNotes();
    } catch (err) {
      setError(err.message || "Failed to delete note.");
    }
  };

  const toggleRead = async (note) => {
    try {
      const response = await fetch(`${apiUrl}/${note._id}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: !note.read }),
      });
      if (!response.ok) throw new Error("Failed to update note status.");
      fetchNotes();
    } catch (err) {
      setError(err.message || "Failed to update note status.");
    }
  };

  const handleCancelEdit = () => {
    setTitle("");
    setContent("");
    setEditingId(null);
    setError("");
  };

  const totalNotes = notes.length;
  const readCount = notes.filter((note) => note.read).length;
  const unreadCount = notes.filter((note) => !note.read).length;

  return (
    <div className="app-shell">
      <div className="app-header">
        <h1>Notes App</h1>
        <button
          type="button"
          className="theme-toggle-small"
          onClick={() => setDarkMode((current) => !current)}
          title={darkMode ? "Switch to Light Theme" : "Switch to Dark Theme"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>
      <div className="panel">
        <div className="controls-row">
          <input
            className="search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes by title or content"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="read">Read</option>
            <option value="unread">Unread</option>
          </select>
        </div>

        <form className="note-form" onSubmit={handleSubmit}>
          <label>
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
            />
          </label>
          <label>
            Content
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Note content"
            />
          </label>
          {error && <p className="error">{error}</p>}
          <div className="form-actions">
            <button type="submit">
              {editingId ? "Update Note" : "Create Note"}
            </button>
            {editingId && (
              <button
                type="button"
                className="secondary"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="panel notes-list">
        <div className="list-header">
          <h2>All Notes</h2>
          <div className="stats-row">
            <span>Total: {totalNotes}</span>
            <span>Read: {readCount}</span>
            <span>Unread: {unreadCount}</span>
          </div>
        </div>

        {isLoading ? (
          <p>Loading notes...</p>
        ) : notes.length === 0 ? (
          <p>No notes found. Add a note to get started.</p>
        ) : (
          notes.map((note) => (
            <div
              key={note._id}
              className={`note-card ${note.read ? "read" : ""}`}
            >
              <div className="note-header">
                <h3>{note.title}</h3>
                <span>{new Date(note.createdAt).toLocaleString()}</span>
              </div>
              <p>{note.content}</p>
              <div className="note-actions">
                <button onClick={() => handleEdit(note)}>Edit</button>
                <button
                  onClick={() => handleDelete(note._id)}
                  className="danger"
                >
                  Delete
                </button>
                <button
                  onClick={() => toggleRead(note)}
                  className="secondary"
                >
                  {note.read ? "Mark as Unread" : "Mark as Read"}
                </button>
              </div>
              {note.read && <div className="read-badge">Read</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
