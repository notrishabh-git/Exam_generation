import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, MoreVertical, Mail, Search, Filter, X, ArrowLeft } from 'lucide-react';
import './Students.css';

const INITIAL_MOCK_STUDENTS = [
  { id: 1, name: 'Aarav Patel',    srn: 'PES2UG22CS014', section: 'A', isa1: 35, isa2: 38, esa: 92, status: 'active' },
  { id: 2, name: 'Sneha Rao',      srn: 'PES2UG23EC102', section: 'B', isa1: 28, isa2: 30, esa: 81, status: 'active' },
  { id: 3, name: 'Karan Sharma',   srn: 'PES2UG24AM005', section: 'C', isa1: 39, isa2: 40, esa: 95, status: 'active' },
  { id: 4, name: 'Priya Desai',    srn: 'PES2UG21CS241', section: 'A', isa1: 20, isa2: 25, esa: 65, status: 'inactive' },
  { id: 5, name: 'Rishabh Kumar',  srn: 'PES2UG24AM135', section: 'B', isa1: 38, isa2: 36, esa: 89, status: 'active' },
  { id: 6, name: 'Aditya Singh',   srn: 'PES2UG22EC088', section: 'C', isa1: 30, isa2: 32, esa: 78, status: 'active' },
  { id: 7, name: 'Kavya Reddy',    srn: 'PES2UG23CS301', section: 'A', isa1: 32, isa2: 35, esa: 85, status: 'active' },
  { id: 8, name: 'Rahul Varma',    srn: 'PES2UG22AM112', section: 'C', isa1: 25, isa2: 22, esa: 58, status: 'active' }
];

const getBranch = (srn) => {
  const match = srn.toUpperCase().match(/PES2UG\d{2}([A-Z]{2})/);
  return match ? match[1] : '-';
};

const getSemester = (srn) => {
  const match = srn.toUpperCase().match(/PES2UG(\d{2})/);
  if (!match) return '-';
  const joinYear = 2000 + parseInt(match[1]);
  const currentYear = 2026;
  const currentMonth = 3; 
  let yearsDiff = currentYear - joinYear;
  let sem = currentMonth >= 7 ? yearsDiff * 2 + 1 : yearsDiff * 2;
  return sem > 0 ? `${sem}` : '1';
};

export default function Students() {
  const navigate = useNavigate();
  const [studentsList, setStudentsList] = useState(INITIAL_MOCK_STUDENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [selectedSemester, setSelectedSemester] = useState('All');

  // Options Dropdown State
  const [dropdownOpenId, setDropdownOpenId] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [newStudent, setNewStudent] = useState({
    name: '',
    srn: '',
    section: 'A',
    isa1: '',
    isa2: '',
    esa: '',
    status: 'active'
  });

  const openAddModal = () => {
    setEditingStudentId(null);
    setNewStudent({ name: '', srn: '', section: 'A', isa1: '', isa2: '', esa: '', status: 'active' });
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudentId(student.id);
    setNewStudent({ ...student });
    setDropdownOpenId(null); // Close dropdown
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setStudentsList(studentsList.filter(s => s.id !== id));
    setDropdownOpenId(null); // Close dropdown
  };

  const handleSaveStudent = (e) => {
    e.preventDefault();
    if (editingStudentId) {
      // Update
      setStudentsList(studentsList.map(s => 
        s.id === editingStudentId 
          ? { 
              ...newStudent, 
              id: editingStudentId, 
              srn: newStudent.srn.toUpperCase(), 
              isa1: Number(newStudent.isa1), 
              isa2: Number(newStudent.isa2), 
              esa: Number(newStudent.esa) 
            } 
          : s
      ));
    } else {
      // Add
      const studentObj = {
        id: Date.now(),
        name: newStudent.name,
        srn: newStudent.srn.toUpperCase(),
        section: newStudent.section,
        isa1: Number(newStudent.isa1) || 0,
        isa2: Number(newStudent.isa2) || 0,
        esa: Number(newStudent.esa) || 0,
        status: newStudent.status
      };
      setStudentsList([...studentsList, studentObj]);
    }
    setIsModalOpen(false);
  };

  // Close dropdown if clicked outside (simplified by just clicking anywhere on the page to reset)
  const closeDropdownCheck = () => {
    if (dropdownOpenId) setDropdownOpenId(null);
  }

  const filteredStudents = studentsList.filter(student => {
    const term = searchTerm.toLowerCase();
    const branch = getBranch(student.srn);
    const semester = getSemester(student.srn);
    
    const matchesSearch = student.srn.toLowerCase().includes(term) || student.name.toLowerCase().includes(term);
    const matchesSection = selectedSection === 'All' || student.section === selectedSection;
    const matchesBranch = selectedBranch === 'All' || branch === selectedBranch;
    const matchesSemester = selectedSemester === 'All' || semester === selectedSemester;
    
    return matchesSearch && matchesSection && matchesBranch && matchesSemester;
  });

  return (
    <div className="students-page" onClick={closeDropdownCheck}>
      <div className="students-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate(-1)}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-dim)', color: 'var(--text-secondary)', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
            title="Go Back"
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
           <ArrowLeft size={18} />
          </button>
          <h1 className="students-title" style={{ margin: 0 }}>Enrolled Students</h1>
        </div>
        <button className="add-student-btn" onClick={openAddModal}>
          <UserPlus size={16} />
          Add Student
        </button>
      </div>

      <div className="students-filters">
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search explicitly by SRN (e.g. PES2UG24AM135) or Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="section-dropdown">
          <Filter size={16} className="filter-icon" />
          <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
            <option value="All">All Branches</option>
            <option value="CS">CS (Computer Science)</option>
            <option value="EC">EC (Electronics)</option>
            <option value="AM">AM (AI & ML)</option>
          </select>
        </div>
        <div className="section-dropdown">
          <Filter size={16} className="filter-icon" />
          <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
            <option value="All">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
              <option key={sem} value={String(sem)}>Semester {sem}</option>
            ))}
          </select>
        </div>
        <div className="section-dropdown">
          <Filter size={16} className="filter-icon" />
          <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
            <option value="All">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>
        </div>
      </div>

      <div className="students-table-container">
        <table className="students-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>SRN</th>
              <th>Branch</th>
              <th>Sem</th>
              <th>Sec</th>
              <th style={{ textAlign: 'center' }}>ISA 1 <span className="max-marks">(40)</span></th>
              <th style={{ textAlign: 'center' }}>ISA 2 <span className="max-marks">(40)</span></th>
              <th style={{ textAlign: 'center' }}>ESA <span className="max-marks">(100)</span></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(student => (
              <tr key={student.id}>
                <td>
                  <div className="student-name-cell">
                    <div className="student-avatar">{student.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{student.name}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                  {student.srn}
                </td>
                <td><span className="section-badge" style={{ background: 'rgba(79, 142, 247, 0.1)', color: 'var(--blue)' }}>{getBranch(student.srn)}</span></td>
                <td style={{ color: 'var(--text-secondary)' }}>Sem {getSemester(student.srn)}</td>
                <td><span className="section-badge">{student.section}</span></td>
                <td style={{ textAlign: 'center', fontWeight: '500' }}>{student.isa1}</td>
                <td style={{ textAlign: 'center', fontWeight: '500' }}>{student.isa2}</td>
                <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--blue-light)' }}>{student.esa}</td>
                <td style={{ textAlign: 'right', position: 'relative' }}>
                  <button className="action-btn" title="Email Student">
                    <Mail size={16} />
                  </button>
                  <button 
                    className="action-btn" 
                    title="More Options"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevention so closeDropdownCheck doesn't immediately close it
                      setDropdownOpenId(dropdownOpenId === student.id ? null : student.id);
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {dropdownOpenId === student.id && (
                    <div className="action-dropdown" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEditModal(student)}>Edit Student</button>
                      <button className="text-danger" onClick={() => handleDelete(student.id)}>Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                  No students found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="modal-title" style={{ margin: 0 }}>
                {editingStudentId ? 'Edit Student' : 'Add New Student'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveStudent}>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  required 
                  type="text" 
                  placeholder="John Doe" 
                  value={newStudent.name} 
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                />
              </div>
              
              <div className="grid-2">
                <div className="form-group">
                  <label>SRN (PES2UG..)</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="PES2UG24AM135" 
                    value={newStudent.srn} 
                    onChange={(e) => setNewStudent({...newStudent, srn: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Section</label>
                  <select 
                    value={newStudent.section} 
                    onChange={(e) => setNewStudent({...newStudent, section: e.target.value})}
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label>ISA 1 (40)</label>
                  <input 
                    required 
                    type="number" 
                    max="40" min="0" 
                    value={newStudent.isa1} 
                    onChange={(e) => setNewStudent({...newStudent, isa1: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>ISA 2 (40)</label>
                  <input 
                    required 
                    type="number" 
                    max="40" min="0" 
                    value={newStudent.isa2} 
                    onChange={(e) => setNewStudent({...newStudent, isa2: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>ESA (100)</label>
                  <input 
                    required 
                    type="number" 
                    max="100" min="0" 
                    value={newStudent.esa} 
                    onChange={(e) => setNewStudent({...newStudent, esa: e.target.value})}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="modal-btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="modal-btn-primary">
                  {editingStudentId ? 'Update Record' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
