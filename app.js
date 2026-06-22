// =========================================
// Supabase Client Initialization
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = 'https://paeqykisnkjmdvbarljg.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhZXF5a2lzbmtqbWR2YmFybGpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDYyNTgsImV4cCI6MjA5NTk4MjI1OH0.yL51lbtFC4dFwJSvVgjE8qUmgoaalcgTW1mez0BOiL4';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Navigation elements
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    const pageTitle = document.getElementById('page-title');

    // Page Titles corresponding to tab IDs
    const titles = {
        'home': 'Home Dashboard',
        'report': 'File Incident Report',
        'map': 'Live Map View',
        'profile': 'My Profile'
    };

    // =========================================
    // Notifications Panel Logic
    // =========================================
    const btnNotifications = document.getElementById('btn-notifications');
    const notificationsPanel = document.getElementById('notifications-panel');
    const btnCloseNotifications = document.getElementById('btn-close-notifications');
    const notificationsListContainer = document.getElementById('notifications-list');
    const notificationBadge = document.getElementById('notification-badge');

    let persistentNotifications = [];
    let unreadCount = 0;

    function addPersistentNotification(title, message, type = 'info') {
        const newNotif = {
            id: Date.now(),
            title: title,
            message: message,
            type: type,
            time: new Date()
        };
        persistentNotifications.unshift(newNotif);
        unreadCount++;
        renderNotifications();
    }

    function renderNotifications() {
        if (!notificationsListContainer) return;
        
        if (persistentNotifications.length === 0) {
            notificationsListContainer.innerHTML = `
                <div class="empty-notifications">
                    <i class="ph-duotone ph-bell-slash"></i>
                    <p>No notifications yet</p>
                </div>
            `;
        } else {
            notificationsListContainer.innerHTML = '';
            persistentNotifications.forEach(notif => {
                const item = document.createElement('div');
                item.className = `notification-item type-${notif.type}`;
                
                let iconClass = 'ph-info';
                if (notif.type === 'success') iconClass = 'ph-check-circle';
                if (notif.type === 'error') iconClass = 'ph-warning-circle';
                if (notif.type === 'warning') iconClass = 'ph-warning';

                const timeString = notif.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                item.innerHTML = `
                    <div class="notification-icon"><i class="ph ${iconClass}"></i></div>
                    <div class="notification-content">
                        <h4>${notif.title}</h4>
                        <p>${notif.message}</p>
                        <span class="notification-time">${timeString}</span>
                    </div>
                `;
                notificationsListContainer.appendChild(item);
            });
        }

        if (notificationBadge) {
            if (unreadCount > 0) {
                notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                notificationBadge.style.display = 'inline-block';
            } else {
                notificationBadge.style.display = 'none';
            }
        }
    }

    if (btnNotifications && notificationsPanel) {
        btnNotifications.addEventListener('click', () => {
            notificationsPanel.classList.toggle('open');
            if (notificationsPanel.classList.contains('open')) {
                unreadCount = 0; // mark as read when opened
                renderNotifications();
            }
        });
    }

    if (btnCloseNotifications && notificationsPanel) {
        btnCloseNotifications.addEventListener('click', () => {
            notificationsPanel.classList.remove('open');
        });
    }

    // Shared incidents state
    let incidents = [
        {
            id: 1,
            type: 'Collision',
            severity: 'Critical',
            description: 'Multi-vehicle collision near Main St & 4th Ave.',
            lat: 37.7749,
            lng: -122.4194,
            time: '12 mins ago',
            icon: 'ph ph-car-crash',
            x: 360,
            y: 180
        },
        {
            id: 2,
            type: 'Hazard',
            severity: 'Minor',
            description: 'Road debris / tire hazard blocking middle lane.',
            lat: 37.7833,
            lng: -122.4167,
            time: '1 hr ago',
            icon: 'ph ph-warning-octagon',
            x: 520,
            y: 400
        }
    ];

    // Navigation Click Handler
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const targetId = this.getAttribute('data-target');

            if (titles[targetId]) {
                pageTitle.textContent = titles[targetId];
            }

            pages.forEach(page => page.classList.remove('active'));

            const targetPage = document.getElementById(targetId);
            if (targetPage) {
                targetPage.classList.add('active');
            }

            // Sync interactions when switching tabs
            if (targetId === 'map') {
                renderMapIncidents();
                renderMapMarkers();
            } else if (targetId === 'home') {
                renderDashboard();
            }

            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50);
            }
        });
    });

    // =========================================
    // Onboarding Logic
    // =========================================
    const onboardingOverlay = document.getElementById('onboarding-overlay');
    const slides = document.querySelectorAll('.onboarding-slide');
    const dots = document.querySelectorAll('.dot');
    const btnNext = document.getElementById('btn-next');
    const btnSkip = document.getElementById('btn-skip');
    let currentSlideIndex = 0;

    let hasOnboarded = false;
    try {
        hasOnboarded = localStorage.getItem('hasOnboarded');
    } catch (error) {
        console.warn('localStorage is blocked. Showing onboarding by default.', error);
    }

    let currentUser = null;

    if (!hasOnboarded) {
        onboardingOverlay.classList.add('show');
    } else {
        // Only check auth state if onboarding is done
        checkAuthState();
    }

    function updateSlides(newIndex) {
        slides[currentSlideIndex].classList.remove('active');
        slides[currentSlideIndex].classList.add('previous');
        dots[currentSlideIndex].classList.remove('active');

        currentSlideIndex = newIndex;

        slides[currentSlideIndex].classList.remove('previous');
        slides[currentSlideIndex].classList.add('active');
        dots[currentSlideIndex].classList.add('active');

        if (currentSlideIndex === slides.length - 1) {
            btnNext.textContent = 'Get Started';
        } else {
            btnNext.textContent = 'Next';
        }
    }

    function completeOnboarding() {
        try {
            localStorage.setItem('hasOnboarded', 'true');
        } catch (error) {
            console.warn('Could not set localStorage', error);
        }
        onboardingOverlay.classList.remove('show');
        setTimeout(() => {
            onboardingOverlay.style.display = 'none';
            checkAuthState(); // Check auth after onboarding
        }, 400);
    }

    if(btnNext) {
        btnNext.addEventListener('click', () => {
            if (currentSlideIndex < slides.length - 1) {
                updateSlides(currentSlideIndex + 1);
            } else {
                completeOnboarding();
            }
        });
    }

    if(btnSkip) {
        btnSkip.addEventListener('click', completeOnboarding);
    }

    // =========================================
    // Supabase Auth Logic
    // =========================================
    const authOverlay = document.getElementById('auth-overlay');
    const btnGoogleAuth = document.getElementById('btn-google-auth');
    const btnSignout = document.getElementById('btn-signout');

    // Handle Google Sign-in
    if (btnGoogleAuth) {
        btnGoogleAuth.addEventListener('click', async () => {
            btnGoogleAuth.disabled = true;
            btnGoogleAuth.innerHTML = 'Signing in...';
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) {
                console.error('Error signing in:', error.message);
                showToast('Sign in failed. Please try again.', 'error');
                btnGoogleAuth.disabled = false;
                btnGoogleAuth.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo" class="google-logo"> Continue with Google';
            }
        });
    }

    // Handle Sign-out
    if (btnSignout) {
        btnSignout.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Error signing out:', error.message);
                showToast('Sign out failed.', 'error');
            } else {
                showToast('Signed out successfully.', 'success');
                sessionStorage.removeItem('welcomeNotified');
                // Clean the URL to remove any lingering OAuth tokens
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        });
    }

    // Listen for Auth State Changes
    supabase.auth.onAuthStateChange((event, session) => {
        console.log(`Auth event: ${event}`, session);
        if (session) {
            currentUser = session.user;
            authOverlay.style.display = 'none';
            updateProfileWithAuthData(currentUser);
            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                // To avoid repeating on every reload, we can check a session storage flag
                if (!sessionStorage.getItem('welcomeNotified')) {
                    const name = currentUser.user_metadata?.full_name || 'User';
                    showToast(`Welcome back, ${name}!`, 'success', 'Login Successful');
                    sessionStorage.setItem('welcomeNotified', 'true');
                }
            }
        } else {
            currentUser = null;
            // Only show auth overlay if onboarding is complete
            if (localStorage.getItem('hasOnboarded') === 'true') {
                authOverlay.style.display = 'flex';
            }
        }
    });

    async function checkAuthState() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            authOverlay.style.display = 'flex';
        } else {
            currentUser = session.user;
            authOverlay.style.display = 'none';
            updateProfileWithAuthData(currentUser);
        }
    }

    function updateProfileWithAuthData(user) {
        if (!user) return;
        
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profileAvatar = document.getElementById('profile-avatar');
        const profilePhone = document.getElementById('profile-phone');

        if (user.user_metadata) {
            if (profileName && user.user_metadata.full_name) {
                profileName.value = user.user_metadata.full_name;
            }
            if (profilePhone && user.user_metadata.phone) {
                profilePhone.value = user.user_metadata.phone;
            }
            if (profileAvatar && user.user_metadata.avatar_url) {
                profileAvatar.src = user.user_metadata.avatar_url;
            }
        }
        if (profileEmail && user.email) {
            profileEmail.value = user.email;
        }
    }

    // =========================================
    // Dashboard Logic
    // =========================================
    const statSafetyScore = document.getElementById('stat-safety-score');
    const statTotalDrives = document.getElementById('stat-total-drives');
    const statIncidents = document.getElementById('stat-incidents');
    const activityList = document.getElementById('activity-list');
    const btnTestSensors = document.getElementById('btn-test-sensors');

    function renderDashboard() {
        // Update stats
        if (statIncidents) {
            statIncidents.textContent = incidents.length;
            const incidentCard = statIncidents.closest('.stat-card');
            if (incidents.length > 0) {
                incidentCard.classList.add('pulse-active');
            } else {
                incidentCard.classList.remove('pulse-active');
            }
        }

        // Render drive logs + custom reports
        if (activityList) {
            activityList.innerHTML = '';
            
            // Standard logs
            const defaultLogs = [
                {
                    title: 'Commute to Work',
                    desc: 'Today, 8:42 AM • 12.4 miles • Safe Drive',
                    badgeText: '99%',
                    badgeClass: 'badge-success',
                    iconClass: 'safe',
                    icon: 'ph ph-check'
                },
                {
                    title: 'Grocery Run',
                    desc: 'Yesterday, 5:15 PM • 3.2 miles • Safe Drive',
                    badgeText: '97%',
                    badgeClass: 'badge-success',
                    iconClass: 'safe',
                    icon: 'ph ph-check'
                }
            ];

            // Render newly reported incidents in feed
            incidents.forEach(inc => {
                let badgeClass = 'badge-danger';
                let iconClass = 'danger';
                if (inc.severity === 'Minor') {
                    badgeClass = 'badge-warning';
                    iconClass = 'warning';
                }
                
                const item = document.createElement('div');
                item.className = 'activity-item';
                item.innerHTML = `
                    <div class="activity-icon ${iconClass}"><i class="ph ph-warning"></i></div>
                    <div class="activity-info">
                        <h4>Reported: ${inc.type}</h4>
                        <p>${inc.time} • ${inc.description}</p>
                    </div>
                    <span class="badge ${badgeClass}">${inc.severity}</span>
                `;
                activityList.appendChild(item);
            });

            // Render default drives
            defaultLogs.forEach(log => {
                const item = document.createElement('div');
                item.className = 'activity-item';
                item.innerHTML = `
                    <div class="activity-icon ${log.iconClass}"><i class="${log.icon}"></i></div>
                    <div class="activity-info">
                        <h4>${log.title}</h4>
                        <p>${log.desc}</p>
                    </div>
                    <span class="badge ${log.badgeClass}">${log.badgeText}</span>
                `;
                activityList.appendChild(item);
            });
        }
    }

    if (btnTestSensors) {
        btnTestSensors.addEventListener('click', () => {
            showToast('Calibrating G-Force accelerometer sensors...', 'success');
            btnTestSensors.disabled = true;
            btnTestSensors.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Testing...';
            setTimeout(() => {
                showToast('Sensor self-check: All systems nominal!', 'success');
                btnTestSensors.disabled = false;
                btnTestSensors.innerHTML = '<i class="ph ph-activity"></i> Run Test';
            }, 1500);
        });
    }

    // =========================================
    // Incident Reporting Logic
    // =========================================
    const reportForm = document.getElementById('incident-report-form');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const severityRange = document.getElementById('report-severity');
    const severitySpans = document.querySelectorAll('.severity-labels span');
    const gpsStatus = document.getElementById('report-gps-status');
    const gpsCoords = document.getElementById('report-gps-coords');
    const btnRefreshGps = document.getElementById('btn-re-detect-gps');
    
    const reportPhoto = document.getElementById('report-photo');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const uploadPreview = document.getElementById('upload-preview');
    const btnRemovePreview = document.getElementById('btn-remove-preview');

    let selectedType = 'Collision';

    // Category Select Handler
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                selectedType = radio.value;
            }
        });
    });

    // Severity Slider Handler
    if (severityRange) {
        severityRange.addEventListener('input', function() {
            const val = this.value;
            severitySpans.forEach(span => {
                if (span.getAttribute('data-value') === val || span.id === `label-sev-${val}`) {
                    span.classList.add('active');
                } else {
                    span.classList.remove('active');
                }
            });
        });
    }

    // =========================================
    // Real GPS via HTML5 Geolocation API
    // =========================================
    let currentLat = null;
    let currentLng = null;

    function acquireDeviceLocation() {
        if (!gpsStatus) return;
        gpsStatus.textContent = 'Acquiring GPS Lock...';
        if (gpsCoords) gpsCoords.textContent = 'Requesting device location...';

        if (!navigator.geolocation) {
            gpsStatus.textContent = 'GPS Not Supported';
            if (gpsCoords) gpsCoords.textContent = 'Your browser does not support geolocation.';
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLat = position.coords.latitude;
                currentLng = position.coords.longitude;
                const accuracy = position.coords.accuracy.toFixed(0);
                if (gpsStatus) gpsStatus.textContent = `GPS Active (Accuracy ±${accuracy}m)`;
                if (gpsCoords) gpsCoords.textContent = `Lat: ${currentLat.toFixed(6)}, Lng: ${currentLng.toFixed(6)}`;
            },
            (error) => {
                let msg = 'Location unavailable.';
                if (error.code === 1) msg = 'Location access denied by user.';
                if (error.code === 2) msg = 'Position unavailable (no signal).';
                if (error.code === 3) msg = 'Location request timed out.';
                if (gpsStatus) gpsStatus.textContent = msg;
                if (gpsCoords) gpsCoords.textContent = 'Could not retrieve GPS coordinates.';
                showToast(msg, 'error');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }

    if (btnRefreshGps) {
        btnRefreshGps.addEventListener('click', acquireDeviceLocation);
    }

    // Photo Attachment Handler
    if (reportPhoto) {
        reportPhoto.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                showToast('Please select an image file.', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                uploadPreview.src = event.target.result;
                uploadPreview.style.display = 'block';
                uploadPlaceholder.style.display = 'none';
                btnRemovePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        });
    }

    if (btnRemovePreview) {
        btnRemovePreview.addEventListener('click', (e) => {
            e.preventDefault();
            reportPhoto.value = '';
            uploadPreview.src = '';
            uploadPreview.style.display = 'none';
            uploadPlaceholder.style.display = 'flex';
            btnRemovePreview.style.display = 'none';
        });
    }

    // Form Submit Handler
    if (reportForm) {
        reportForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const descriptionVal = document.getElementById('report-description').value.trim();
            if (!descriptionVal) {
                showToast('Please enter an incident description.', 'error');
                return;
            }

            // Severity level text mapping
            const severityLevel = severityRange ? severityRange.value : '1';
            let severityText = 'Minor';
            if (severityLevel === '2') severityText = 'Moderate';
            if (severityLevel === '3') severityText = 'Critical';

            // Coordinates — use real GPS if available
            let lat = currentLat;
            let lng = currentLng;

            if (!lat || !lng) {
                // Fallback: try parsing from the UI text
                const coordsText = gpsCoords ? gpsCoords.textContent : '';
                const match = coordsText.match(/Lat:\s*([-\d.]+),\s*Lng:\s*([-\d.]+)/);
                if (match) {
                    lat = parseFloat(match[1]);
                    lng = parseFloat(match[2]);
                } else {
                    showToast('GPS coordinates not available. Please allow location access.', 'error');
                    return;
                }
            }

            // Calculate SVG coordinates
            // Map bounds approx matching SVG viewport (800x600)
            const mapX = Math.floor(Math.random() * 550 + 100);
            const mapY = Math.floor(Math.random() * 320 + 80);

            // Icon class lookup
            let iconClass = 'ph ph-warning';
            if (selectedType === 'Collision') iconClass = 'ph ph-car-crash';
            if (selectedType === 'Breakdown') iconClass = 'ph ph-wrench';
            if (selectedType === 'Medical') iconClass = 'ph ph-first-aid';
            if (selectedType === 'Hazard') iconClass = 'ph ph-warning-octagon';

            const newIncident = {
                id: Date.now(),
                type: selectedType,
                severity: severityText,
                description: descriptionVal,
                lat: lat,
                lng: lng,
                time: 'Just now',
                icon: iconClass,
                x: mapX,
                y: mapY
            };

            incidents.unshift(newIncident);

            // Save to Supabase backend
            saveIncidentToSupabase(newIncident);

            // Reset form
            reportForm.reset();
            if (btnRemovePreview) btnRemovePreview.click();
            selectedType = 'Collision';
            categoryBtns.forEach(btn => btn.classList.remove('active'));
            const collisionBtn = document.getElementById('cat-collision');
            if (collisionBtn) collisionBtn.classList.add('active');
            if (severityRange) severityRange.value = '1';
            severitySpans.forEach(s => {
                if (s.id === 'label-sev-1') s.classList.add('active');
                else s.classList.remove('active');
            });

            showToast('Incident reported & saved to database!', 'success');

            // Switch to Map Page to see it live
            const mapNavItem = Array.from(navItems).find(item => item.getAttribute('data-target') === 'map');
            if (mapNavItem) {
                mapNavItem.click();
            }
        });
    }

    // =========================================
    // Supabase: Save Incident
    // =========================================
    async function saveIncidentToSupabase(incident) {
        try {
            const payload = {
                type: incident.type,
                severity: incident.severity,
                description: incident.description,
                latitude: incident.lat,
                longitude: incident.lng,
                status: 'active'
            };

            // Attach reporter info from saved profile
            try {
                const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                if (profile.name) payload.reporter_name = profile.name;
                if (profile.phone) payload.reporter_phone = profile.phone;
            } catch(e) { /* ignore */ }

            const { data, error } = await supabase
                .from('incidents')
                .insert([payload])
                .select();

            if (error) {
                console.error('Supabase insert error:', error);
                showToast('Saved locally. Backend sync failed.', 'error');
            } else {
                console.log('Incident saved to Supabase:', data);
            }
        } catch (err) {
            console.error('Unexpected error saving to Supabase:', err);
        }
    }

    // =========================================
    // Supabase: Load Incidents on Startup
    // =========================================
    async function loadIncidentsFromSupabase() {
        try {
            const { data, error } = await supabase
                .from('incidents')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.warn('Could not load incidents from Supabase:', error);
                return;
            }

            if (data && data.length > 0) {
                // Map DB records to local incident format
                const remoteIncidents = data.map((rec, i) => ({
                    id: rec.id,
                    type: rec.type,
                    severity: rec.severity,
                    description: rec.description,
                    lat: rec.latitude,
                    lng: rec.longitude,
                    time: formatTimeAgo(rec.created_at),
                    icon: getIconForType(rec.type),
                    x: Math.floor(Math.random() * 550 + 100),
                    y: Math.floor(Math.random() * 320 + 80)
                }));

                // Merge: remote incidents first, then keep any local-only ones
                const remoteIds = new Set(remoteIncidents.map(r => r.id));
                const localOnly = incidents.filter(inc => !remoteIds.has(inc.id));
                incidents = [...remoteIncidents, ...localOnly];

                renderDashboard();
                showToast(`Loaded ${remoteIncidents.length} incident(s) from database.`, 'success');
            }
        } catch (err) {
            console.error('Unexpected error loading from Supabase:', err);
        }
    }

    function getIconForType(type) {
        if (type === 'Collision') return 'ph ph-car-crash';
        if (type === 'Breakdown') return 'ph ph-wrench';
        if (type === 'Medical') return 'ph ph-first-aid';
        if (type === 'Hazard') return 'ph ph-warning-octagon';
        return 'ph ph-warning';
    }

    function formatTimeAgo(isoString) {
        const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
        return `${Math.floor(diff / 86400)} day(s) ago`;
    }

    // Dummy closing brace to satisfy existing structure — actual closing is below
    if (false) {
    }

    // =========================================
    // Live Map Logic
    // =========================================
    const mockMap = document.getElementById('mock-map');
    const mapMarkersLayer = document.getElementById('map-markers-layer');
    const mapIncidentList = document.getElementById('map-incident-list');
    const mapSearch = document.getElementById('map-search');
    
    const mapZoomIn = document.getElementById('map-zoom-in');
    const mapZoomOut = document.getElementById('map-zoom-out');
    const mapRecenter = document.getElementById('map-recenter');

    let currentZoom = 1.0;

    function renderMapIncidents(filterText = '') {
        if (!mapIncidentList) return;
        mapIncidentList.innerHTML = '';

        const query = filterText.toLowerCase().trim();
        const filtered = incidents.filter(inc => {
            return inc.type.toLowerCase().includes(query) || 
                   inc.description.toLowerCase().includes(query) ||
                   inc.severity.toLowerCase().includes(query);
        });

        if (filtered.length === 0) {
            mapIncidentList.innerHTML = `
                <div style="text-align: center; color: var(--text-light); padding: 24px; font-size: 13px;">
                    No matching alerts found.
                </div>
            `;
            return;
        }

        filtered.forEach(inc => {
            const item = document.createElement('div');
            item.className = `map-incident-item ${inc.severity.toLowerCase()}`;
            item.setAttribute('data-id', inc.id);
            
            let iconCode = 'ph ph-warning';
            if (inc.type === 'Collision') iconCode = 'ph ph-car-crash';
            if (inc.type === 'Breakdown') iconCode = 'ph ph-wrench';
            if (inc.type === 'Medical') iconCode = 'ph ph-first-aid';
            if (inc.type === 'Hazard') iconCode = 'ph ph-warning-octagon';

            item.innerHTML = `
                <div class="map-incident-icon"><i class="${iconCode}"></i></div>
                <div class="map-incident-details">
                    <h4>${inc.type} Alert</h4>
                    <p>${inc.description}</p>
                </div>
                <span class="badge ${inc.severity === 'Critical' ? 'badge-danger' : inc.severity === 'Moderate' ? 'badge-warning' : 'badge-success'}">${inc.severity}</span>
            `;

            item.addEventListener('click', () => {
                // Remove active highlight from all items
                document.querySelectorAll('.map-incident-item').forEach(el => el.classList.remove('active-item'));
                item.classList.add('active-item');

                // Bounce corresponding marker
                const marker = document.querySelector(`.map-marker[data-id="${inc.id}"]`);
                if (marker) {
                    marker.style.transform = 'scale(1.4) translateY(-8px)';
                    setTimeout(() => {
                        marker.style.transform = '';
                    }, 800);
                }
                
                showToast(`Viewing details for ${inc.type} incident.`, 'success');
            });

            mapIncidentList.appendChild(item);
        });
    }

    function renderMapMarkers() {
        if (!mapMarkersLayer) return;
        mapMarkersLayer.innerHTML = '';

        incidents.forEach(inc => {
            const marker = document.createElement('div');
            marker.className = `map-marker severity-${inc.severity.toLowerCase()}`;
            marker.style.left = `${inc.x}px`;
            marker.style.top = `${inc.y}px`;
            marker.setAttribute('data-id', inc.id);

            marker.innerHTML = `
                <div class="marker-pulse"></div>
                <div class="marker-pin"></div>
            `;

            marker.addEventListener('click', () => {
                // Scroll side bar item into view and click it
                const listItem = document.querySelector(`.map-incident-item[data-id="${inc.id}"]`);
                if (listItem) {
                    listItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    listItem.click();
                }
            });

            mapMarkersLayer.appendChild(marker);
        });
    }

    if (mapSearch) {
        mapSearch.addEventListener('input', function() {
            renderMapIncidents(this.value);
        });
    }

    // Map Zoom Actions
    if (mapZoomIn && mockMap) {
        mapZoomIn.addEventListener('click', () => {
            if (currentZoom < 1.6) {
                currentZoom += 0.15;
                const canvas = mockMap.querySelector('.map-background-canvas');
                const markers = mockMap.querySelector('.markers-layer');
                canvas.style.transform = `scale(${currentZoom})`;
                canvas.style.transformOrigin = 'center center';
                canvas.style.transition = 'transform 0.3s ease';
                showToast(`Zoomed In to ${(currentZoom*100).toFixed(0)}%`, 'success');
            }
        });
    }

    if (mapZoomOut && mockMap) {
        mapZoomOut.addEventListener('click', () => {
            if (currentZoom > 0.8) {
                currentZoom -= 0.15;
                const canvas = mockMap.querySelector('.map-background-canvas');
                canvas.style.transform = `scale(${currentZoom})`;
                canvas.style.transformOrigin = 'center center';
                canvas.style.transition = 'transform 0.3s ease';
                showToast(`Zoomed Out to ${(currentZoom*100).toFixed(0)}%`, 'success');
            }
        });
    }

    if (mapRecenter && mockMap) {
        mapRecenter.addEventListener('click', () => {
            currentZoom = 1.0;
            const canvas = mockMap.querySelector('.map-background-canvas');
            canvas.style.transform = 'scale(1)';
            canvas.style.transition = 'transform 0.3s ease';
            showToast('Map viewport recentered.', 'success');
        });
    }

    // =========================================
    // Manual SOS Logic
    // =========================================
    const btnManualSOS = document.getElementById('btn-manual-sos');
    const sosModal = document.getElementById('sos-modal');
    const sosCountdown = document.getElementById('sos-countdown');
    const sosTimerLabel = document.getElementById('sos-timer-label');
    const btnCancelSOS = document.getElementById('btn-cancel-sos');

    let sosTimerInterval = null;
    let sosCount = 3;

    function triggerSOS() {
        sosCount = 3;
        if (sosCountdown) sosCountdown.textContent = sosCount;
        if (sosTimerLabel) sosTimerLabel.textContent = `${sosCount} seconds`;
        if (sosModal) sosModal.classList.add('show-sos');

        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate([100, 50, 100, 50, 300]);
        }

        sosTimerInterval = setInterval(() => {
            sosCount--;
            if (sosCountdown) sosCountdown.textContent = sosCount;
            if (sosTimerLabel) sosTimerLabel.textContent = `${sosCount} seconds`;

            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(80);
            }

            if (sosCount <= 0) {
                clearInterval(sosTimerInterval);
                sosModal.classList.remove('show-sos');
                
                // Add SOS Incident report
                const coordsText = gpsCoords ? gpsCoords.textContent : 'Lat: 37.7749, Lng: -122.4194';
                let lat = 37.7749;
                let lng = -122.4194;
                const match = coordsText.match(/Lat:\s*([-\d.]+),\s*Lng:\s*([-\d.]+)/);
                if (match) {
                    lat = parseFloat(match[1]);
                    lng = parseFloat(match[2]);
                }

                const sosIncident = {
                    id: Date.now(),
                    type: 'Medical',
                    severity: 'Critical',
                    description: 'CRITICAL: Manual SOS triggered by operator.',
                    lat: lat,
                    lng: lng,
                    time: 'Just now',
                    icon: 'ph ph-first-aid',
                    x: Math.floor(Math.random() * 500 + 150),
                    y: Math.floor(Math.random() * 300 + 100)
                };

                incidents.unshift(sosIncident);
                showToast('CRITICAL: SOS Alert sent to local emergency dispatch!', 'error');
                
                // Route to live map
                const mapNavItem = Array.from(navItems).find(item => item.getAttribute('data-target') === 'map');
                if (mapNavItem) {
                    mapNavItem.click();
                }
            }
        }, 1000);
    }

    if (btnManualSOS) {
        btnManualSOS.addEventListener('click', triggerSOS);
    }

    if (btnCancelSOS) {
        btnCancelSOS.addEventListener('click', () => {
            clearInterval(sosTimerInterval);
            if (sosModal) sosModal.classList.remove('show-sos');
            showToast('SOS broadcast cancelled successfully.', 'success');
        });
    }

    // =========================================
    // Profile Management Logic
    // =========================================
    const profileAvatar = document.getElementById('profile-avatar');
    const avatarUpload = document.getElementById('avatar-upload');
    const profileName = document.getElementById('profile-name');
    const profilePhone = document.getElementById('profile-phone');
    const profileEmail = document.getElementById('profile-email');
    
    const settingAutoDetect = document.getElementById('setting-auto-detect');
    const settingHighSens = document.getElementById('setting-high-sens');
    const settingNotify = document.getElementById('setting-notify');
    const btnSaveProfile = document.getElementById('btn-save-profile');
    const toastContainer = document.getElementById('toast-container');

    let profileData = {
        name: 'John Doe',
        phone: '',
        email: 'johndoe@example.com',
        avatar: '',
        settings: {
            autoDetect: true,
            highSens: false,
            notify: true
        }
    };

    function loadProfile() {
        try {
            const savedData = localStorage.getItem('userProfile');
            if (savedData) {
                profileData = JSON.parse(savedData);
                if (profileData.phone && profileData.phone.includes('555')) {
                    profileData.phone = '';
                    localStorage.setItem('userProfile', JSON.stringify(profileData));
                }
            }
        } catch (error) {
            console.warn('Could not load profile from localStorage', error);
        }
        
        if (profileName) profileName.value = profileData.name || '';
        if (profilePhone) profilePhone.value = profileData.phone || '';
        if (profileEmail) profileEmail.value = profileData.email || '';
        
        if (profileData.avatar && profileAvatar) {
            profileAvatar.src = profileData.avatar;
        }

        if (profileData.settings) {
            if (settingAutoDetect) settingAutoDetect.checked = !!profileData.settings.autoDetect;
            if (settingHighSens) settingHighSens.checked = !!profileData.settings.highSens;
            if (settingNotify) settingNotify.checked = !!profileData.settings.notify;
        }
    }

    async function saveProfile() {
        if (profileName) profileData.name = profileName.value.trim();
        if (profilePhone) profileData.phone = profilePhone.value.trim();
        if (profileEmail) profileData.email = profileEmail.value.trim();
        
        profileData.settings = {
            autoDetect: settingAutoDetect ? settingAutoDetect.checked : true,
            highSens: settingHighSens ? settingHighSens.checked : false,
            notify: settingNotify ? settingNotify.checked : true
        };

        if (btnSaveProfile) {
            btnSaveProfile.disabled = true;
            btnSaveProfile.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Saving...';
        }

        try {
            // Save locally
            localStorage.setItem('userProfile', JSON.stringify(profileData));
            
            // Sync with Supabase if logged in
            if (currentUser) {
                const updates = {
                    full_name: profileData.name,
                    phone: profileData.phone
                };
                
                // Prevent large base64 strings from crashing the auth metadata payload
                if (profileData.avatar && !profileData.avatar.startsWith('data:image')) {
                    updates.avatar_url = profileData.avatar;
                }

                const { error } = await supabase.auth.updateUser({ data: updates });

                if (error) {
                    console.error('Supabase profile sync error:', error);
                    showToast('Saved locally, but backend sync failed.', 'warning');
                } else {
                    showToast('Profile saved and synced successfully!', 'success');
                }
            } else {
                showToast('Profile saved locally!', 'success');
            }
        } catch (error) {
            console.error('Could not save profile', error);
            showToast('Failed to save profile.', 'error');
        } finally {
            if (btnSaveProfile) {
                btnSaveProfile.disabled = false;
                btnSaveProfile.innerHTML = '<i class="ph ph-floppy-disk"></i> Save Profile';
            }
        }
    }

    if (avatarUpload) {
        avatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                showToast('Please select a valid image file.', 'error');
                return;
            }

            if (file.size > 2 * 1024 * 1024) {
                showToast('Image size should be less than 2MB.', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                if (profileAvatar) profileAvatar.src = event.target.result;
                profileData.avatar = event.target.result;
                showToast('Avatar updated. Remember to Save Profile!', 'success');
            };
            reader.readAsDataURL(file);
        });
    }

    function showToast(message, type = 'success', title = null) {
        if (!title) {
            title = type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Notification';
        }
        
        // Also add to persistent notifications panel
        addPersistentNotification(title, message, type);

        if (!toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const iconClass = type === 'success' ? 'ph ph-check-circle' : 'ph ph-warning-circle';
        
        toast.innerHTML = `
            <i class="${iconClass}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    if (btnSaveProfile) {
        btnSaveProfile.addEventListener('click', saveProfile);
    }

    // Initialize Page Content
    loadProfile();
    renderDashboard();
    acquireDeviceLocation();
    loadIncidentsFromSupabase();

    // =========================================
    // Google Maps Iframe Logic (No API Key)
    // =========================================
    const mapFrame = document.getElementById('google-map-frame');
    const mapLoading = document.getElementById('map-loading');
    const btnMapLocate = document.getElementById('btn-map-locate');
    const layerBtns = document.querySelectorAll('.map-layer-btn');

    let mapLat = null;
    let mapLng = null;
    let mapType = 'm'; // m=road, k=satellite, h=hybrid, p=terrain

    function buildMapUrl(lat, lng, type) {
        return `https://maps.google.com/maps?q=${lat},${lng}&z=15&t=${type}&output=embed&iwloc=near`;
    }

    function updateMap(lat, lng, type) {
        if (!mapFrame) return;
        mapLat = lat;
        mapLng = lng;
        mapType = type || mapType;
        mapFrame.src = buildMapUrl(mapLat, mapLng, mapType);
        if (mapLoading) mapLoading.style.display = 'flex';
        mapFrame.onload = () => {
            if (mapLoading) mapLoading.style.display = 'none';
        };
    }

    function initMap() {
        if (!mapFrame) return;
        if (mapLoading) mapLoading.style.display = 'flex';

        // Fast path: if we already have highly accurate GPS from the report tab, use it instantly!
        if (currentLat !== null && currentLng !== null) {
            updateMap(currentLat, currentLng, mapType);
            return;
        }

        // Otherwise, do a rapid low-accuracy check so the map loads in milliseconds
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                updateMap(pos.coords.latitude, pos.coords.longitude, mapType);
            },
            () => {
                // Fallback to a central location (Nigeria) if denied
                updateMap(9.0579, 7.4951, mapType);
                if (mapLoading) mapLoading.style.display = 'none';
            },
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
        );
    }

    // Layer switcher buttons
    layerBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            layerBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            mapType = btn.dataset.maptype;
            if (mapLat !== null && mapLng !== null) {
                updateMap(mapLat, mapLng, mapType);
            }
        });
    });

    // Locate / re-center button
    if (btnMapLocate) {
        btnMapLocate.addEventListener('click', initMap);
    }

    // Auto-init the map when user taps the Map tab
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.dataset.page === 'map' && mapLat === null) {
                initMap();
            }
        });
    });
});

