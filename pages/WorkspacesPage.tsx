
import React, { useState, useMemo } from 'react';
import { Plus, Users, Globe, Lock, MoreVertical, Search, Filter, Share2, ArrowRight, X, Check, UserPlus, Mail, Shield, Briefcase, Clock, Trash2, AlertCircle } from 'lucide-react';
import { useCourseContext } from '../store/useCourseStore';
import { Course, UserProfile, Workspace, Invitation } from '../types';
import { Link } from 'react-router-dom';

// Fixed height so every card is identical regardless of name length or
// member count — content is truncated to fit rather than resizing the card.
const WorkspaceCard = ({ name, membersCount, visibility, isActive, onClick, onDeleteRequest, initial }: any) => (
  <div
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    className={`w-full md:w-auto h-[76px] shrink-0 text-left p-4 rounded-2xl transition-all border flex items-center justify-between group animate-in fade-in duration-300 min-w-[240px] md:min-w-0 cursor-pointer ${isActive ? 'bg-gemini-accent/5 border-gemini-accent/20 shadow-sm' : 'bg-transparent border-gemini-border hover:bg-gemini-surface'}`}
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-colors shrink-0 uppercase ${isActive ? 'bg-gemini-accent text-gemini-bg' : 'bg-gemini-bg text-gemini-dim group-hover:bg-gemini-border group-hover:text-gemini-accent'}`}>
        {initial}
      </div>
      <div className="min-w-0">
        <h4 className={`font-bold text-sm transition-colors truncate ${isActive ? 'text-gemini-accent' : 'text-gemini-text group-hover:text-gemini-accent'}`}>{name}</h4>
        <div className="flex items-center gap-2 text-[10px] text-gemini-dim uppercase tracking-wider">
          {visibility === 'public' ? <Globe size={10} className="shrink-0"/> : <Lock size={10} className="shrink-0"/>}
          <span className="truncate">{membersCount} membres</span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-1 shrink-0 ml-2">
      <button
        onClick={(e) => { e.stopPropagation(); onDeleteRequest(); }}
        className="p-1.5 rounded-lg text-gemini-dim opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all"
        title="Supprimer"
      >
        <Trash2 size={14} />
      </button>
      <ArrowRight size={16} className={`transition-all duration-300 text-gemini-accent hidden md:block ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`} />
    </div>
  </div>
);

const WorkspacesPage: React.FC = () => {
  const {
    courses,
    updateCourse,
    workspaces,
    addWorkspace,
    deleteWorkspace,
    invitations,
    sendInvitation,
    getWorkspaceMembers,
    currentUser,
    t
  } = useCourseContext();

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(workspaces[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCreateWSModalOpen, setIsCreateWSModalOpen] = useState(false);
  const [isManageTeamModalOpen, setIsManageTeamModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  // Forms state
  const [newWSName, setNewWSName] = useState('');
  const [newWSVisibility, setNewWSVisibility] = useState<'public' | 'private'>('private');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'success'>('idle');

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

  const workspaceCourses = useMemo(() => {
    if (!activeWorkspace) return [];
    return courses.filter(c => 
      c.workspace === activeWorkspace.id && 
      c.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [courses, activeWorkspace, searchTerm]);

  const availableToShare = useMemo(() => {
    if (!activeWorkspace) return [];
    return courses.filter(c => c.workspace !== activeWorkspace.id);
  }, [courses, activeWorkspace]);

  const activeWorkspaceMembers = useMemo(() => {
    if (!activeWorkspace) return [];
    return getWorkspaceMembers(activeWorkspace.id);
  }, [activeWorkspace, getWorkspaceMembers]);

  const activeWorkspaceInvitations = useMemo(() => {
    if (!activeWorkspace) return [];
    return invitations.filter(inv => inv.workspaceId === activeWorkspace.id && inv.status === 'pending');
  }, [activeWorkspace, invitations]);

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWSName.trim()) return;
    addWorkspace(newWSName, newWSVisibility);
    setNewWSName('');
    setIsCreateWSModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    deleteWorkspace(deleteConfirm.id);
    if (activeWorkspaceId === deleteConfirm.id) {
      const remaining = workspaces.filter(w => w.id !== deleteConfirm.id);
      setActiveWorkspaceId(remaining[0]?.id || '');
    }
    setDeleteConfirm(null);
  };

  const handleShareToWorkspace = (course: Course) => {
    if (!activeWorkspace) return;
    updateCourse({ ...course, workspace: activeWorkspace.id });
    setIsShareModalOpen(false);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeWorkspace) return;
    sendInvitation(activeWorkspace.id, inviteEmail);
    setInviteEmail('');
    setInviteStatus('success');
    setTimeout(() => setInviteStatus('idle'), 3000);
  };

  const createWorkspaceModal = isCreateWSModalOpen && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsCreateWSModalOpen(false)}></div>
      <form onSubmit={handleCreateWorkspace} className="relative w-full max-w-md bg-gemini-surface border border-gemini-border rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <div className="p-8 border-b border-gemini-border flex items-center justify-between">
          <h3 className="text-2xl font-bold font-outfit text-gemini-accent">{t('workspace.createModalTitle')}</h3>
          <button type="button" onClick={() => setIsCreateWSModalOpen(false)} className="p-2 hover:bg-gemini-bg rounded-full transition-colors text-gemini-dim"><X size={20}/></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gemini-dim ml-1">{t('workspace.teamName')}</label>
            <input
              autoFocus
              type="text"
              value={newWSName}
              onChange={(e) => setNewWSName(e.target.value)}
              placeholder={t('workspace.teamPlaceholder')}
              className="w-full bg-gemini-bg border border-gemini-border rounded-2xl px-5 py-4 text-sm outline-none focus:border-gemini-dim transition-all placeholder:text-gemini-dim/50 text-gemini-text"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gemini-dim ml-1">{t('workspace.visibility')}</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNewWSVisibility('private')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${newWSVisibility === 'private' ? 'bg-gemini-accent text-gemini-bg border-gemini-accent shadow-md' : 'bg-gemini-bg border-gemini-border text-gemini-dim hover:text-gemini-text'}`}
              >
                <Lock size={20} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{t('workspace.private')}</span>
              </button>
              <button
                type="button"
                onClick={() => setNewWSVisibility('public')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${newWSVisibility === 'public' ? 'bg-gemini-accent text-gemini-bg border-gemini-accent shadow-md' : 'bg-gemini-bg border-gemini-border text-gemini-dim hover:text-gemini-text'}`}
              >
                <Globe size={20} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{t('workspace.public')}</span>
              </button>
            </div>
          </div>
        </div>
        <div className="p-8 bg-gemini-bg/30 border-t border-gemini-border flex gap-3">
          <button type="button" onClick={() => setIsCreateWSModalOpen(false)} className="flex-1 px-6 py-4 border border-gemini-border rounded-2xl text-[11px] font-bold uppercase tracking-widest text-gemini-dim hover:text-gemini-accent transition-all">{t('workspace.cancel')}</button>
          <button type="submit" disabled={!newWSName.trim()} className="flex-1 px-6 py-4 bg-gemini-accent text-gemini-bg rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-lg">{t('workspace.create')}</button>
        </div>
      </form>
    </div>
  );

  const deleteConfirmModal = deleteConfirm && (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setDeleteConfirm(null)}></div>
      <div className="relative w-full max-w-md bg-gemini-surface border border-gemini-border rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2 border border-red-500/20">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold font-outfit text-gemini-text">{t('workspace.deleteConfirmTitle', { name: deleteConfirm.name })}</h3>
            <p className="text-sm text-gemini-dim leading-relaxed">{t('workspace.deleteConfirmDesc')}</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 px-6 py-4 bg-gemini-bg border border-gemini-border rounded-2xl text-[10px] font-bold uppercase tracking-widest text-gemini-text hover:bg-gemini-surface transition-all"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleConfirmDelete}
              className="flex-1 px-6 py-4 bg-red-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 shadow-lg active:scale-95 transition-all"
            >
              {t('common.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!activeWorkspace) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center gap-6 bg-gemini-bg p-8">
        <div className="w-20 h-20 bg-gemini-surface rounded-[2rem] flex items-center justify-center border border-gemini-border shadow-xl text-gemini-dim">
          <Briefcase size={32} />
        </div>
        <div className="space-y-2 max-w-sm">
          <h3 className="text-2xl font-bold font-outfit text-gemini-accent">{t('workspace.emptyTitle')}</h3>
          <p className="text-gemini-dim text-sm leading-relaxed">{t('workspace.emptyDesc')}</p>
        </div>
        <button
          onClick={() => setIsCreateWSModalOpen(true)}
          className="inline-flex items-center gap-2 bg-gemini-accent text-gemini-bg px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus size={16} /> {t('workspace.emptyCta')}
        </button>
        {createWorkspaceModal}
      </div>
    );
  }

  const detailHeaderInner = (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-gemini-dim text-[10px] font-bold uppercase tracking-[0.3em]">
          <Briefcase size={14} /> {t('workspace.subtitle')} {activeWorkspace.name}
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-4xl md:text-5xl font-bold font-outfit text-gemini-accent tracking-tight">{activeWorkspace.name}</h1>
          <div className="px-2 py-0.5 rounded bg-gemini-surface text-[10px] text-gemini-dim uppercase tracking-widest border border-gemini-border mt-2">
            {activeWorkspace.visibility === 'public' ? t('workspace.public') : t('workspace.private')}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
         <div className="flex -space-x-2">
            {activeWorkspaceMembers.slice(0, 4).map((m, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-gemini-surface border-2 border-gemini-bg flex items-center justify-center text-[10px] font-bold text-gemini-dim overflow-hidden shadow-sm" title={m.profile.name}>
                {m.profile.avatar ? <img src={m.profile.avatar} alt="user" className="w-full h-full object-cover" /> : m.profile.initials}
              </div>
            ))}
            {activeWorkspaceMembers.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-gemini-accent border-2 border-gemini-bg flex items-center justify-center text-[10px] font-bold text-gemini-bg shadow-lg">
                +{activeWorkspaceMembers.length - 4}
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsManageTeamModalOpen(true)}
            className="md:ml-4 bg-gemini-surface border border-gemini-border px-4 py-2 rounded-xl text-xs md:text-sm font-medium hover:border-gemini-dim transition-all flex items-center gap-2 group text-gemini-dim hover:text-gemini-accent"
          >
            <Users size={16} /> <span className="hidden md:inline">{t('workspace.manage')}</span>
          </button>
      </div>
    </>
  );

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-gemini-bg">
      {/* Mobile: workspace title & subtitle first */}
      <header className="md:hidden p-6 border-b border-gemini-border flex flex-col gap-5 shrink-0">
        {detailHeaderInner}
      </header>

      {/* Sidebar - Workspaces List */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-gemini-border flex flex-col shrink-0 animate-in slide-in-from-left duration-300 bg-gemini-sidebar/50">
        <div className="p-4 md:p-6 border-b border-gemini-border flex items-center justify-between bg-gemini-header/30 backdrop-blur-sm">
          <h1 className="text-lg md:text-xl font-bold font-outfit text-gemini-accent flex items-center gap-2"><Briefcase size={20} className="md:hidden"/> {t('workspace.title')}</h1>
          <button 
            onClick={() => setIsCreateWSModalOpen(true)}
            className="p-2 bg-gemini-accent text-gemini-bg rounded-xl hover:opacity-90 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            title={t('workspace.create')}
          >
            <Plus size={18} />
          </button>
        </div>
        
        <div className="flex-none md:flex-1 overflow-x-auto md:overflow-y-auto p-2 md:p-4 space-x-2 md:space-x-0 md:space-y-2 no-scrollbar flex md:block">
          {workspaces.map((ws) => (
            <WorkspaceCard
              key={ws.id}
              name={ws.name}
              initial={ws.name.charAt(0)}
              membersCount={ws.members.length}
              visibility={ws.visibility}
              isActive={activeWorkspace.id === ws.id}
              onClick={() => setActiveWorkspaceId(ws.id)}
              onDeleteRequest={() => setDeleteConfirm({ id: ws.id, name: ws.name })}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-500 relative">
        <header className="hidden md:flex p-10 border-b border-gemini-border md:flex-row md:items-center justify-between gap-6 shrink-0">
          {detailHeaderInner}
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 pb-24 md:pb-10 no-scrollbar">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gemini-surface/50 p-2 rounded-2xl border border-gemini-border backdrop-blur-md sticky top-0 z-10 md:static">
            <div className="flex items-center gap-2 bg-gemini-bg px-4 py-2 rounded-xl flex-1 w-full focus-within:border-gemini-dim border border-gemini-border transition-all">
              <Search size={18} className="text-gemini-dim" />
              <input 
                type="text" 
                placeholder={t('workspace.search')} 
                className="bg-transparent border-none outline-none text-sm w-full py-1 text-gemini-text placeholder:text-gemini-dim/50" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsShareModalOpen(true)}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gemini-accent text-gemini-bg rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <Share2 size={18} /> {t('workspace.share')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaceCourses.length > 0 ? workspaceCourses.map((course) => (
              <div key={course.id} className="glass-card p-6 rounded-[2.5rem] border-gemini-border flex flex-col justify-between group relative hover:bg-gemini-surface transition-all shadow-xl duration-500 bg-gemini-surface/30">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="px-3 py-1 bg-gemini-bg rounded-full text-[10px] font-bold text-gemini-dim uppercase tracking-widest border border-gemini-border">
                      {course.category}
                    </div>
                    <button className="p-2 text-gemini-dim hover:text-gemini-accent transition-colors"><MoreVertical size={16} /></button>
                  </div>
                  <h3 className="text-xl font-bold font-outfit leading-tight text-gemini-text group-hover:text-gemini-accent transition-colors">{course.title}</h3>
                  <p className="text-gemini-dim text-sm line-clamp-2 leading-relaxed">{course.description}</p>
                </div>

                <div className="mt-8 pt-6 border-t border-gemini-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2 grayscale opacity-50">
                       {(course.collaborators || []).length > 0 ? (
                         course.collaborators?.map(c => (
                           <div key={c.id} className="w-6 h-6 rounded-full bg-gemini-accent border border-gemini-bg flex items-center justify-center text-[8px] font-bold text-gemini-bg shadow-sm" title={c.name}>
                             {c.initials}
                           </div>
                         ))
                       ) : (
                         <div className="w-6 h-6 rounded-full bg-gemini-bg border border-gemini-border flex items-center justify-center text-[8px] font-bold text-gemini-dim">
                           ?
                         </div>
                       )}
                    </div>
                    <span className="text-[10px] text-gemini-dim uppercase tracking-wider font-bold">{t('workspace.collaborators')}</span>
                  </div>
                  <Link to={`/learn/${course.id}`} className="p-2.5 bg-gemini-bg border border-gemini-border rounded-xl hover:bg-gemini-accent hover:text-gemini-bg transition-all transform group-hover:scale-110 shadow-lg">
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-12 md:py-24 text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
                <div className="w-24 h-24 bg-gemini-surface rounded-[2.5rem] flex items-center justify-center mx-auto text-gemini-dim border border-gemini-border shadow-2xl">
                  <Share2 size={36} />
                </div>
                <div className="space-y-2 px-4">
                   <h3 className="text-xl md:text-2xl font-bold font-outfit text-gemini-accent">{t('workspace.noCourses')}</h3>
                   <p className="text-gemini-dim max-w-sm mx-auto text-sm leading-relaxed">{t('workspace.noCoursesDesc')}</p>
                </div>
                <button 
                  onClick={() => setIsShareModalOpen(true)}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gemini-surface border border-gemini-border rounded-full text-[11px] font-bold uppercase tracking-widest text-gemini-dim hover:text-gemini-accent hover:border-gemini-dim transition-all shadow-xl"
                >
                  {t('workspace.shareCourse')} <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modals updated for theme */}
        {createWorkspaceModal}
        {deleteConfirmModal}

        {/* Manage Team Modal */}
        {isManageTeamModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsManageTeamModalOpen(false)}></div>
            <div className="relative w-full max-w-lg bg-gemini-surface border border-gemini-border rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300 max-h-[90vh] flex flex-col">
              <div className="p-8 border-b border-gemini-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gemini-bg rounded-xl text-gemini-accent shadow-sm border border-gemini-border">
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold font-outfit text-gemini-accent">{t('workspace.create')}</h3>
                    <p className="text-[10px] text-gemini-dim uppercase tracking-widest font-bold">{activeWorkspaceMembers.length} {t('workspace.activeMembers')}</p>
                  </div>
                </div>
                <button onClick={() => setIsManageTeamModalOpen(false)} className="p-2 hover:bg-gemini-bg rounded-full transition-colors text-gemini-dim"><X size={20}/></button>
              </div>
              
              <div className="p-8 overflow-y-auto space-y-8 no-scrollbar">
                <form onSubmit={handleSendInvite} className="flex gap-2">
                  <div className="flex-1 bg-gemini-bg border border-gemini-border rounded-2xl px-5 py-3 flex items-center gap-3 focus-within:border-gemini-dim transition-all">
                    <Mail size={18} className="text-gemini-dim" />
                    <input 
                      type="email" 
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder={t('workspace.emailPlaceholder')}
                      className="bg-transparent border-none outline-none text-sm w-full text-gemini-text placeholder:text-gemini-dim/50" 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={!inviteEmail || inviteStatus === 'success'}
                    className={`px-5 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md ${inviteStatus === 'success' ? 'bg-green-500 text-white' : 'bg-gemini-accent text-gemini-bg'}`}
                  >
                    {inviteStatus === 'success' ? <Check size={18} /> : t('workspace.invite')}
                  </button>
                </form>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gemini-dim ml-1">{t('workspace.members')}</h4>
                  <div className="space-y-1">
                    {activeWorkspaceMembers.map((member) => (
                      <div key={member.userId} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gemini-bg transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-gemini-bg shadow-lg ${member.profile.color || 'bg-gemini-accent'}`}>
                            {member.profile.initials}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gemini-text">{member.profile.name} {member.userId === currentUser.id && '(Vous)'}</p>
                            <div className="flex items-center gap-1.5 text-[10px] text-gemini-dim">
                              <Shield size={10} /> {member.role}
                            </div>
                          </div>
                        </div>
                        <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-gemini-dim hover:text-gemini-accent">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspacesPage;
