document.addEventListener('DOMContentLoaded', () => {
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

    if (!hasOnboarded) {
        onboardingOverlay.classList.add('show');
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

    // Location Simulation
    function simulateGPS() {
        if (!gpsStatus) return;
        gpsStatus.textContent = 'Acquiring GPS Lock...';
        gpsCoords.textContent = 'Contacting satellites...';
        
        setTimeout(() => {
            const randomLat = (37.7749 + (Math.random() - 0.5) * 0.02).toFixed(5);
            const randomLng = (-122.4194 + (Math.random() - 0.5) * 0.02).toFixed(5);
            gpsStatus.textContent = 'GPS Active (Accuracy ±4m)';
            gpsCoords.textContent = `Lat: ${randomLat}, Lng: ${randomLng}`;
        }, 800);
    }

    if (btnRefreshGps) {
        btnRefreshGps.addEventListener('click', simulateGPS);
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

            // Coordinates
            const coordsText = gpsCoords.textContent;
            let lat = 37.7749;
            let lng = -122.4194;
            
            const match = coordsText.match(/Lat:\s*([-\d.]+),\s*Lng:\s*([-\d.]+)/);
            if (match) {
                lat = parseFloat(match[1]);
                lng = parseFloat(match[2]);
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

            showToast('Incident reported successfully!', 'success');

            // Switch to Map Page to see it live
            const mapNavItem = Array.from(navItems).find(item => item.getAttribute('data-target') === 'map');
            if (mapNavItem) {
                mapNavItem.click();
            }
        });
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
        phone: '+1 (555) 019-2834',
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
            }
        } catch (error) {
            console.warn('Could not load profile from localStorage', error);
        }
        
        if (profileData.name && profileName) profileName.value = profileData.name;
        if (profileData.phone && profilePhone) profilePhone.value = profileData.phone;
        if (profileData.email && profileEmail) profileEmail.value = profileData.email;
        
        if (profileData.avatar && profileAvatar) {
            profileAvatar.src = profileData.avatar;
        }

        if (profileData.settings) {
            if (settingAutoDetect) settingAutoDetect.checked = !!profileData.settings.autoDetect;
            if (settingHighSens) settingHighSens.checked = !!profileData.settings.highSens;
            if (settingNotify) settingNotify.checked = !!profileData.settings.notify;
        }
    }

    function saveProfile() {
        if (profileName) profileData.name = profileName.value.trim();
        if (profilePhone) profileData.phone = profilePhone.value.trim();
        if (profileEmail) profileData.email = profileEmail.value.trim();
        
        profileData.settings = {
            autoDetect: settingAutoDetect ? settingAutoDetect.checked : true,
            highSens: settingHighSens ? settingHighSens.checked : false,
            notify: settingNotify ? settingNotify.checked : true
        };

        try {
            localStorage.setItem('userProfile', JSON.stringify(profileData));
            showToast('Profile saved successfully!', 'success');
        } catch (error) {
            console.error('Could not save profile to localStorage', error);
            showToast('Failed to save profile.', 'error');
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

    function showToast(message, type = 'success') {
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
    simulateGPS();
});

