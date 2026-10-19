document.addEventListener('DOMContentLoaded', () => {
  const projectImagePlaceholders = [
    'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=900&q=80'
  ];
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectGrid = document.querySelector('#projectGrid');
  const portfolioStatus = document.querySelector('#portfolioStatus');
  const contactForm = document.querySelector('#contactForm');
  const contactStatus = document.querySelector('#contactStatus');
  let currentFilter = 'all';
  const revealElements = document.querySelectorAll(
    '.hero-copy, .hero-visual, .about-card, .process-section, .portfolio, .blog-section, .expertise, .tools-section, .testimonial-section, .contact, .project-card'
  );

  const applyProjectFilter = () => {
    projectGrid.querySelectorAll('.project-card').forEach((card) => {
      const categoryMatches = currentFilter === 'all'
        || currentFilter === 'featured'
        || card.dataset.category === currentFilter;
      const featuredMatches = currentFilter !== 'featured' || card.dataset.featured === 'true';
      const shouldShow = categoryMatches && featuredMatches;
      card.classList.toggle('hidden', !shouldShow);
      if (shouldShow) card.classList.add('is-visible');
    });
  };

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      currentFilter = button.dataset.filter;
      filterButtons.forEach((btn) => {
        const isActive = btn === button;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
      });
      applyProjectFilter();
    });
  });

  const createProjectCard = (project, index) => {
    const card = document.createElement('article');
    card.className = 'project-card';
    card.dataset.category = project.category;
    card.dataset.featured = String(project.featured);

    const image = document.createElement('div');
    image.className = 'project-image';
    const fallbackImage = projectImagePlaceholders[index % projectImagePlaceholders.length];
    const imageElement = document.createElement('img');
    imageElement.src = project.image_url || fallbackImage;
    imageElement.alt = project.title;
    imageElement.loading = 'lazy';
    if (project.image_url) {
      imageElement.addEventListener('error', () => {
        imageElement.src = fallbackImage;
      }, { once: true });
    }
    image.append(imageElement);

    const body = document.createElement('div');
    body.className = 'project-body';
    const meta = document.createElement('div');
    meta.className = 'project-meta';
    meta.textContent = project.category === 'laser' ? 'Laser Work' : 'Graphic Design';
    const title = document.createElement('h3');
    title.textContent = project.title;
    const description = document.createElement('p');
    description.textContent = project.description;
    const footer = document.createElement('div');
    footer.className = 'project-footer';
    const tools = document.createElement('span');
    tools.textContent = project.tools;
    footer.append(tools);
    body.append(meta, title, description, footer);

    if (project.featured) {
      const badge = document.createElement('span');
      badge.className = 'featured-badge';
      badge.textContent = 'Featured';
      image.append(badge);
    }

    card.append(image, body);
    return card;
  };

  const loadProjects = async () => {
    if (!window.getSupabaseClient || !window.APP_CONFIG?.supabaseUrl || !window.APP_CONFIG?.supabaseAnonKey) {
      return;
    }

    try {
      portfolioStatus.textContent = 'Loading selected work…';
      const client = window.getSupabaseClient();
      const { data, error } = await client
        .from('projects')
        .select('id, title, category, description, image_url, tools, featured, sort_order')
        .eq('published', true)
        .order('featured', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      projectGrid.replaceChildren(...data.map(createProjectCard));
      portfolioStatus.textContent = data.length ? '' : 'New work is on the way.';
      applyProjectFilter();
    } catch (error) {
      portfolioStatus.textContent = 'Showing the sample portfolio. Project updates are temporarily unavailable.';
      console.error('Could not load portfolio projects:', error);
    }
  };

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    contactStatus.textContent = '';

    try {
      const client = window.getSupabaseClient();
      const formData = new FormData(contactForm);
      const submission = Object.fromEntries(formData.entries());
      const { error } = await client.from('messages').insert({
        name: submission.name.trim(),
        email: submission.email.trim(),
        subject: submission.subject.trim(),
        message: submission.message.trim()
      });

      if (error) throw error;
      contactForm.reset();
      contactStatus.textContent = 'Thanks for reaching out. Your message has been sent.';
      contactStatus.classList.add('success');
    } catch (error) {
      contactStatus.textContent = window.APP_CONFIG?.supabaseUrl
        ? 'Your message could not be sent right now. Please try again or email me directly.'
        : 'The contact form is not set up yet. Please email me directly at mdarmanhosseny2003@gmail.com.';
      contactStatus.classList.remove('success');
      console.error('Could not submit contact message:', error);
    }
  });

  loadProjects();

  if (!('IntersectionObserver' in window)) {
    revealElements.forEach((element) => element.classList.add('reveal', 'is-visible'));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
  );

  revealElements.forEach((element) => {
    element.classList.add('reveal');
    revealObserver.observe(element);
  });
});
