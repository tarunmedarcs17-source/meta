import React, { useEffect, useMemo, useState } from 'react';

const initialBooks = [
  { id: 'B001', title: 'Introduction to Algorithms', author: 'Cormen', category: 'Computer Science', quantity: 5, available: 5 },
  { id: 'B002', title: 'Engineering Mathematics', author: 'B.S. Grewal', category: 'Mathematics', quantity: 4, available: 3 },
  { id: 'B003', title: 'Database System Concepts', author: 'Korth', category: 'IT', quantity: 6, available: 6 },
  { id: 'B004', title: 'Digital Electronics', author: 'Morris Mano', category: 'Electronics', quantity: 3, available: 3 },
];

const initialStudents = [
  { id: 'S101', name: 'Asha', password: 'asha123', dept: 'CSE', year: '2nd Year' },
  { id: 'S102', name: 'Rohan', password: 'rohan123', dept: 'ECE', year: '3rd Year' },
  { id: 'S103', name: 'Meena', password: 'meena123', dept: 'BCom', year: '1st Year' },
];

const initialAdmin = { username: 'admin', password: 'admin123', name: 'Library Admin' };

const initialIssues = [
  {
    id: 'I001',
    bookId: 'B002',
    studentId: 'S101',
    studentName: 'Asha',
    bookTitle: 'Engineering Mathematics',
    issueDate: '2026-04-01',
    dueDate: '2026-04-15',
    returnDate: '',
    fine: 0,
    status: 'Issued',
  },
];

const storageKeys = {
  books: 'college-library-books',
  students: 'college-library-students',
  issues: 'college-library-issues',
};

function loadLocalData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocalData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function addDays(dateString, days) {
  const d = new Date(dateString);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function calculateFine(dueDate, returnDate) {
  const due = new Date(dueDate);
  const ret = new Date(returnDate);
  const diff = Math.ceil((ret - due) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff * 5 : 0;
}

function StatCard({ title, value, subtext }) {
  return (
    <div className="rounded-3xl bg-white border shadow-sm p-5">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-3xl font-bold text-slate-900 mt-2">{value}</div>
      {subtext ? <div className="text-xs text-slate-500 mt-2">{subtext}</div> : null}
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-slate-600">{label}</span>
      <input
        {...props}
        className={`w-full rounded-2xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-300 ${props.className || ''}`}
      />
    </label>
  );
}

function Select({ label, children, ...props }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-slate-600">{label}</span>
      <select
        {...props}
        className={`w-full rounded-2xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-300 ${props.className || ''}`}
      >
        {children}
      </select>
    </label>
  );
}

export default function LibraryManagementSystem() {
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [issues, setIssues] = useState([]);
  const [auth, setAuth] = useState({ role: '', user: null });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [message, setMessage] = useState('');

  const [loginForm, setLoginForm] = useState({ role: 'admin', username: '', password: '' });
  const [showStudentRegister, setShowStudentRegister] = useState(false);
  const [studentRegisterForm, setStudentRegisterForm] = useState({
    id: '',
    name: '',
    password: '',
    dept: '',
    year: '',
  });
  const [bookForm, setBookForm] = useState({ id: '', title: '', author: '', category: '', quantity: 1 });
  const [editingBookId, setEditingBookId] = useState('');
  const [issueForm, setIssueForm] = useState({ bookId: '', studentId: '' });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    setBooks(loadLocalData(storageKeys.books, initialBooks));
    setStudents(loadLocalData(storageKeys.students, initialStudents));
    setIssues(loadLocalData(storageKeys.issues, initialIssues));
  }, []);

  useEffect(() => saveLocalData(storageKeys.books, books), [books]);
  useEffect(() => saveLocalData(storageKeys.students, students), [students]);
  useEffect(() => saveLocalData(storageKeys.issues, issues), [issues]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 2500);
    return () => clearTimeout(timer);
  }, [message]);

  const categories = useMemo(() => ['All', ...new Set(books.map((b) => b.category))], [books]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch = [book.id, book.title, book.author, book.category]
        .join(' ')
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const currentStatus = book.available > 0 ? 'Available' : 'Out of Stock';
      const matchesStatus = statusFilter === 'All' || currentStatus === statusFilter;
      const matchesCategory = categoryFilter === 'All' || book.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [books, searchText, statusFilter, categoryFilter]);

  const currentStudentIssues = useMemo(() => {
    if (auth.role !== 'student' || !auth.user) return [];
    return issues.filter((item) => item.studentId === auth.user.id);
  }, [issues, auth]);

  const totalFines = issues.reduce((sum, item) => sum + Number(item.fine || 0), 0);
  const issuedCount = issues.filter((item) => item.status === 'Issued').length;

  function resetBookForm() {
    setBookForm({ id: '', title: '', author: '', category: '', quantity: 1 });
    setEditingBookId('');
  }

  function handleLogin(e) {
    e.preventDefault();
    if (loginForm.role === 'admin') {
      if (loginForm.username === initialAdmin.username && loginForm.password === initialAdmin.password) {
        setAuth({ role: 'admin', user: initialAdmin });
        setActiveTab('dashboard');
        setMessage('Admin login successful');
        return;
      }
    } else {
      const student = students.find(
        (s) => s.id === loginForm.username && s.password === loginForm.password
      );
      if (student) {
        localStorage.setItem(
          'college-library-current-student',
          JSON.stringify({ id: student.id, name: student.name })
        );
        setAuth({ role: 'student', user: student });
        setActiveTab('dashboard');
        setMessage(`Welcome ${student.name}`);
        return;
      }
    }
    setMessage('Invalid login details');
  }

  function handleStudentRegister(e) {
    e.preventDefault();
    const { id, name, password, dept, year } = studentRegisterForm;

    if (!id || !name || !password || !dept || !year) {
      setMessage('Please fill all student details');
      return;
    }

    if (students.some((student) => student.id === id)) {
      setMessage('Student ID already exists');
      return;
    }

    const newStudent = { id, name, password, dept, year };
    setStudents((prev) => [...prev, newStudent]);
    localStorage.setItem(
      'college-library-current-student',
      JSON.stringify({ id: newStudent.id, name: newStudent.name })
    );
    setStudentRegisterForm({ id: '', name: '', password: '', dept: '', year: '' });
    setShowStudentRegister(false);
    setMessage('Student account created and saved in local storage');
  }

  function handleSaveBook(e) {
    e.preventDefault();
    const quantity = Number(bookForm.quantity);
    if (!bookForm.id || !bookForm.title || !bookForm.author || !bookForm.category || quantity < 1) {
      setMessage('Please fill all book details correctly');
      return;
    }

    if (editingBookId) {
      setBooks((prev) =>
        prev.map((book) =>
          book.id === editingBookId
            ? {
                ...book,
                ...bookForm,
                quantity,
                available: Math.max(0, Math.min(book.available + (quantity - book.quantity), quantity)),
              }
            : book
        )
      );
      setMessage('Book updated successfully');
    } else {
      if (books.some((book) => book.id === bookForm.id)) {
        setMessage('Book ID already exists');
        return;
      }
      setBooks((prev) => [...prev, { ...bookForm, quantity, available: quantity }]);
      setMessage('Book added successfully');
    }
    resetBookForm();
  }

  function handleEditBook(book) {
    setBookForm({
      id: book.id,
      title: book.title,
      author: book.author,
      category: book.category,
      quantity: book.quantity,
    });
    setEditingBookId(book.id);
    setActiveTab('books');
  }

  function handleDeleteBook(bookId) {
    const hasActiveIssue = issues.some((item) => item.bookId === bookId && item.status === 'Issued');
    if (hasActiveIssue) {
      setMessage('Cannot delete book while it is issued');
      return;
    }
    setBooks((prev) => prev.filter((book) => book.id !== bookId));
    setMessage('Book deleted successfully');
  }

  function handleIssueBook(e) {
    e.preventDefault();
    const selectedBook = books.find((b) => b.id === issueForm.bookId);
    const selectedStudent = students.find((s) => s.id === issueForm.studentId);

    if (!selectedBook || !selectedStudent) {
      setMessage('Select a valid book and student');
      return;
    }
    if (selectedBook.available < 1) {
      setMessage('Book is not available');
      return;
    }

    const newIssue = {
      id: `I${Date.now()}`,
      bookId: selectedBook.id,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      bookTitle: selectedBook.title,
      issueDate: today(),
      dueDate: addDays(today(), 14),
      returnDate: '',
      fine: 0,
      status: 'Issued',
    };

    setIssues((prev) => [newIssue, ...prev]);
    setBooks((prev) =>
      prev.map((book) =>
        book.id === selectedBook.id ? { ...book, available: book.available - 1 } : book
      )
    );
    setIssueForm({ bookId: '', studentId: '' });
    setMessage('Book issued successfully');
  }

  function handleReturnBook(issueId) {
    const issue = issues.find((item) => item.id === issueId);
    if (!issue || issue.status === 'Returned') return;

    const returnDate = today();
    const fine = calculateFine(issue.dueDate, returnDate);

    setIssues((prev) =>
      prev.map((item) =>
        item.id === issueId
          ? { ...item, returnDate, fine, status: 'Returned' }
          : item
      )
    );

    setBooks((prev) =>
      prev.map((book) =>
        book.id === issue.bookId ? { ...book, available: book.available + 1 } : book
      )
    );
    setMessage('Book returned successfully');
  }

  function logout() {
    localStorage.removeItem('college-library-current-student');
    setAuth({ role: '', user: null });
    setLoginForm({ role: 'admin', username: '', password: '' });
    setMessage('Logged out');
  }

  function resetLocalDatabase() {
    setBooks(initialBooks);
    setStudents(initialStudents);
    setIssues(initialIssues);
    setMessage('Local database reset completed');
  }

  if (!auth.role) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl grid md:grid-cols-2 rounded-[2rem] overflow-hidden shadow-xl border bg-white">
          <div className="bg-slate-900 text-white p-8 md:p-10 flex flex-col justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-slate-300">College ERP</div>
              <h1 className="text-4xl font-bold mt-4 leading-tight">Library Management System</h1>
              <p className="text-slate-300 mt-4 text-base">
                Admin and student login, book management, issue-return tracking, search, filters, and local database support with browser localStorage.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
              <StatCard title="Default Admin" value="admin" subtext="Password: admin123" />
              <StatCard title="Sample Student" value="S101" subtext="Password: asha123" />
            </div>
          </div>

          <div className="p-8 md:p-10 bg-white">
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setShowStudentRegister(false)}
                className={`rounded-2xl px-4 py-2.5 border ${!showStudentRegister ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700'}`}
              >
                Login
              </button>
              <button
                onClick={() => {
                  setShowStudentRegister(true);
                  setLoginForm((prev) => ({ ...prev, role: 'student' }));
                }}
                className={`rounded-2xl px-4 py-2.5 border ${showStudentRegister ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700'}`}
              >
                Student Register
              </button>
            </div>

            {!showStudentRegister ? (
              <>
                <h2 className="text-2xl font-semibold text-slate-900">Login</h2>
                <p className="text-slate-500 mt-2">Choose your role and sign in.</p>

                <form onSubmit={handleLogin} className="space-y-4 mt-6">
                  <Select
                    label="Login As"
                    value={loginForm.role}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, role: e.target.value, username: '', password: '' }))}
                  >
                    <option value="admin">Admin</option>
                    <option value="student">Student</option>
                  </Select>

                  <Input
                    label={loginForm.role === 'admin' ? 'Username' : 'Student ID'}
                    placeholder={loginForm.role === 'admin' ? 'Enter admin username' : 'Enter student ID'}
                    value={loginForm.username}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
                  />

                  <Input
                    label="Password"
                    type="password"
                    placeholder="Enter password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                  />

                  <button type="submit" className="w-full rounded-2xl bg-slate-900 text-white px-4 py-3 font-medium shadow-sm">
                    Sign In
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-slate-900">Student Registration</h2>
                <p className="text-slate-500 mt-2">Create a student account and save it to local storage.</p>

                <form onSubmit={handleStudentRegister} className="grid sm:grid-cols-2 gap-4 mt-6">
                  <Input label="Student ID" placeholder="Enter user ID" value={studentRegisterForm.id} onChange={(e) => setStudentRegisterForm((prev) => ({ ...prev, id: e.target.value }))} />
                  <Input label="Student Name" placeholder="Enter name" value={studentRegisterForm.name} onChange={(e) => setStudentRegisterForm((prev) => ({ ...prev, name: e.target.value }))} />
                  <Input label="Password" type="password" placeholder="Enter password" value={studentRegisterForm.password} onChange={(e) => setStudentRegisterForm((prev) => ({ ...prev, password: e.target.value }))} />
                  <Input label="Department" placeholder="Enter department" value={studentRegisterForm.dept} onChange={(e) => setStudentRegisterForm((prev) => ({ ...prev, dept: e.target.value }))} />
                  <Input label="Year" placeholder="Enter year" value={studentRegisterForm.year} onChange={(e) => setStudentRegisterForm((prev) => ({ ...prev, year: e.target.value }))} />
                  <div className="sm:col-span-2">
                    <button type="submit" className="w-full rounded-2xl bg-slate-900 text-white px-4 py-3 font-medium shadow-sm">
                      Create Student Account
                    </button>
                  </div>
                </form>
              </>
            )}

            {message ? (
              <div className="mt-4 rounded-2xl bg-slate-100 border px-4 py-3 text-sm text-slate-700">{message}</div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const navItems = auth.role === 'admin'
    ? [
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'books', label: 'Books' },
        { key: 'issue', label: 'Issue / Return' },
        { key: 'students', label: 'Students' },
      ]
    : [
        { key: 'dashboard', label: 'Dashboard' },
        { key: 'catalog', label: 'Book Catalog' },
        { key: 'mybooks', label: 'My Books' },
      ];

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-[2rem] bg-white border shadow-sm p-5 md:p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">College Library Management System</h1>
            <p className="text-slate-600 mt-2">
              {auth.role === 'admin'
                ? 'Manage local records for books, students, issue and return operations.'
                : `Welcome back, ${auth.user.name}. Browse books and track your issued records.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`rounded-2xl px-4 py-2.5 border ${activeTab === item.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700'}`}
              >
                {item.label}
              </button>
            ))}
            <button onClick={logout} className="rounded-2xl px-4 py-2.5 bg-rose-50 text-rose-700 border border-rose-200">
              Logout
            </button>
          </div>
        </div>

        {message ? (
          <div className="rounded-2xl border bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">{message}</div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard title="Total Books" value={books.length} subtext="Book titles in local database" />
          <StatCard title="Available Copies" value={books.reduce((sum, b) => sum + b.available, 0)} subtext="Ready to issue" />
          <StatCard title="Issued Records" value={issuedCount} subtext="Currently active issues" />
          <StatCard title="Collected / Pending Fines" value={`₹${totalFines}`} subtext="Calculated from returns" />
        </div>

        {(activeTab === 'dashboard' || activeTab === 'catalog' || activeTab === 'books') && (
          <div className="rounded-[2rem] bg-white border shadow-sm p-5 md:p-6 space-y-5">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{auth.role === 'admin' ? 'Book Management' : 'Book Catalog'}</h2>
                <p className="text-slate-500 mt-1">Search by ID, title, author, or category with filters.</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 w-full lg:w-auto">
                <Input label="Search" placeholder="Search books..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">All</option>
                  <option value="Available">Available</option>
                  <option value="Out of Stock">Out of Stock</option>
                </Select>
                <Select label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="py-3 pr-4">Book ID</th>
                    <th className="py-3 pr-4">Title</th>
                    <th className="py-3 pr-4">Author</th>
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">Quantity</th>
                    <th className="py-3 pr-4">Available</th>
                    {auth.role === 'admin' ? <th className="py-3 pr-4">Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((book) => (
                    <tr key={book.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{book.id}</td>
                      <td className="py-3 pr-4">{book.title}</td>
                      <td className="py-3 pr-4">{book.author}</td>
                      <td className="py-3 pr-4">{book.category}</td>
                      <td className="py-3 pr-4">{book.quantity}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${book.available > 0 ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                          {book.available}
                        </span>
                      </td>
                      {auth.role === 'admin' ? (
                        <td className="py-3 pr-4">
                          <div className="flex gap-2">
                            <button onClick={() => handleEditBook(book)} className="rounded-xl border px-3 py-1.5 text-sm">Edit</button>
                            <button onClick={() => handleDeleteBook(book.id)} className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-3 py-1.5 text-sm">Delete</button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                  {filteredBooks.length === 0 ? (
                    <tr>
                      <td colSpan={auth.role === 'admin' ? 7 : 6} className="py-6 text-center text-slate-500">No books found.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {auth.role === 'admin' && activeTab === 'books' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-[2rem] bg-white border shadow-sm p-5 md:p-6">
              <h2 className="text-2xl font-semibold text-slate-900">{editingBookId ? 'Edit Book' : 'Add Book'}</h2>
              <form onSubmit={handleSaveBook} className="grid sm:grid-cols-2 gap-4 mt-5">
                <Input label="Book ID" value={bookForm.id} onChange={(e) => setBookForm((prev) => ({ ...prev, id: e.target.value }))} disabled={Boolean(editingBookId)} />
                <Input label="Title" value={bookForm.title} onChange={(e) => setBookForm((prev) => ({ ...prev, title: e.target.value }))} />
                <Input label="Author" value={bookForm.author} onChange={(e) => setBookForm((prev) => ({ ...prev, author: e.target.value }))} />
                <Input label="Category" value={bookForm.category} onChange={(e) => setBookForm((prev) => ({ ...prev, category: e.target.value }))} />
                <Input label="Quantity" type="number" min="1" value={bookForm.quantity} onChange={(e) => setBookForm((prev) => ({ ...prev, quantity: e.target.value }))} />
                <div className="flex items-end gap-3">
                  <button type="submit" className="rounded-2xl bg-slate-900 text-white px-5 py-3">{editingBookId ? 'Update Book' : 'Add Book'}</button>
                  <button type="button" onClick={resetBookForm} className="rounded-2xl border px-5 py-3">Clear</button>
                </div>
              </form>
            </div>

            <div className="rounded-[2rem] bg-white border shadow-sm p-5 md:p-6">
              <h2 className="text-2xl font-semibold text-slate-900">Local Database</h2>
              <p className="text-slate-500 mt-2">
                Data is stored in your browser using localStorage. This works like a small local database for demo or college project use.
              </p>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-slate-50 border p-4 text-sm text-slate-700">
                  Books key: <span className="font-mono">{storageKeys.books}</span>
                  <br />
                  Students key: <span className="font-mono">{storageKeys.students}</span>
                  <br />
                  Issues key: <span className="font-mono">{storageKeys.issues}</span>
                </div>
                <button onClick={resetLocalDatabase} className="rounded-2xl bg-amber-100 text-amber-900 border border-amber-200 px-5 py-3">
                  Reset Local Database
                </button>
              </div>
            </div>
          </div>
        )}

        {auth.role === 'admin' && activeTab === 'issue' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-[2rem] bg-white border shadow-sm p-5 md:p-6">
              <h2 className="text-2xl font-semibold text-slate-900">Issue Book</h2>
              <form onSubmit={handleIssueBook} className="grid gap-4 mt-5">
                <Select label="Select Book" value={issueForm.bookId} onChange={(e) => setIssueForm((prev) => ({ ...prev, bookId: e.target.value }))}>
                  <option value="">Choose a book</option>
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.id} - {book.title} ({book.available} available)
                    </option>
                  ))}
                </Select>
                <Select label="Select Student" value={issueForm.studentId} onChange={(e) => setIssueForm((prev) => ({ ...prev, studentId: e.target.value }))}>
                  <option value="">Choose a student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.id} - {student.name}
                    </option>
                  ))}
                </Select>
                <button type="submit" className="w-fit rounded-2xl bg-slate-900 text-white px-5 py-3">Issue Book</button>
              </form>
            </div>

            <div className="rounded-[2rem] bg-white border shadow-sm p-5 md:p-6">
              <h2 className="text-2xl font-semibold text-slate-900">Return Book</h2>
              <div className="space-y-3 mt-5 max-h-[420px] overflow-auto pr-1">
                {issues.filter((item) => item.status === 'Issued').map((item) => (
                  <div key={item.id} className="rounded-2xl border p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{item.bookTitle}</div>
                      <div className="text-sm text-slate-600">Student: {item.studentName}</div>
                      <div className="text-sm text-slate-600">Due Date: {item.dueDate}</div>
                    </div>
                    <button onClick={() => handleReturnBook(item.id)} className="rounded-2xl bg-green-100 text-green-800 border border-green-200 px-4 py-2.5">
                      Return Now
                    </button>
                  </div>
                ))}
                {issues.filter((item) => item.status === 'Issued').length === 0 ? (
                  <div className="text-slate-500">No active issue records.</div>
                ) : null}
              </div>
            </div>

            <div className="lg:col-span-2 rounded-[2rem] bg-white border shadow-sm p-5 md:p-6">
              <h2 className="text-2xl font-semibold text-slate-900">Issue History</h2>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="py-3 pr-4">Issue ID</th>
                      <th className="py-3 pr-4">Book</th>
                      <th className="py-3 pr-4">Student</th>
                      <th className="py-3 pr-4">Issue Date</th>
                      <th className="py-3 pr-4">Due Date</th>
                      <th className="py-3 pr-4">Return Date</th>
                      <th className="py-3 pr-4">Fine</th>
                      <th className="py-3 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">{item.id}</td>
                        <td className="py-3 pr-4">{item.bookTitle}</td>
                        <td className="py-3 pr-4">{item.studentName}</td>
                        <td className="py-3 pr-4">{item.issueDate}</td>
                        <td className="py-3 pr-4">{item.dueDate}</td>
                        <td className="py-3 pr-4">{item.returnDate || '-'}</td>
                        <td className="py-3 pr-4">₹{item.fine}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-3 py-1 rounded-full text-sm ${item.status === 'Issued' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {auth.role === 'admin' && activeTab === 'students' && (
          <div className="rounded-[2rem] bg-white border shadow-sm p-5 md:p-6">
            <h2 className="text-2xl font-semibold text-slate-900">Student Records</h2>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="py-3 pr-4">Student ID</th>
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Department</th>
                    <th className="py-3 pr-4">Year</th>
                    <th className="py-3 pr-4">Issued Books</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{student.id}</td>
                      <td className="py-3 pr-4">{student.name}</td>
                      <td className="py-3 pr-4">{student.dept}</td>
                      <td className="py-3 pr-4">{student.year}</td>
                      <td className="py-3 pr-4">
                        {issues.filter((item) => item.studentId === student.id && item.status === 'Issued').length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {auth.role === 'student' && activeTab === 'mybooks' && (
          <div className="rounded-[2rem] bg-white border shadow-sm p-5 md:p-6">
            <h2 className="text-2xl font-semibold text-slate-900">My Issued Books</h2>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="py-3 pr-4">Book</th>
                    <th className="py-3 pr-4">Issue Date</th>
                    <th className="py-3 pr-4">Due Date</th>
                    <th className="py-3 pr-4">Return Date</th>
                    <th className="py-3 pr-4">Fine</th>
                    <th className="py-3 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStudentIssues.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{item.bookTitle}</td>
                      <td className="py-3 pr-4">{item.issueDate}</td>
                      <td className="py-3 pr-4">{item.dueDate}</td>
                      <td className="py-3 pr-4">{item.returnDate || '-'}</td>
                      <td className="py-3 pr-4">₹{item.fine}</td>
                      <td className="py-3 pr-4">{item.status}</td>
                    </tr>
                  ))}
                  {currentStudentIssues.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">No issue records found.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
