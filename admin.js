document.addEventListener('DOMContentLoaded', () => {
  const loginPanel = document.querySelector('#loginPanel');
  const dashboard = document.querySelector('#dashboard');
  const loginForm = document.querySelector('#loginForm');
  const loginStatus = document.querySelector('#loginStatus');
  const adminStatus = document.querySelector('#adminStatus');
  const projectForm = document.querySelector('#projectForm');
  const projectList = document.querySelector('#projectList');
  const messageList = document.querySelector('#messageList');
  const projectFormTitle = document.querySelector('#projectFormTitle');
  const cancelEditButton = document.querySelector('#cancelEditButton');
  const saveProjectButton = document.querySelector('#saveProjectButton');
  let client;
  let projects = [];

  const showStatus = (element, message, success = false) => {
    element.textContent = message;
    element.classList.toggle('success', success);
  };

  const makeButton = (text, className, onClick) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
  };

  const verifyAdmin = async (user) => {
    const { data, error } = await client
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  };

  const updateStats = () => {
    document.querySelector('#projectCount').textContent = String(projects.length);
    document.querySelector('#publishedCount').textContent =
      String(projects.filter((project) => project.published).length);
  };

  const renderProjects = () => {
    projectList.replaceChildren();
    if (!projects.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No projects yet. Add your first project using the form.';
      projectList.append(empty);
    }

    projects.forEach((project) => {
      const item = document.createElement('article');
      item.className = 'managed-project';
      const details = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = project.title;
      const meta = document.createElement('p');
      meta.textContent = [
        project.category === 'laser' ? 'Laser Work' : 'Graphic Design',
        project.published ? 'Published' : 'Draft',
        project.featured ? 'Featured' : ''
      ].filter(Boolean).join(' · ');
      details.append(title, meta);

      const actions = document.createElement('div');
      actions.className = 'item-actions';
      actions.append(
        makeButton('Edit', 'text-button', () => editProject(project)),
        makeButton('Delete', 'text-button danger-button', () => deleteProject(project))
      );
      item.append(details, actions);
      projectList.append(item);
    });
    updateStats();
  };

  const renderMessages = (messages) => {
    messageList.replaceChildren();
    const unread = messages.filter((message) => !message.read_at).length;
    document.querySelector('#unreadCount').textContent = String(unread);
    if (!messages.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Your inbox is empty. New contact form messages will appear here.';
      messageList.append(empty);
      return;
    }

    messages.forEach((message) => {
      const item = document.createElement('article');
      item.className = `message-card${message.read_at ? '' : ' unread'}`;
      const top = document.createElement('div');
      top.className = 'message-topline';
      const sender = document.createElement('strong');
      sender.textContent = message.name;
      const date = document.createElement('time');
      date.dateTime = message.created_at;
      date.textContent = new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(message.created_at));
      top.append(sender, date);

      const email = document.createElement('a');
      email.className = 'message-email';
      email.href = `mailto:${message.email}`;
      email.textContent = message.email;
      const subject = document.createElement('h3');
      subject.textContent = message.subject;
      const body = document.createElement('p');
      body.className = 'message-body';
      body.textContent = message.message;
      const actions = document.createElement('div');
      actions.className = 'message-actions';
      actions.append(
        makeButton(message.read_at ? 'Mark unread' : 'Mark as read', 'text-button', () => {
          setMessageRead(message, !message.read_at);
        }),
        makeButton('Delete', 'text-button danger-button', () => deleteMessage(message))
      );
      item.append(top, email, subject, body, actions);
      messageList.append(item);
    });
  };

  const loadProjects = async () => {
    const { data, error } = await client
      .from('projects')
      .select('id, title, category, description, image_url, tools, featured, published, sort_order, created_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;
    projects = data;
    renderProjects();
  };

  const loadMessages = async () => {
    const { data, error } = await client
      .from('messages')
      .select('id, name, email, subject, message, read_at, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    renderMessages(data);
  };

  const loadDashboard = async () => {
    showStatus(adminStatus, 'Loading your dashboard…');
    try {
      await Promise.all([loadProjects(), loadMessages()]);
      showStatus(adminStatus, '');
    } catch (error) {
      showStatus(adminStatus, 'Could not load dashboard data. Please refresh and try again.');
      console.error('Could not load admin data:', error);
    }
  };

  const openDashboard = async (session) => {
    try {
      client = window.getSupabaseClient();
      if (!await verifyAdmin(session.user)) {
        await client.auth.signOut();
        loginPanel.hidden = false;
        dashboard.hidden = true;
        showStatus(loginStatus, 'This account is not on the admin allowlist.');
        return;
      }
      loginPanel.hidden = true;
      dashboard.hidden = false;
      await loadDashboard();
    } catch (error) {
      loginPanel.hidden = false;
      dashboard.hidden = true;
      showStatus(loginStatus, error.message || 'Could not verify admin access.');
      console.error('Could not verify admin account:', error);
    }
  };

  const resetProjectForm = () => {
    projectForm.reset();
    projectForm.elements.id.value = '';
    projectForm.elements.sort_order.value = '0';
    projectForm.elements.published.checked = true;
    projectFormTitle.textContent = 'Add a project';
    saveProjectButton.textContent = 'Save project';
    cancelEditButton.hidden = true;
  };

  const editProject = (project) => {
    projectForm.elements.id.value = project.id;
    projectForm.elements.title.value = project.title;
    projectForm.elements.category.value = project.category;
    projectForm.elements.description.value = project.description;
    projectForm.elements.image_url.value = project.image_url || '';
    projectForm.elements.tools.value = project.tools || '';
    projectForm.elements.sort_order.value = String(project.sort_order);
    projectForm.elements.featured.checked = project.featured;
    projectForm.elements.published.checked = project.published;
    projectFormTitle.textContent = 'Edit project';
    saveProjectButton.textContent = 'Update project';
    cancelEditButton.hidden = false;
    projectForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const deleteProject = async (project) => {
    if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    try {
      const { error } = await client.from('projects').delete().eq('id', project.id);
      if (error) throw error;
      await loadProjects();
      showStatus(adminStatus, 'Project deleted.', true);
    } catch (error) {
      showStatus(adminStatus, 'Could not delete that project. Please try again.');
      console.error('Could not delete project:', error);
    }
  };

  const setMessageRead = async (message, read) => {
    try {
      const { error } = await client
        .from('messages')
        .update({ read_at: read ? new Date().toISOString() : null })
        .eq('id', message.id);
      if (error) throw error;
      await loadMessages();
    } catch (error) {
      showStatus(adminStatus, 'Could not update the message. Please try again.');
      console.error('Could not update message:', error);
    }
  };

  const deleteMessage = async (message) => {
    if (!window.confirm(`Delete the message from ${message.name}? This cannot be undone.`)) return;
    try {
      const { error } = await client.from('messages').delete().eq('id', message.id);
      if (error) throw error;
      await loadMessages();
      showStatus(adminStatus, 'Message deleted.', true);
    } catch (error) {
      showStatus(adminStatus, 'Could not delete that message. Please try again.');
      console.error('Could not delete message:', error);
    }
  };

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    showStatus(loginStatus, 'Signing in…');
    try {
      client = window.getSupabaseClient();
      const formData = new FormData(loginForm);
      const { data, error } = await client.auth.signInWithPassword({
        email: formData.get('email').trim(),
        password: formData.get('password')
      });
      if (error) throw error;
      await openDashboard(data.session);
    } catch (error) {
      showStatus(loginStatus, error.message || 'Sign-in failed. Please try again.');
      console.error('Admin sign-in failed:', error);
    }
  });

  projectForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    showStatus(adminStatus, 'Saving project…');
    const formData = new FormData(projectForm);
    const project = {
      title: formData.get('title').trim(),
      category: formData.get('category'),
      description: formData.get('description').trim(),
      image_url: formData.get('image_url').trim() || null,
      tools: formData.get('tools').trim(),
      sort_order: Number(formData.get('sort_order')),
      featured: projectForm.elements.featured.checked,
      published: projectForm.elements.published.checked
    };

    try {
      const id = formData.get('id');
      const result = id
        ? await client.from('projects').update(project).eq('id', id)
        : await client.from('projects').insert(project);
      if (result.error) throw result.error;
      resetProjectForm();
      await loadProjects();
      showStatus(adminStatus, 'Project saved.', true);
    } catch (error) {
      showStatus(adminStatus, 'Could not save the project. Check the fields and try again.');
      console.error('Could not save project:', error);
    }
  });

  const messagesTab = document.querySelector('#messagesTab');
  const projectsTab = document.querySelector('#projectsTab');
  const messagesPanel = document.querySelector('#messagesPanel');
  const projectsPanel = document.querySelector('#projectsPanel');
  const selectTab = (showProjects) => {
    messagesPanel.hidden = showProjects;
    projectsPanel.hidden = !showProjects;
    messagesTab.classList.toggle('active', !showProjects);
    projectsTab.classList.toggle('active', showProjects);
    messagesTab.setAttribute('aria-selected', String(!showProjects));
    projectsTab.setAttribute('aria-selected', String(showProjects));
  };
  messagesTab.addEventListener('click', () => selectTab(false));
  projectsTab.addEventListener('click', () => selectTab(true));
  document.querySelector('#refreshMessages').addEventListener('click', async () => {
    try {
      await loadMessages();
      showStatus(adminStatus, 'Inbox refreshed.', true);
    } catch (error) {
      showStatus(adminStatus, 'Could not refresh your inbox.');
      console.error('Could not refresh messages:', error);
    }
  });
  cancelEditButton.addEventListener('click', resetProjectForm);
  document.querySelector('#signOutButton').addEventListener('click', async () => {
    try {
      const { error } = await client.auth.signOut();
      if (error) throw error;
      dashboard.hidden = true;
      loginPanel.hidden = false;
      loginForm.reset();
      showStatus(loginStatus, 'You have signed out.', true);
    } catch (error) {
      showStatus(adminStatus, 'Could not sign out. Please try again.');
      console.error('Admin sign-out failed:', error);
    }
  });

  try {
    client = window.getSupabaseClient();
    client.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      if (data.session) openDashboard(data.session);
    }).catch((error) => {
      showStatus(loginStatus, error.message || 'Could not check your sign-in status.');
      console.error('Could not restore admin session:', error);
    });
  } catch (error) {
    showStatus(loginStatus, 'Admin setup is incomplete. Add the Supabase URL and anon key to supabase-config.js.');
  }
});
